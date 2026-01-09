import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Scan resolution page
 * This page handles short codes or direct box IDs from QR code scans
 * and redirects to the appropriate box detail page.
 *
 * In the future, this could resolve short codes to box IDs from a database.
 * For now, it treats the ID as a direct box ID.
 */
export default async function ScanPage({ params }: PageProps) {
  const { id } = await params;

  // For now, treat the scan ID as a direct box ID
  // In the future, you could implement short code resolution here:
  // const supabase = await createClient();
  // const { data: scan } = await supabase
  //   .from('scans')
  //   .select('box_id')
  //   .eq('short_code', id)
  //   .single();
  // const boxId = scan?.box_id ?? id;

  redirect(`/box/${id}`);
}
