import QRCodeSVG from "react-native-qrcode-svg";
import type { QRCodeProps } from "./qr-code.types";

/**
 * QR Code component for mobile platform (React Native)
 *
 * Uses react-native-qrcode-svg library to render QR codes in React Native.
 * Note: className prop is ignored on mobile (use View wrapper for styling).
 *
 * @example
 * ```tsx
 * import { View } from 'react-native';
 * import { QRCode } from '@boxtrack/ui';
 * import { generateQRCodeContent } from '@boxtrack/shared';
 *
 * <View className="p-4 bg-white rounded-lg">
 *   <QRCode
 *     value={generateQRCodeContent(box.id)}
 *     size={200}
 *     level="M"
 *     testID="box-qr-code"
 *   />
 * </View>
 * ```
 */
export function QRCode({ value, size = 200, level = "M", testID }: QRCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      ecl={level}
      testID={testID}
      // react-native-qrcode-svg uses 'ecl' prop instead of 'level'
      // and doesn't have includeMargin prop (margin is automatic)
    />
  );
}
