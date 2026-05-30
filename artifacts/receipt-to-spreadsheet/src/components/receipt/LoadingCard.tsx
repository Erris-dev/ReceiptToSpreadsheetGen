import { Spinner } from "@/components/ui/spinner";

/**
 * Full-width loading state shown while the Mistral API call is in progress.
 */
export function LoadingCard() {
  return (
    <div className="w-full max-w-xl mx-auto mt-20 flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl shadow-sm">
      <Spinner className="w-8 h-8 text-primary mb-6" />
      <p className="text-lg font-medium text-foreground">Reading your receipt...</p>
      <p className="text-sm text-muted-foreground mt-2">Extracting line items and totals</p>
    </div>
  );
}
