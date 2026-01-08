import { formatLocation } from "@boxtrack/shared";

export type LocationDisplayProps = {
  palletCode: string | null;
  rowNumber: number | null;
  positionNumber: number | null;
  className?: string;
  showLabel?: boolean;
};

export function LocationDisplay({
  palletCode,
  rowNumber,
  positionNumber,
  className = "",
  showLabel = false,
}: LocationDisplayProps) {
  const formattedLocation = formatLocation(palletCode, rowNumber, positionNumber);
  const isAssigned = palletCode !== null && rowNumber !== null && positionNumber !== null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-500">Location:</span>
      )}
      <span
        className={`text-sm font-mono ${
          isAssigned ? "text-gray-900" : "text-gray-400 italic"
        }`}
      >
        {formattedLocation}
      </span>
    </div>
  );
}
