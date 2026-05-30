import { useState } from "react";
import { useParseReceipt } from "@workspace/api-client-react";
import { ReceiptText } from "lucide-react";
import { UploadZone } from "@/components/receipt/UploadZone";
import { LoadingCard } from "@/components/receipt/LoadingCard";
import { ErrorCard } from "@/components/receipt/ErrorCard";
import { ResultsView } from "@/components/receipt/ResultsView";
import type { EditableItem, EditableReceipt } from "@/types/receipt";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const toEditable = (data: ReturnType<typeof useParseReceipt>["data"]): EditableReceipt => ({
  vendor: data?.vendor ?? "",
  date: data?.date ?? "",
  currency: data?.currency ?? "",
  items: (data?.items ?? []).map((item) => ({
    description: item.description ?? "",
    qty: item.qty != null ? String(item.qty) : "",
    unit_price: item.unit_price != null ? item.unit_price.toFixed(2) : "",
    total: item.total != null ? item.total.toFixed(2) : "",
  })),
  subtotal: data?.subtotal != null ? data.subtotal.toFixed(2) : "",
  tax: data?.tax != null ? data.tax.toFixed(2) : "",
  total: data?.total != null ? data.total.toFixed(2) : "",
});

const buildCsv = (d: EditableReceipt): string => {
  let csv = `Vendor,${d.vendor}\nDate,${d.date}\nCurrency,${d.currency}\n\n`;
  csv += `Description,Qty,Unit Price,Total\n`;
  d.items.forEach(({ description, qty, unit_price, total }) => {
    const desc = description.includes(",") ? `"${description}"` : description;
    csv += `${desc},${qty},${unit_price},${total}\n`;
  });
  if (d.subtotal) csv += `\nSubtotal,,,${d.subtotal}\n`;
  if (d.tax) csv += `Tax,,,${d.tax}\n`;
  if (d.total) csv += `Total,,,${d.total}\n`;
  return csv;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Home page — owns all receipt state and delegates rendering to focused
 * sub-components. Three visible states: upload → loading → results (or error).
 */
export default function Home() {
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<EditableReceipt | null>(null);

  const parseReceipt = useParseReceipt();

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    setFileError(null);
    setApiError(null);
    setEditableData(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFileError("Please upload an image (JPG, PNG, WEBP)");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));

    try {
      const base64 = await toBase64(file);
      parseReceipt.mutate(
        { data: { imageBase64: base64, mediaType: file.type } },
        {
          onSuccess: (data) => {
            const maybeError = (data as Record<string, unknown>).error;
            if (typeof maybeError === "string") {
              setApiError(maybeError);
            } else {
              setEditableData(toEditable(data));
            }
          },
        }
      );
    } catch {
      setFileError("Failed to read file.");
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setFileError(null);
    setApiError(null);
    setEditableData(null);
    parseReceipt.reset();
  };

  // ── Editable data mutations ────────────────────────────────────────────────

  const updateMeta = (field: keyof Omit<EditableReceipt, "items">, value: string) =>
    setEditableData((prev) => (prev ? { ...prev, [field]: value } : prev));

  const updateItem = (index: number, field: keyof EditableItem, value: string) =>
    setEditableData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      };
    });

  const addRow = () =>
    setEditableData((prev) =>
      prev
        ? { ...prev, items: [...prev.items, { description: "", qty: "", unit_price: "", total: "" }] }
        : prev
    );

  const removeRow = (index: number) =>
    setEditableData((prev) =>
      prev ? { ...prev, items: prev.items.filter((_, i) => i !== index) } : prev
    );

  // ── CSV download ───────────────────────────────────────────────────────────

  const downloadCsv = () => {
    if (!editableData) return;
    const blob = new Blob([buildCsv(editableData)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "receipt_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const hasError = !!apiError || parseReceipt.isError;
  const errorMessage = apiError ?? "An unexpected error occurred while parsing the image.";
  const isUploading = !parseReceipt.isPending && !parseReceipt.isSuccess && !hasError;
  const isSuccess = parseReceipt.isSuccess && !apiError && !!editableData;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4 sm:px-6">
      <header className="w-full max-w-4xl flex items-center gap-3 mb-12">
        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <ReceiptText className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Receipt to Spreadsheet
        </h1>
      </header>

      <main className="w-full max-w-4xl">
        {isUploading && (
          <UploadZone onFile={handleFile} fileError={fileError} />
        )}

        {parseReceipt.isPending && (
          <LoadingCard />
        )}

        {hasError && (
          <ErrorCard message={errorMessage} onReset={reset} />
        )}

        {isSuccess && (
          <ResultsView
            previewUrl={previewUrl!}
            data={editableData}
            onUpdateMeta={updateMeta}
            onUpdateItem={updateItem}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            onDownload={downloadCsv}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}
