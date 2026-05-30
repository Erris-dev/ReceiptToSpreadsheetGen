type EditMetaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "data-testid"?: string;
};

/**
 * A transparent inline input for the receipt metadata header (Vendor, Date, Currency).
 * Styled to match the bold metadata text until interacted with.
 */
export function EditMeta({
  value,
  onChange,
  placeholder = "—",
  "data-testid": testId,
}: EditMetaProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testId}
      className="
        w-full bg-transparent border border-transparent rounded px-1 py-0.5
        font-medium text-foreground hover:border-border focus:border-primary
        focus:outline-none focus:bg-background transition-colors text-sm
      "
    />
  );
}
