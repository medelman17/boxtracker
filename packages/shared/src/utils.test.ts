import { describe, it, expect } from "vitest";
import {
  formatLocation,
  parseLocation,
  generateQRCodeContent,
  extractBoxIdFromQR,
  calculateOffset,
  calculateTotalPages,
} from "./utils";

describe("formatLocation", () => {
  it("should format location components to string", () => {
    expect(formatLocation("A", 3, 2)).toBe("A/3/2");
  });

  it("should return 'Not assigned' for null components", () => {
    expect(formatLocation(null, null, null)).toBe("Not assigned");
    expect(formatLocation("A", null, 2)).toBe("Not assigned");
    expect(formatLocation(null, 3, 2)).toBe("Not assigned");
  });
});

describe("parseLocation", () => {
  it("should parse valid location string", () => {
    const result = parseLocation("A/3/2");
    expect(result).toEqual({ pallet: "A", row: 3, position: 2 });
  });

  it("should return null for invalid location string", () => {
    expect(parseLocation("A/3")).toBeNull();
    expect(parseLocation("invalid")).toBeNull();
    expect(parseLocation("A/B/C")).toBeNull();
  });
});

describe("generateQRCodeContent", () => {
  it("should generate QR code content with correct prefix", () => {
    const boxId = "123e4567-e89b-12d3-a456-426614174000";
    const result = generateQRCodeContent(boxId);
    expect(result).toBe(`boxtrack://box/${boxId}`);
  });
});

describe("extractBoxIdFromQR", () => {
  it("should extract box ID from valid QR content", () => {
    const boxId = "123e4567-e89b-12d3-a456-426614174000";
    const qrContent = `boxtrack://box/${boxId}`;
    expect(extractBoxIdFromQR(qrContent)).toBe(boxId);
  });

  it("should return null for invalid QR content", () => {
    expect(extractBoxIdFromQR("invalid")).toBeNull();
    expect(extractBoxIdFromQR("http://example.com")).toBeNull();
  });
});

describe("calculateOffset", () => {
  it("should calculate correct offset for pagination", () => {
    expect(calculateOffset(1, 20)).toBe(0);
    expect(calculateOffset(2, 20)).toBe(20);
    expect(calculateOffset(3, 10)).toBe(20);
  });
});

describe("calculateTotalPages", () => {
  it("should calculate correct total pages", () => {
    expect(calculateTotalPages(100, 20)).toBe(5);
    expect(calculateTotalPages(101, 20)).toBe(6);
    expect(calculateTotalPages(0, 20)).toBe(0);
  });
});
