import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";
import { generateLabelPdf, calculatePageCount, type LabelBox } from "@/lib/labels";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for a single box in the label request
 */
const boxSchema = z.object({
  id: z.string().min(1, "Box ID is required"),
  name: z.string().optional(),
});

/**
 * Schema for calibration offset
 */
const calibrationSchema = z.object({
  x: z.number().min(-36).max(36).default(0),
  y: z.number().min(-36).max(36).default(0),
});

/**
 * Schema for POST request body
 */
const labelRequestSchema = z.object({
  boxes: z.array(boxSchema).min(1, "At least one box is required").max(100),
  calibration: calibrationSchema.optional(),
  fetchDetails: z.boolean().optional(),
});

/**
 * Schema for GET query parameters (single label preview)
 */
const previewQuerySchema = z.object({
  boxId: z.string().min(1, "Box ID is required"),
});

// ============================================================================
// GET /api/labels?boxId={id} - Preview single label
// ============================================================================

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsed = previewQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { boxId } = parsed.data;

    // 3. Optionally fetch box details from database
    const { data: box } = await supabase
      .from("boxes")
      .select("id, label")
      .eq("id", boxId)
      .is("deleted_at", null)
      .single();

    // 4. Generate PDF
    const labelBox: LabelBox = {
      id: boxId,
      name: box?.label,
    };

    const pdfBuffer = await generateLabelPdf([labelBox]);

    // 5. Return PDF inline for browser preview
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="label-${boxId}.pdf"`,
        "X-Label-Count": "1",
        "X-Page-Count": "1",
      },
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/labels:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/labels - Generate labels for multiple boxes
// ============================================================================

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const parsed = labelRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { boxes, calibration, fetchDetails } = parsed.data;

    // 3. Optionally fetch box details from database
    let labelBoxes: LabelBox[] = boxes;

    if (fetchDetails) {
      const boxIds = boxes.map((b) => b.id);
      const { data: dbBoxes } = await supabase
        .from("boxes")
        .select("id, label")
        .in("id", boxIds)
        .is("deleted_at", null);

      if (dbBoxes && dbBoxes.length > 0) {
        const dbBoxMap = new Map(dbBoxes.map((b) => [b.id, b.label]));
        labelBoxes = boxes.map((b) => ({
          id: b.id,
          name: dbBoxMap.get(b.id) || b.name,
        }));
      }
    }

    // 4. Generate PDF
    const pdfBuffer = await generateLabelPdf(labelBoxes, calibration);
    const labelCount = labelBoxes.length;
    const pageCount = calculatePageCount(labelCount);

    // 5. Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `boxtracker-labels-${date}.pdf`;

    // 6. Return PDF as attachment
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Label-Count": String(labelCount),
        "X-Page-Count": String(pageCount),
      },
    });
  } catch (err) {
    console.error("Unexpected error in POST /api/labels:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
