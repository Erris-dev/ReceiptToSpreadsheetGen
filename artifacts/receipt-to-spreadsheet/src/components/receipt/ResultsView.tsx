import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetaHeader } from "./MetaHeader";
import { EditableTable } from "./EditableTable";
import type { EditableItem, EditableReceipt } from "@/types/receipt";

type ResultsViewProps = {
  previewUrl: string;
  data: EditableReceipt;
  onUpdateMeta: (field: keyof Omit<EditableReceipt, "items">, value: string) => void;
  onUpdateItem: (index: number, field: keyof EditableItem, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onDownload: () => void;
  onReset: () => void;
};

/**
 * Full results layout: receipt thumbnail on the left, editable metadata
 * header + line items table + totals on the right. Shown after a successful parse.
 */
export function ResultsView({
  previewUrl,
  data,
  onUpdateMeta,
  onUpdateItem,
  onAddRow,
  onRemoveRow,
  onDownload,
  onReset,
}: ResultsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-card p-2 rounded-2xl border border-border shadow-sm">
          <img
            src={previewUrl}
            alt="Receipt thumbnail"
            className="w-full h-auto object-contain rounded-xl"
            style={{ maxHeight: "600px" }}
          />
        </div>

        <Button
          variant="outline"
          onClick={onReset}
          className="w-full"
          data-testid="button-scan-again"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Scan another
        </Button>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-6">
        <MetaHeader data={data} onChange={onUpdateMeta} onDownload={onDownload} />

        <EditableTable
          items={data.items}
          subtotal={data.subtotal}
          tax={data.tax}
          total={data.total}
          onUpdateItem={onUpdateItem}
          onUpdateTotals={onUpdateMeta}
          onAddRow={onAddRow}
          onRemoveRow={onRemoveRow}
        />

        <p className="text-xs text-muted-foreground text-right">
          Click any value to edit before downloading.
        </p>
      </div>
    </div>
  );
}
