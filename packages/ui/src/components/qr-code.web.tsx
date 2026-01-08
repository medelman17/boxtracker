import QRCodeSVG from "react-qr-code";
import type { QRCodeProps } from "./qr-code.types";

/**
 * QR Code component for web platform
 *
 * Uses react-qr-code library to render SVG-based QR codes.
 * Supports Tailwind CSS styling via className prop.
 *
 * @example
 * ```tsx
 * import { QRCode } from '@boxtrack/ui';
 * import { generateQRCodeContent } from '@boxtrack/shared';
 *
 * <QRCode
 *   value={generateQRCodeContent(box.id)}
 *   size={200}
 *   level="M"
 *   className="border rounded-lg p-4 bg-white"
 * />
 * ```
 */
export function QRCode({
  value,
  size = 200,
  level = "M",
  includeMargin = true,
  className,
  testID,
}: QRCodeProps) {
  // Note: react-qr-code doesn't have includeMargin prop
  // We simulate it by wrapping in a div with padding when includeMargin is true
  const wrapperStyle = includeMargin ? "p-2" : "";
  const combinedClassName = `${wrapperStyle} ${className || ""}`.trim();

  return (
    <div className={combinedClassName} data-testid={testID}>
      <QRCodeSVG value={value} size={size} level={level} />
    </div>
  );
}
