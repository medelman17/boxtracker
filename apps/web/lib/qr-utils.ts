/**
 * QR Code utilities for web platform
 * Provides functions to convert QR codes to data URLs for PDF embedding
 */

import React from "react";
import { createRoot } from "react-dom/client";

/**
 * Generate a QR code as a PNG data URL
 * This is used for embedding QR codes in PDF documents
 *
 * @param qrContent - The content to encode in the QR code (e.g., "boxtrack://box/{id}")
 * @param size - Size of the QR code in pixels (default: 200)
 * @returns Promise resolving to a PNG data URL
 *
 * @example
 * ```ts
 * const dataUrl = await generateQRCodeDataUrl("boxtrack://box/123", 200);
 * // dataUrl: "data:image/png;base64,iVBORw0KGgo..."
 * ```
 */
export async function generateQRCodeDataUrl(
  qrContent: string,
  size: number = 200
): Promise<string> {
  // Dynamically import QRCode to avoid SSR issues
  const QRCodeModule = await import("react-qr-code");
  const QRCode = QRCodeModule.default;

  return new Promise((resolve, reject) => {
    try {
      // Create a temporary container for the QR code
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      // Render QR code to the container
      const root = createRoot(container);

      root.render(
        React.createElement(QRCode, {
          value: qrContent,
          size,
          level: "M",
        })
      );

      // Wait for render, then convert SVG to data URL
      setTimeout(() => {
        const svg = container.querySelector("svg");
        if (!svg) {
          reject(new Error("Failed to render QR code SVG"));
          return;
        }

        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        // Convert to PNG using canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");

          // Cleanup
          URL.revokeObjectURL(url);
          document.body.removeChild(container);
          root.unmount();

          resolve(dataUrl);
        };

        img.onerror = () => {
          reject(new Error("Failed to load SVG image"));
          document.body.removeChild(container);
          root.unmount();
        };

        img.src = url;
      }, 100); // Small delay to ensure render completes
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate QR code data URLs for multiple boxes in parallel
 *
 * @param qrContents - Array of QR content strings
 * @param size - Size of QR codes in pixels (default: 200)
 * @returns Promise resolving to array of PNG data URLs
 *
 * @example
 * ```ts
 * const contents = boxes.map(box => box.qr_code);
 * const dataUrls = await generateQRCodeDataUrls(contents, 200);
 * ```
 */
export async function generateQRCodeDataUrls(
  qrContents: string[],
  size: number = 200
): Promise<string[]> {
  return Promise.all(
    qrContents.map((content) => generateQRCodeDataUrl(content, size))
  );
}

/**
 * Download a data URL as a file
 *
 * @param dataUrl - The data URL to download
 * @param filename - The filename for the download
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/**
 * Download a blob as a file
 *
 * @param blob - The blob to download
 * @param filename - The filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
