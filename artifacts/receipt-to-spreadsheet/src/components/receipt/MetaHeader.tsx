import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditMeta } from "./EditMeta";
import type { EditableReceipt } from "@/types/receipt";

type MetaHeaderProps = {
  data: EditableReceipt;
  onChange: (field: keyof Omit<EditableReceipt, "items">, value: string) => void;
  onDownload: () => void;
};

/**
 * Editable vendor / date / currency fields plus the Download CSV button.
 * All three metadata fields update the in-memory receipt state on change.
 */
export function MetaHeader({ data, onChange, onDownload }: MetaHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="grid grid-cols-3 gap-4 flex-1">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            Vendor
          </p>
          <EditMeta
            value={data.vendor}
            onChange={(v) => onChange("vendor", v)}
            placeholder="Unknown"
            data-testid="input-vendor"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            Date
          </p>
          <EditMeta
            value={data.date}
            onChange={(v) => onChange("date", v)}
            placeholder="Unknown"
            data-testid="input-date"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            Currency
          </p>
          <EditMeta
            value={data.currency}
            onChange={(v) => onChange("currency", v)}
            placeholder="Unknown"
            data-testid="input-currency"
          />
        </div>
      </div>

      <Button onClick={onDownload} className="shrink-0 mt-5" data-testid="button-download-csv">
        <Download className="w-4 h-4 mr-2" />
        Download CSV
      </Button>
    </div>
  );
}
