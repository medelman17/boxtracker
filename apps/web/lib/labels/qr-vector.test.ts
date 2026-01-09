import { describe, it, expect } from "vitest";
import {
  generateQRPath,
  generateQRSvg,
  generateQRDataUrl,
  generateQRDataUrls,
  estimateQRVersion,
} from "./qr-vector";

describe("generateQRPath", () => {
  it("should generate a valid path string", async () => {
    const result = await generateQRPath("https://example.com", 100);

    expect(result.path).toBeDefined();
    expect(typeof result.path).toBe("string");
    expect(result.path.length).toBeGreaterThan(0);
  });

  it("should return correct size", async () => {
    const result = await generateQRPath("https://example.com", 216);

    expect(result.size).toBe(216);
  });

  it("should return module count and size", async () => {
    const result = await generateQRPath("https://example.com", 100);

    expect(result.moduleCount).toBeGreaterThan(0);
    expect(result.moduleSize).toBeGreaterThan(0);
    expect(result.moduleCount * result.moduleSize).toBeCloseTo(result.size, 1);
  });

  it("should generate paths with M, h, v, z commands", async () => {
    const result = await generateQRPath("test", 100);

    expect(result.path).toMatch(/M/);
    expect(result.path).toMatch(/h/);
    expect(result.path).toMatch(/v/);
    expect(result.path).toMatch(/z/);
  });

  it("should generate different paths for different content", async () => {
    const result1 = await generateQRPath("content1", 100);
    const result2 = await generateQRPath("content2", 100);

    expect(result1.path).not.toBe(result2.path);
  });
});

describe("generateQRSvg", () => {
  it("should generate valid SVG markup", async () => {
    const svg = await generateQRSvg("test", 100);

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("should include width and height attributes", async () => {
    const svg = await generateQRSvg("test", 200);

    expect(svg).toContain('width="200"');
    expect(svg).toContain('height="200"');
  });

  it("should include viewBox", async () => {
    const svg = await generateQRSvg("test", 150);

    expect(svg).toContain('viewBox="0 0 150 150"');
  });

  it("should include white background rect", async () => {
    const svg = await generateQRSvg("test", 100);

    expect(svg).toContain('fill="white"');
  });

  it("should include black path for QR modules", async () => {
    const svg = await generateQRSvg("test", 100);

    expect(svg).toContain('<path d="');
    expect(svg).toContain('fill="black"');
  });
});

describe("generateQRDataUrl", () => {
  it("should generate a data URL", async () => {
    const dataUrl = await generateQRDataUrl("test", 100);

    expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("should generate valid base64 content", async () => {
    const dataUrl = await generateQRDataUrl("test", 100);
    const base64Part = dataUrl.split(",")[1];

    expect(() => Buffer.from(base64Part, "base64")).not.toThrow();
  });

  it("should decode to valid SVG", async () => {
    const dataUrl = await generateQRDataUrl("test", 100);
    const base64Part = dataUrl.split(",")[1];
    const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

    expect(decoded).toContain("<svg");
    expect(decoded).toContain("</svg>");
  });
});

describe("generateQRDataUrls", () => {
  it("should generate multiple data URLs", async () => {
    const contents = ["test1", "test2", "test3"];
    const urls = await generateQRDataUrls(contents, 100);

    expect(urls).toHaveLength(3);
    urls.forEach((url) => {
      expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
    });
  });

  it("should generate unique data URLs for different content", async () => {
    const contents = ["unique1", "unique2"];
    const urls = await generateQRDataUrls(contents, 100);

    expect(urls[0]).not.toBe(urls[1]);
  });

  it("should handle empty array", async () => {
    const urls = await generateQRDataUrls([], 100);

    expect(urls).toEqual([]);
  });
});

describe("estimateQRVersion", () => {
  it("should return version 1 for very short content", () => {
    const result = estimateQRVersion("test", "M");

    expect(result.version).toBe(1);
    expect(result.modules).toBe(21); // 17 + 1*4 = 21
  });

  it("should return higher version for longer content", () => {
    const longContent = "https://example.com/very/long/url/path/that/requires/more/capacity";
    const result = estimateQRVersion(longContent, "M");

    expect(result.version).toBeGreaterThan(1);
    expect(result.modules).toBeGreaterThan(21);
  });

  it("should calculate correct module count", () => {
    // Module count formula: 17 + version * 4
    const result = estimateQRVersion("test", "M");

    expect(result.modules).toBe(17 + result.version * 4);
  });

  it("should return higher version for higher error correction", () => {
    const content = "medium length content here";
    const resultM = estimateQRVersion(content, "M");
    const resultH = estimateQRVersion(content, "H");

    expect(resultH.version).toBeGreaterThanOrEqual(resultM.version);
  });

  it("should return lower version for lower error correction", () => {
    const content = "medium length content here";
    const resultL = estimateQRVersion(content, "L");
    const resultM = estimateQRVersion(content, "M");

    expect(resultL.version).toBeLessThanOrEqual(resultM.version);
  });

  it("should handle typical BoxTracker URLs", () => {
    const url = "https://oubx.vercel.app/box/a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const result = estimateQRVersion(url, "M");

    // URL is ~60 chars, should fit in version 2-3
    expect(result.version).toBeLessThanOrEqual(4);
    expect(result.modules).toBeLessThanOrEqual(33);
  });
});
