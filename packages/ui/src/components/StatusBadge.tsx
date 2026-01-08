import type { BoxStatus } from "@boxtrack/shared";
import { BOX_STATUS_COLORS } from "@boxtrack/shared";

export type StatusBadgeProps = {
  status: BoxStatus;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusLabels: Record<BoxStatus, string> = {
    stored: "Stored",
    in_transit: "In Transit",
    delivered: "Delivered",
    archived: "Archived",
  };

  const color = BOX_STATUS_COLORS[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {statusLabels[status]}
    </span>
  );
}
