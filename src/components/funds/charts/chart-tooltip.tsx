import type { ComponentProps } from "react";
import { Tooltip } from "recharts";

const POPOVER_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  color: "var(--popover-foreground)",
  borderRadius: "var(--radius-md, 0.5rem)",
  fontSize: "0.75rem",
};

const POPOVER_TEXT_STYLE = { color: "var(--popover-foreground)" };

const TRANSPARENT_CURSOR = { fill: "transparent" };

export function ChartTooltip(props: ComponentProps<typeof Tooltip>) {
  return (
    <Tooltip
      cursor={TRANSPARENT_CURSOR}
      contentStyle={POPOVER_STYLE}
      itemStyle={POPOVER_TEXT_STYLE}
      labelStyle={POPOVER_TEXT_STYLE}
      {...props}
    />
  );
}
