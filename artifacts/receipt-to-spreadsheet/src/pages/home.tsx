import { useState, useRef } from "react";
import { useParseReceipt } from "@workspace/api-client-react";
import { UploadCloud, Download, RefreshCw, AlertCircle, ReceiptText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

type EditableItem = {
  description: string;
  qty: string;
  unit_price: string;
  total: string;
};

type EditableReceipt = {
  vendor: string;
  date: string;
  currency: string;
  items: EditableItem[];
  subtotal: string;
  tax: string;
  total: string;
};

function EditCell({
  value,
  onChange,
  align = "left",
  placeholder = "—",
  "data-testid": testId,
}: {
  value: string;
  onChange: (v: string) => void;
  align?: "left" | "right";
  placeholder?: string;
  "data-testid"?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testId}
      className={`w-full bg-transparent border border-transparent rounded px-1 py-0.5 text-sm
        hover:border-border focus:border-primary focus:outline-none focus:bg-background
        transition-colors
        ${align === "right" ? "text-right font-mono" : ""}
      `}
    />
  );
}

function EditMeta({
  value,
  onChange,
  placeholder,
  "data-testid": testId,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  "data-testid"?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "—"}
      data-testid={testId}
      className="w-full bg-transparent border border-transparent rounded px-1 py-0.5
        font-medium text-foreground hover:border-border focus:border-primary
        focus:outline-none focus:bg-background transition-colors text-sm"
    />
  );
}

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<EditableReceipt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseReceipt = useParseReceipt();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
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
              return;
            }
            setEditableData({
              vendor: data.vendor ?? "",
              date: data.date ?? "",
              currency: data.currency ?? "",
              items: data.items.map((item) => ({
                description: item.description ?? "",
                qty: item.qty != null ? String(item.qty) : "",
                unit_price: item.unit_price != null ? item.unit_price.toFixed(2) : "",
                total: item.total != null ? item.total.toFixed(2) : "",
              })),
              subtotal: data.subtotal != null ? data.subtotal.toFixed(2) : "",
              tax: data.tax != null ? data.tax.toFixed(2) : "",
              total: data.total != null ? data.total.toFixed(2) : "",
            });
          },
        }
      );
    } catch {
      setFileError("Failed to read file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const reset = () => {
    setPreviewUrl(null);
    setFileError(null);
    setApiError(null);
    setEditableData(null);
    parseReceipt.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateMeta = (field: keyof Omit<EditableReceipt, "items">, value: string) => {
    setEditableData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const updateItem = (index: number, field: keyof EditableItem, value: string) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, items };
    });
  };

  const addRow = () => {
    setEditableData((prev) =>
      prev ? { ...prev, items: [...prev.items, { description: "", qty: "", unit_price: "", total: "" }] } : prev
    );
  };

  const removeRow = (index: number) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  };

  const downloadCsv = () => {
    if (!editableData) return;
    const { vendor, date, currency, items, subtotal, tax, total } = editableData;

    let csv = `Vendor,${vendor}\n`;
    csv += `Date,${date}\n`;
    csv += `Currency,${currency}\n\n`;
    csv += `Description,Qty,Unit Price,Total\n`;
    items.forEach((item) => {
      const desc = item.description.includes(",") ? `"${item.description}"` : item.description;
      csv += `${desc},${item.qty},${item.unit_price},${item.total}\n`;
    });
    if (subtotal) csv += `\nSubtotal,,, ${subtotal}\n`;
    if (tax) csv += `Tax,,, ${tax}\n`;
    if (total) csv += `Total,,, ${total}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "receipt_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasError = !!apiError || parseReceipt.isError;
  const errorMessage = apiError ?? "An unexpected error occurred while parsing the image.";
  const isUploading = !parseReceipt.isPending && !parseReceipt.isSuccess && !hasError;
  const isSuccess = parseReceipt.isSuccess && !apiError && editableData;

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4 sm:px-6">
      <div className="w-full max-w-4xl flex items-center justify-between mb-12">
        <div className="flex items-center gap-3 text-primary">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <ReceiptText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Receipt to Spreadsheet
          </h1>
        </div>
        {(isSuccess || hasError) && (
          <Button variant="outline" onClick={reset} data-testid="button-scan-again">
            <RefreshCw className="w-4 h-4 mr-2" />
            Scan another
          </Button>
        )}
      </div>

      <div className="w-full max-w-4xl">
        {isUploading && (
          <div className="w-full max-w-xl mx-auto mt-10">
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              data-testid="input-file"
            />
            <div
              data-testid="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200
                ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                ${fileError ? "border-destructive/50 bg-destructive/5" : ""}
              `}
            >
              <div className="w-16 h-16 bg-background shadow-sm border border-border rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UploadCloud className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Drop your receipt here</h3>
              <p className="text-muted-foreground mb-6">or click to browse from your computer</p>
              {fileError ? (
                <p className="text-sm font-medium text-destructive mt-4">{fileError}</p>
              ) : (
                <p className="text-xs text-muted-foreground/70 uppercase tracking-wider font-medium">Supports JPG, PNG, WEBP</p>
              )}
            </div>
          </div>
        )}

        {parseReceipt.isPending && (
          <div className="w-full max-w-xl mx-auto mt-20 flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl shadow-sm">
            <Spinner className="w-8 h-8 text-primary mb-6" />
            <p className="text-lg font-medium text-foreground">Reading your receipt...</p>
            <p className="text-sm text-muted-foreground mt-2">Extracting line items and totals</p>
          </div>
        )}

        {hasError && (
          <div className="w-full max-w-xl mx-auto mt-10">
            <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900" data-testid="card-error">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold text-base">We couldn't read that receipt</AlertTitle>
              <AlertDescription className="text-amber-700/90 mt-2 text-sm leading-relaxed">
                {errorMessage}
              </AlertDescription>
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100/50 hover:text-amber-900"
                  onClick={reset}
                  data-testid="button-try-again"
                >
                  Try another photo
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {isSuccess && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-card p-2 rounded-2xl border border-border shadow-sm">
                <img
                  src={previewUrl!}
                  alt="Receipt thumbnail"
                  className="w-full h-auto object-contain rounded-xl"
                  style={{ maxHeight: "600px" }}
                />
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="grid grid-cols-3 gap-4 flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Vendor</p>
                    <EditMeta
                      value={editableData.vendor}
                      onChange={(v) => updateMeta("vendor", v)}
                      placeholder="Unknown"
                      data-testid="input-vendor"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Date</p>
                    <EditMeta
                      value={editableData.date}
                      onChange={(v) => updateMeta("date", v)}
                      placeholder="Unknown"
                      data-testid="input-date"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Currency</p>
                    <EditMeta
                      value={editableData.currency}
                      onChange={(v) => updateMeta("currency", v)}
                      placeholder="Unknown"
                      data-testid="input-currency"
                    />
                  </div>
                </div>

                <Button onClick={downloadCsv} className="shrink-0 mt-5" data-testid="button-download-csv">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>

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
                    {editableData.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No line items — add one below.
                        </TableCell>
                      </TableRow>
                    ) : (
                      editableData.items.map((item, i) => (
                        <TableRow key={i} className="group">
                          <TableCell className="py-1">
                            <EditCell
                              value={item.description}
                              onChange={(v) => updateItem(i, "description", v)}
                              placeholder="Item description"
                              data-testid={`input-item-description-${i}`}
                            />
                          </TableCell>
                          <TableCell className="py-1">
                            <EditCell
                              value={item.qty}
                              onChange={(v) => updateItem(i, "qty", v)}
                              align="right"
                              placeholder="1"
                              data-testid={`input-item-qty-${i}`}
                            />
                          </TableCell>
                          <TableCell className="py-1">
                            <EditCell
                              value={item.unit_price}
                              onChange={(v) => updateItem(i, "unit_price", v)}
                              align="right"
                              placeholder="0.00"
                              data-testid={`input-item-unit-price-${i}`}
                            />
                          </TableCell>
                          <TableCell className="py-1">
                            <EditCell
                              value={item.total}
                              onChange={(v) => updateItem(i, "total", v)}
                              align="right"
                              placeholder="0.00"
                              data-testid={`input-item-total-${i}`}
                            />
                          </TableCell>
                          <TableCell className="py-1 pr-2">
                            <button
                              onClick={() => removeRow(i)}
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
                          onClick={addRow}
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

                <div className="bg-muted/30 border-t border-border p-4">
                  <div className="space-y-1.5 w-full max-w-[260px] ml-auto">
                    {(editableData.subtotal !== "" || true) && (
                      <div className="flex items-center justify-between text-sm gap-2">
                        <span className="text-muted-foreground shrink-0">Subtotal</span>
                        <EditCell
                          value={editableData.subtotal}
                          onChange={(v) => updateMeta("subtotal", v)}
                          align="right"
                          placeholder="—"
                          data-testid="input-subtotal"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="text-muted-foreground shrink-0">Tax</span>
                      <EditCell
                        value={editableData.tax}
                        onChange={(v) => updateMeta("tax", v)}
                        align="right"
                        placeholder="—"
                        data-testid="input-tax"
                      />
                    </div>
                    <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-border/50 gap-2">
                      <span className="shrink-0">Total</span>
                      <EditCell
                        value={editableData.total}
                        onChange={(v) => updateMeta("total", v)}
                        align="right"
                        placeholder="—"
                        data-testid="input-total"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <p className="text-xs text-muted-foreground text-right">
                Click any value to edit before downloading.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
