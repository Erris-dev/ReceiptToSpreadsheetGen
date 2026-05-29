import { useState, useRef } from "react";
import { useParseReceipt } from "@workspace/api-client-react";
import { UploadCloud, FileSpreadsheet, Download, RefreshCw, AlertCircle, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFileError("Please upload an image (JPG, PNG, WEBP)");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const base64 = await toBase64(file);
      parseReceipt.mutate({
        data: { imageBase64: base64, mediaType: file.type }
      });
    } catch (err) {
      setFileError("Failed to read file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setFileError(null);
    parseReceipt.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadCsv = () => {
    if (!parseReceipt.data) return;
    const { vendor, date, currency, items } = parseReceipt.data;

    let csvContent = `Vendor,${vendor || ""}\n`;
    csvContent += `Date,${date || ""}\n`;
    csvContent += `Currency,${currency || ""}\n\n`;
    
    csvContent += `Description,Qty,Unit Price,Total\n`;
    items.forEach(item => {
      // Escape descriptions that might have commas
      const desc = item.description && item.description.includes(",") ? `"${item.description}"` : (item.description ?? "");
      csvContent += `${desc},${item.qty ?? ""},${item.unit_price ?? ""},${item.total ?? ""}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "receipt_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isUploading = !parseReceipt.isPending && !parseReceipt.isSuccess && !parseReceipt.isError;

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
        {(parseReceipt.isSuccess || parseReceipt.isError) && (
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

        {parseReceipt.isError && (
          <div className="w-full max-w-xl mx-auto mt-10">
            <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900" data-testid="card-error">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold text-base">We couldn't read that receipt</AlertTitle>
              <AlertDescription className="text-amber-700/90 mt-2 text-sm leading-relaxed">
                {/* @ts-ignore */}
                {parseReceipt.error?.response?.data?.error || "An unexpected error occurred while parsing the image."}
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

        {parseReceipt.isSuccess && parseReceipt.data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-card p-2 rounded-2xl border border-border shadow-sm">
                <img 
                  src={previewUrl!} 
                  alt="Receipt thumbnail" 
                  className="w-full h-auto object-contain rounded-xl"
                  style={{ maxHeight: '600px' }}
                />
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Vendor</p>
                    <p className="font-medium text-foreground">{parseReceipt.data.vendor || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Date</p>
                    <p className="font-medium text-foreground">{parseReceipt.data.date || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Currency</p>
                    <p className="font-medium text-foreground">{parseReceipt.data.currency || "USD"}</p>
                  </div>
                </div>
                
                <Button onClick={downloadCsv} className="shrink-0" data-testid="button-download-csv">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>

              <Card className="overflow-hidden shadow-sm" data-testid="table-results">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[45%] font-medium">Description</TableHead>
                      <TableHead className="text-right font-medium">Qty</TableHead>
                      <TableHead className="text-right font-medium">Unit Price</TableHead>
                      <TableHead className="text-right font-medium">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseReceipt.data.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No line items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      parseReceipt.data.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-right text-muted-foreground font-mono">{item.qty}</TableCell>
                          <TableCell className="text-right text-muted-foreground font-mono">
                            {item.unit_price != null ? item.unit_price.toFixed(2) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {item.total != null ? item.total.toFixed(2) : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                <div className="bg-muted/30 border-t border-border p-4">
                  <div className="space-y-2 w-full max-w-[240px] ml-auto">
                    {parseReceipt.data.subtotal !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-mono font-medium">{parseReceipt.data.subtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {parseReceipt.data.tax !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-mono font-medium">{parseReceipt.data.tax.toFixed(2)}</span>
                      </div>
                    )}
                    {parseReceipt.data.total !== null && (
                      <div className="flex justify-between text-base font-semibold pt-2 border-t border-border/50">
                        <span>Total</span>
                        <span className="font-mono">{parseReceipt.data.total.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
