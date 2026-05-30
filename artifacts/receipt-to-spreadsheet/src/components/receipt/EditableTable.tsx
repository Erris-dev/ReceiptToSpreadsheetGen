import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditCell } from "./EditCell";
import { FooterTotals } from "./FooterTotals";
import type { EditableItem, EditableReceipt } from "@/types/receipt";

type EditableTableProps = {
  items: EditableItem[];
  subtotal: string;
  tax: string;
  total: string;
  onUpdateItem: (index: number, field: keyof EditableItem, value: string) => void;
  onUpdateTotals: (field: keyof Omit<EditableReceipt, "items">, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
};

/**
 * Editable line items table with add / remove row controls and an editable
 * subtotal / tax / total footer. Every cell is an inline input that blends
 * with the table until hovered or focused.
 */
export function EditableTable({
  items,
  subtotal,
  tax,
  total,
  onUpdateItem,
  onUpdateTotals,
  onAddRow,
  onRemoveRow,
}: EditableTableProps) {
  return (
    <Card className="overflow-hidden shadow-sm" data-testid="table-results">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[42%] font-medium">Description</TableHead>
            <TableHead className="text-right font-medium w-16">Qty</TableHead>
            <TableHead className="text-right font-medium w-24">Unit Price</TableHead>
            <TableHead className="text-right font-medium w-24">Total</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No line items — add one below.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, i) => (
              <TableRow key={i} className="group">
                <TableCell className="py-1">
                  <EditCell
                    value={item.description}
                    onChange={(v) => onUpdateItem(i, "description", v)}
                    placeholder="Item description"
                    data-testid={`input-item-description-${i}`}
                  />
                </TableCell>
                <TableCell className="py-1">
                  <EditCell
                    value={item.qty}
                    onChange={(v) => onUpdateItem(i, "qty", v)}
                    align="right"
                    placeholder="1"
                    data-testid={`input-item-qty-${i}`}
                  />
                </TableCell>
                <TableCell className="py-1">
                  <EditCell
                    value={item.unit_price}
                    onChange={(v) => onUpdateItem(i, "unit_price", v)}
                    align="right"
                    placeholder="0.00"
                    data-testid={`input-item-unit-price-${i}`}
                  />
                </TableCell>
                <TableCell className="py-1">
                  <EditCell
                    value={item.total}
                    onChange={(v) => onUpdateItem(i, "total", v)}
                    align="right"
                    placeholder="0.00"
                    data-testid={`input-item-total-${i}`}
                  />
                </TableCell>
                <TableCell className="py-1 pr-2">
                  <button
                    onClick={() => onRemoveRow(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    data-testid={`button-delete-row-${i}`}
                    aria-label="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}

          <TableRow className="hover:bg-transparent border-t border-dashed">
            <TableCell colSpan={5} className="py-2 pl-2">
              <button
                onClick={onAddRow}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-add-row"
              >
                <Plus className="w-3.5 h-3.5" />
                Add row
              </button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <FooterTotals
        subtotal={subtotal}
        tax={tax}
        total={total}
        onChange={onUpdateTotals}
      />
    </Card>
  );
}
