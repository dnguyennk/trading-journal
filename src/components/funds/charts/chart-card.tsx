import type { ReactNode } from "react";

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4">
        <div className="font-serif text-base font-semibold">{title}</div>
        {subtitle && (
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
