import { cn } from "@/lib/utils";

export type InfoRow = { label: string; value: React.ReactNode };

export function InfoCard({
  rows,
  className,
}: {
  rows: InfoRow[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm",
        className,
      )}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={cn(
            "flex items-center justify-between gap-4 px-4 py-3.5",
            i < rows.length - 1 && "border-b border-zinc-100",
          )}
        >
          <span className="text-sm font-semibold text-zinc-900">{row.label}</span>
          <span className="text-right text-sm text-zinc-600">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
