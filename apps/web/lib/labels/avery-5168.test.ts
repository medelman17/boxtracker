import { describe, it, expect } from "vitest";
import {
  SHEET,
  LABEL,
  MARGINS,
  GRID,
  LABEL_POSITIONS,
  ZONES,
  QR_CODE,
  inchesToPoints,
  pointsToInches,
  mmToPoints,
  pointsToMm,
  getLabelPosition,
  calculatePageCount,
  chunkIntoPages,
  formatBoxId,
  generateBoxUrl,
} from "./avery-5168";

describe("Avery 5168 Geometry Constants", () => {
  describe("Sheet dimensions", () => {
    it("should have correct US Letter dimensions", () => {
      expect(SHEET.width).toBe(8.5);
      expect(SHEET.height).toBe(11.0);
      expect(SHEET.widthPt).toBe(612);
      expect(SHEET.heightPt).toBe(792);
    });
  });

  describe("Label dimensions", () => {
    it("should have correct Avery 5168 label dimensions", () => {
      expect(LABEL.width).toBe(3.5);
      expect(LABEL.height).toBe(5.0);
      expect(LABEL.widthPt).toBe(252);
      expect(LABEL.heightPt).toBe(360);
    });

    it("should have consistent inch to point conversion", () => {
      expect(LABEL.widthPt).toBe(LABEL.width * 72);
      expect(LABEL.heightPt).toBe(LABEL.height * 72);
    });
  });

  describe("Margins", () => {
    it("should have 0.5 inch margins on all sides", () => {
      expect(MARGINS.top).toBe(0.5);
      expect(MARGINS.bottom).toBe(0.5);
      expect(MARGINS.left).toBe(0.5);
      expect(MARGINS.right).toBe(0.5);
    });

    it("should convert margins correctly to points", () => {
      expect(MARGINS.topPt).toBe(36);
      expect(MARGINS.bottomPt).toBe(36);
      expect(MARGINS.leftPt).toBe(36);
      expect(MARGINS.rightPt).toBe(36);
    });
  });

  describe("Grid configuration", () => {
    it("should be a 2x2 grid with 4 labels per sheet", () => {
      expect(GRID.columns).toBe(2);
      expect(GRID.rows).toBe(2);
      expect(GRID.labelsPerSheet).toBe(4);
    });
  });

  describe("Label positions", () => {
    it("should have 4 label positions", () => {
      expect(LABEL_POSITIONS).toHaveLength(4);
    });

    it("should have correct position for top-left label (0)", () => {
      expect(LABEL_POSITIONS[0].x).toBe(36);
      expect(LABEL_POSITIONS[0].y).toBe(36);
      expect(LABEL_POSITIONS[0].column).toBe(0);
      expect(LABEL_POSITIONS[0].row).toBe(0);
    });

    it("should have correct position for top-right label (1)", () => {
      expect(LABEL_POSITIONS[1].x).toBe(324);
      expect(LABEL_POSITIONS[1].y).toBe(36);
      expect(LABEL_POSITIONS[1].column).toBe(1);
      expect(LABEL_POSITIONS[1].row).toBe(0);
    });

    it("should have correct position for bottom-left label (2)", () => {
      expect(LABEL_POSITIONS[2].x).toBe(36);
      expect(LABEL_POSITIONS[2].y).toBe(396);
      expect(LABEL_POSITIONS[2].column).toBe(0);
      expect(LABEL_POSITIONS[2].row).toBe(1);
    });

    it("should have correct position for bottom-right label (3)", () => {
      expect(LABEL_POSITIONS[3].x).toBe(324);
      expect(LABEL_POSITIONS[3].y).toBe(396);
      expect(LABEL_POSITIONS[3].column).toBe(1);
      expect(LABEL_POSITIONS[3].row).toBe(1);
    });
  });

  describe("Tri-zone layout", () => {
    it("should have correct zone heights", () => {
      expect(ZONES.header).toBe(72); // 1.0"
      expect(ZONES.qrBody).toBe(216); // 3.0"
      expect(ZONES.void).toBe(72); // 1.0"
    });

    it("should sum to label height", () => {
      const totalHeight = ZONES.header + ZONES.qrBody + ZONES.void;
      expect(totalHeight).toBe(LABEL.heightPt);
    });
  });

  describe("QR code configuration", () => {
    it("should have 216pt QR code size (3 inches)", () => {
      expect(QR_CODE.size).toBe(216);
    });

    it("should use error correction level M", () => {
      expect(QR_CODE.errorCorrection).toBe("M");
    });
  });
});

