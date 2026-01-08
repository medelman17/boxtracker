/**
 * QR Code component props for both web and mobile platforms
 *
 * This interface is shared between platform-specific implementations:
 * - qr-code.web.tsx (uses react-qr-code)
 * - qr-code.native.tsx (uses react-native-qrcode-svg)
 */
export type QRCodeProps = {
  /**
   * The content to encode in the QR code
   * @example "boxtrack://box/123e4567-e89b-12d3-a456-426614174000"
   */
  value: string;

  /**
   * Size of the QR code in pixels
   * @default 200
   */
  size?: number;

  /**
   * Error correction level
   * - L: ~7% correction
   * - M: ~15% correction (recommended for standard use)
   * - Q: ~25% correction
   * - H: ~30% correction (use if adding logos or branding)
   * @default "M"
   */
  level?: "L" | "M" | "Q" | "H";

  /**
   * Whether to include a quiet zone (margin) around the QR code
   * @default true
   */
  includeMargin?: boolean;

  /**
   * CSS class name for styling (web only)
   * On mobile, this prop is ignored
   */
  className?: string;

  /**
   * Test ID for testing purposes
   * Used for accessibility and automated testing
   */
  testID?: string;
};
