/**
 * Avery 5168 Label Generator using React PDF
 *
 * Generates vector-based PDFs with high-contrast QR codes optimized for
 * industrial scanning at distances up to 30 inches.
 */

import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Path,
  Rect,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  SHEET,
  LABEL,
  MARGINS,
  ZONES,
  TYPOGRAPHY,
  QR_CODE,
  chunkIntoPages,
  formatBoxId,
  type LabelBox,
  type Calibration,
} from "./avery-5168";
import { generateQRPath } from "./qr-vector";

/**
 * PDF styles for Avery 5168 labels
 */
const styles = StyleSheet.create({
  page: {
    width: SHEET.widthPt,
    height: SHEET.heightPt,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  labelContainer: {
    position: "absolute",
    width: LABEL.widthPt,
    height: LABEL.heightPt,
  },
  label: {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  headerZone: {
    width: "100%",
    height: ZONES.header,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  qrZone: {
    width: "100%",
    height: ZONES.qrBody,
    justifyContent: "center",
    alignItems: "center",
  },
  voidZone: {
    width: "100%",
    height: ZONES.void,
  },
  headerText: {
    fontFamily: TYPOGRAPHY.headerFontFamily,
    fontSize: TYPOGRAPHY.headerFontSize,
    fontWeight: TYPOGRAPHY.headerFontWeight,
    letterSpacing: TYPOGRAPHY.headerLetterSpacing,
    color: TYPOGRAPHY.headerColor,
    textTransform: "uppercase",
  },
});

/**
 * Label data with pre-generated QR code
 */
export type LabelData = {
  box: LabelBox;
  qrPath: string;
  qrSize: number;
};

/**
 * Props for the QR code component
 */
type QRCodeProps = {
  path: string;
  size: number;
};

/**
 * Vector QR code component for React PDF
 */
function QRCodeSvg({ path, size }: QRCodeProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x="0" y="0" width={size} height={size} fill="white" />
      <Path d={path} fill="black" />
    </Svg>
  );
}

/**
 * Single label component in tri-zone layout
 */
type SingleLabelProps = {
  data: LabelData;
};

function SingleLabel({ data }: SingleLabelProps) {
  const displayId = formatBoxId(data.box.id);

  return (
    <View style={styles.label}>
      {/* Header Zone: Box ID */}
      <View style={styles.headerZone}>
        <Text style={styles.headerText}>{displayId}</Text>
      </View>

      {/* QR Zone: Vector QR Code */}
      <View style={styles.qrZone}>
        <QRCodeSvg path={data.qrPath} size={data.qrSize} />
      </View>

      {/* Void Zone: Intentional whitespace */}
      <View style={styles.voidZone} />
    </View>
  );
}

/**
 * Props for page of labels
 */
type LabelPageProps = {
  labels: LabelData[];
  calibration?: Calibration;
};

/**
 * Single page with up to 4 labels in 2×2 grid
 */
function LabelPage({ labels, calibration }: LabelPageProps) {
  const offsetX = calibration?.x || 0;
  const offsetY = calibration?.y || 0;

  // Calculate positions for 2×2 grid
  const positions = [
    { x: MARGINS.leftPt + offsetX, y: MARGINS.topPt + offsetY }, // Top-left
    { x: 324 + offsetX, y: MARGINS.topPt + offsetY }, // Top-right
    { x: MARGINS.leftPt + offsetX, y: 396 + offsetY }, // Bottom-left
    { x: 324 + offsetX, y: 396 + offsetY }, // Bottom-right
  ];

  return (
    <Page size="LETTER" style={styles.page}>
      {labels.map((labelData, index) => (
        <View
          key={labelData.box.id}
          style={[
            styles.labelContainer,
            {
              left: positions[index].x,
              top: positions[index].y,
            },
          ]}
        >
          <SingleLabel data={labelData} />
        </View>
      ))}
    </Page>
  );
}

/**
 * Props for the full document
 */
export type LabelDocumentProps = {
  labels: LabelData[];
  calibration?: Calibration;
};

/**
 * Complete PDF document with multiple pages of labels
 */
export function LabelDocument({ labels, calibration }: LabelDocumentProps) {
  const pages = chunkIntoPages(labels);

  return (
    <Document
      title="BoxTracker Labels"
      author="BoxTracker"
      subject="Box Labels - Avery 5168 Format"
      creator="BoxTracker Label Generator"
    >
      {pages.map((pageLabels, pageIndex) => (
        <LabelPage
          key={pageIndex}
          labels={pageLabels}
          calibration={calibration}
        />
      ))}
    </Document>
  );
}

/**
 * Prepare label data by generating QR codes
 *
 * @param boxes - Array of box objects with id and optional name
 * @param baseUrl - Base URL for QR code encoding
 * @returns Array of label data with pre-generated QR paths
 */
export async function prepareLabelData(
  boxes: LabelBox[],
  baseUrl?: string
): Promise<LabelData[]> {
  const base = baseUrl || "https://oubx.vercel.app";

  const labelPromises = boxes.map(async (box) => {
    const url = `${base}/box/${box.id}`;
    const qrData = await generateQRPath(url, QR_CODE.size, QR_CODE.errorCorrection);

    return {
      box,
      qrPath: qrData.path,
      qrSize: qrData.size,
    };
  });

  return Promise.all(labelPromises);
}

/**
 * Generate PDF buffer for labels
 *
 * @param boxes - Array of box objects
 * @param calibration - Optional calibration offset
 * @param baseUrl - Base URL for QR codes
 * @returns PDF as buffer
 */
export async function generateLabelPdf(
  boxes: LabelBox[],
  calibration?: Calibration,
  baseUrl?: string
): Promise<Buffer> {
  // Dynamically import renderToBuffer to avoid SSR issues
  const { renderToBuffer } = await import("@react-pdf/renderer");

  const labelData = await prepareLabelData(boxes, baseUrl);
  const buffer = await renderToBuffer(
    <LabelDocument labels={labelData} calibration={calibration} />
  );

  return Buffer.from(buffer);
}
