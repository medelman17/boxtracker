import type { Location } from "@boxtrack/shared";
import { formatLocation } from "@boxtrack/shared";

export type LocationDisplayProps = {
  location: Location | null;
  className?: string;
  showLabel?: boolean;
};

export function LocationDisplay({
  location,
  className = "",
  showLabel = false,
}: LocationDisplayProps) {
  const formattedLocation = formatLocation(location);
  const isAssigned = location !== null;

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
