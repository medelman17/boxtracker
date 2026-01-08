/**
 * @boxtrack/ui
 *
 * Shared UI components for BoxTrack web and mobile apps
 */

export { Button } from "./components/Button";
export type { ButtonProps } from "./components/Button";

export { StatusBadge } from "./components/StatusBadge";
export type { StatusBadgeProps } from "./components/StatusBadge";

export { LocationDisplay } from "./components/LocationDisplay";
export type { LocationDisplayProps } from "./components/LocationDisplay";

// QRCode component with platform-specific implementations
// Metro (React Native) will resolve to qr-code.native.tsx
// Webpack/Next.js will resolve to qr-code.web.tsx
export { QRCode } from "./components/qr-code";
export type { QRCodeProps } from "./components/qr-code.types";
