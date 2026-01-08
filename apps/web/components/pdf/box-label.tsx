import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { LABEL_CONFIG } from "@boxtrack/shared";

// Type for a box used in label generation (matches BoxListItem but with legacy property names)
type LabelBox = {
  id: string;
  label: string;
  status: string;
  description: string | null;
  // Support both old (singular) and new (plural from query) naming
  category?: { name: string } | null;
  categories?: { name: string } | null;
  box_type?: { name: string } | null;
  box_types?: { name: string } | null;
};

// Convert inches to points (1 inch = 72 points)
const inchesToPoints = (inches: number) => inches * 72;

// Create styles based on Avery 5164 specifications
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    paddingTop: inchesToPoints(LABEL_CONFIG.marginTop),
    paddingBottom: inchesToPoints(LABEL_CONFIG.marginBottom),
    paddingLeft: inchesToPoints(LABEL_CONFIG.marginLeft),
    paddingRight: inchesToPoints(LABEL_CONFIG.marginRight),
  },
  labelRow: {
    flexDirection: "row",
    width: "100%",
  },
  label: {
    width: `${100 / LABEL_CONFIG.columns}%`,
    height: inchesToPoints(LABEL_CONFIG.height),
    padding: 8,
    flexDirection: "column",
    justifyContent: "space-between",
    // Add gap between columns (except last column)
    marginRight: inchesToPoints(LABEL_CONFIG.gapX),
  },
  lastColumnLabel: {
    marginRight: 0,
  },
  labelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  boxNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  status: {
    fontSize: 8,
    color: "#6B7280",
    textTransform: "uppercase",
  },
  qrContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  qrCode: {
    width: inchesToPoints(1.5), // 1.5 inch QR code
    height: inchesToPoints(1.5),
  },
  labelFooter: {
    marginTop: 4,
  },
  category: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 2,
  },
  description: {
    fontSize: 7,
    color: "#6B7280",
    lineHeight: 1.2,
  },
  location: {
    fontSize: 8,
    color: "#4B5563",
    marginBottom: 2,
  },
});

/**
 * Single box label component for Avery 5164 format
 */
type BoxLabelProps = {
  box: LabelBox;
  qrCodeDataUrl: string;
  isLastInRow?: boolean;
};

function BoxLabel({ box, qrCodeDataUrl, isLastInRow }: BoxLabelProps) {
  const labelStyle = isLastInRow
    ? { ...styles.label, ...styles.lastColumnLabel }
    : styles.label;

  // Truncate description to ~60 characters for 2 lines at font size 7
  const truncatedDescription = box.description
    ? box.description.length > 60
      ? box.description.substring(0, 60) + "..."
      : box.description
    : null;

  // Support both singular (legacy) and plural (from query) property names
  const categoryName = box.category?.name || box.categories?.name;

  return (
    <View style={labelStyle}>
      {/* Header: Box number and status */}
      <View style={styles.labelHeader}>
        <Text style={styles.boxNumber}>{box.label}</Text>
        <Text style={styles.status}>{box.status}</Text>
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <Image src={qrCodeDataUrl} style={styles.qrCode} />
      </View>

      {/* Footer: Category and description */}
      <View style={styles.labelFooter}>
        {categoryName && (
          <Text style={styles.category}>{categoryName}</Text>
        )}
        {truncatedDescription && (
          <Text style={styles.description}>{truncatedDescription}</Text>
        )}
      </View>
    </View>
  );
}

/**
 * Helper function to chunk array into groups
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * PDF document with multiple box labels in Avery 5164 layout
 * 6 labels per page (2 columns × 3 rows)
 */
type BoxLabelsDocumentProps = {
  boxes: LabelBox[];
  qrCodes: string[];
};

export function BoxLabelsDocument({
  boxes,
  qrCodes,
}: BoxLabelsDocumentProps) {
  if (boxes.length !== qrCodes.length) {
    throw new Error("Boxes and QR codes arrays must have the same length");
  }

  // Group boxes into pages of 6 labels each
  const pages = chunkArray(
    boxes.map((box, index) => ({ box, qrCode: qrCodes[index] })),
    LABEL_CONFIG.labelsPerSheet
  );

  return (
    <Document>
      {pages.map((pageLabels, pageIndex) => {
        // Group labels into rows of 2 (columns)
        const rows = chunkArray(pageLabels, LABEL_CONFIG.columns);

        return (
          <Page key={pageIndex} size="LETTER" style={styles.page}>
            {rows.map((rowLabels, rowIndex) => (
              <View key={rowIndex} style={styles.labelRow}>
                {rowLabels.map(({ box, qrCode }, labelIndex) => (
                  <BoxLabel
                    key={box.id}
                    box={box}
                    qrCodeDataUrl={qrCode}
                    isLastInRow={labelIndex === rowLabels.length - 1}
                  />
                ))}
              </View>
            ))}
          </Page>
        );
      })}
    </Document>
  );
}

/**
 * Export a single box label as a document
 */
export function SingleBoxLabelDocument({
  box,
  qrCode,
}: {
  box: LabelBox;
  qrCode: string;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.labelRow}>
          <BoxLabel box={box} qrCodeDataUrl={qrCode} />
        </View>
      </Page>
    </Document>
  );
}
