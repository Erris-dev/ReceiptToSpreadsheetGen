type EditCellProps = {
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right";
  placeholder?: string;
  "data-testid"?: string;
};

/**
 * A transparent inline input that blends with table cells.
 * Shows a border on hover and switches to a white background when focused.
 */
export function EditCell({
  value,
  onChange,
  align = "left",
  placeholder = "—",
  "data-testid": testId,
}: EditCellProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testId}
      className={`
        w-full bg-transparent border border-transparent rounded px-1 py-0.5 text-sm
        hover:border-border focus:border-primary focus:outline-none focus:bg-background
        transition-colors
        ${align === "right" ? "text-right font-mono" : ""}
      `}
    />
  );
}
