import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorCardProps = {
  message: string;
  onReset: () => void;
};

/**
 * Amber warning card shown when the model returns an error (e.g. "Not a receipt",
 * rate-limit exceeded, or unparseable image).
 */
export function ErrorCard({ message, onReset }: ErrorCardProps) {
  return (
    <div className="w-full max-w-xl mx-auto mt-10">
      <Alert
        variant="destructive"
        className="bg-amber-50 border-amber-200 text-amber-900"
        data-testid="card-error"
      >
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800 font-semibold text-base">
          We couldn't read that receipt
        </AlertTitle>
        <AlertDescription className="text-amber-700/90 mt-2 text-sm leading-relaxed">
          {message}
        </AlertDescription>
        <div className="mt-6">
          <Button
            variant="outline"
            className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100/50 hover:text-amber-900"
            onClick={onReset}
            data-testid="button-try-again"
          >
            Try another photo
          </Button>
        </div>
      </Alert>
    </div>
  );
}
