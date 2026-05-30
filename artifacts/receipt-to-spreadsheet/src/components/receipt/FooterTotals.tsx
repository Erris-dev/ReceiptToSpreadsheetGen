import { EditCell } from "./EditCell";
import type { EditableReceipt } from "@/types/receipt";

type FooterTotalsProps = {
  subtotal: string;
  tax: string;
  total: string;
  onChange: (field: keyof Omit<EditableReceipt, "items">, value: string) => void;
};

/**
 * Editable subtotal / tax / total footer shown below the line items table.
 */
export function FooterTotals({ subtotal, tax, total, onChange }: FooterTotalsProps) {
  return (
    <div className="bg-muted/30 border-t border-border p-4">
      <div className="space-y-1.5 w-full max-w-[260px] ml-auto">
        <div className="flex items-center justify-between text-sm gap-2">
          <span className="text-muted-foreground shrink-0">Subtotal</span>
          <EditCell
            value={subtotal}
            onChange={(v) => onChange("subtotal", v)}
            align="right"
            placeholder="—"
            data-testid="input-subtotal"
          />
        </div>

        <div className="flex items-center justify-between text-sm gap-2">
          <span className="text-muted-foreground shrink-0">Tax</span>
          <EditCell
            value={tax}
            onChange={(v) => onChange("tax", v)}
            align="right"
            placeholder="—"
            data-testid="input-tax"
          />
        </div>

        <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-border/50 gap-2">
          <span className="shrink-0">Total</span>
          <EditCell
            value={total}
            onChange={(v) => onChange("total", v)}
            align="right"
            placeholder="—"
            data-testid="input-total"
          />
        </div>
      </div>
    </div>
  );
}
