import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

type UploadZoneProps = {
  onFile: (file: File) => void;
  fileError: string | null;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Drag-and-drop upload zone. Accepts JPG, PNG, and WEBP receipt images.
 * Validates file type client-side and surfaces inline errors.
 */
export function UploadZone({ onFile, fileError }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) return;
    onFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-10">
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleChange}
        data-testid="input-file"
      />
      <div
        data-testid="drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer
          transition-all duration-200
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
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider font-medium">
            Supports JPG, PNG, WEBP
          </p>
        )}
      </div>
    </div>
  );
}