describe("Conversion utilities", () => {
  describe("inchesToPoints", () => {
    it("should convert inches to points correctly", () => {
      expect(inchesToPoints(1)).toBe(72);
      expect(inchesToPoints(0.5)).toBe(36);
      expect(inchesToPoints(3)).toBe(216);
    });
  });

  describe("pointsToInches", () => {
    it("should convert points to inches correctly", () => {
      expect(pointsToInches(72)).toBe(1);
      expect(pointsToInches(36)).toBe(0.5);
      expect(pointsToInches(216)).toBe(3);
    });
  });

  describe("mmToPoints", () => {
    it("should convert millimeters to points correctly", () => {
      // 25.4mm = 1 inch = 72 points
      expect(mmToPoints(25.4)).toBeCloseTo(72, 0);
    });
  });

  describe("pointsToMm", () => {
    it("should convert points to millimeters correctly", () => {
      // 72 points = 1 inch = 25.4mm
      expect(pointsToMm(72)).toBeCloseTo(25.4, 0);
    });
  });
});

describe("getLabelPosition", () => {
  it("should return correct position for index 0 (top-left)", () => {
    const pos = getLabelPosition(0);
    expect(pos.x).toBe(36);
    expect(pos.y).toBe(36);
  });

  it("should return correct position for index 1 (top-right)", () => {
    const pos = getLabelPosition(1);
    expect(pos.x).toBe(324);
    expect(pos.y).toBe(36);
  });

  it("should return correct position for index 2 (bottom-left)", () => {
    const pos = getLabelPosition(2);
    expect(pos.x).toBe(36);
    expect(pos.y).toBe(396);
  });

  it("should return correct position for index 3 (bottom-right)", () => {
    const pos = getLabelPosition(3);
    expect(pos.x).toBe(324);
    expect(pos.y).toBe(396);
  });
});

describe("calculatePageCount", () => {
  it("should return 0 for 0 labels", () => {
    expect(calculatePageCount(0)).toBe(0);
  });

  it("should return 1 for 1-4 labels", () => {
    expect(calculatePageCount(1)).toBe(1);
    expect(calculatePageCount(2)).toBe(1);
    expect(calculatePageCount(3)).toBe(1);
    expect(calculatePageCount(4)).toBe(1);
  });

  it("should return 2 for 5-8 labels", () => {
    expect(calculatePageCount(5)).toBe(2);
    expect(calculatePageCount(8)).toBe(2);
  });

  it("should return correct count for larger numbers", () => {
    expect(calculatePageCount(12)).toBe(3);
    expect(calculatePageCount(100)).toBe(25);
  });
});

describe("chunkIntoPages", () => {
  it("should return empty array for empty input", () => {
    expect(chunkIntoPages([])).toEqual([]);
  });

  it("should chunk items into pages of 4", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const pages = chunkIntoPages(items);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toEqual([1, 2, 3, 4]);
    expect(pages[1]).toEqual([5, 6, 7]);
  });

  it("should handle exact multiples of 4", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const pages = chunkIntoPages(items);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toEqual([1, 2, 3, 4]);
    expect(pages[1]).toEqual([5, 6, 7, 8]);
  });
});

describe("formatBoxId", () => {
  it("should strip box_ prefix (lowercase)", () => {
    expect(formatBoxId("box_abc123")).toBe("ABC123");
  });

  it("should strip BOX_ prefix (uppercase)", () => {
    expect(formatBoxId("BOX_abc123")).toBe("ABC123");
  });

  it("should strip box- prefix with hyphen", () => {
    expect(formatBoxId("box-abc123")).toBe("ABC123");
  });

  it("should extract first 8 chars from UUID", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(formatBoxId(uuid)).toBe("A1B2C3D4");
  });

  it("should truncate long IDs to 12 characters", () => {
    expect(formatBoxId("kitchen-utensils-drawer")).toBe("KITCHEN-UTEN");
  });

  it("should convert to uppercase", () => {
    expect(formatBoxId("abc123")).toBe("ABC123");
  });

  it("should handle short IDs", () => {
    expect(formatBoxId("a")).toBe("A");
  });
});

describe("generateBoxUrl", () => {
  it("should generate URL with default base", () => {
    expect(generateBoxUrl("abc123")).toBe("https://oubx.vercel.app/box/abc123");
  });

  it("should generate URL with custom base", () => {
    expect(generateBoxUrl("abc123", "https://example.com")).toBe(
      "https://example.com/box/abc123"
    );
  });
});
