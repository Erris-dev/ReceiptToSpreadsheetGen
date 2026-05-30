# Receipt to Spreadsheet

Upload a photo of any receipt and get back a clean, exportable table of every line item — vendor, date, currency, quantities, prices, and totals. All values are editable before export.

---

## What it does

1. **Drag-and-drop upload** — accepts JPG, PNG, or WEBP images of receipts
2. **AI vision parsing** — sends the image to Mistral's `pixtral-12b-2409` model, which extracts structured JSON
3. **Editable results table** — every field (vendor, date, currency, line items, totals) is editable inline before export; rows can be added or deleted
4. **Download CSV** — one click exports the corrected receipt data
5. **Error states** — wrong file type (inline), unreadable receipt (yellow warning card), API quota errors (clear message)

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS + shadcn/ui |
| Backend | Express 5 (Node.js 24) |
| AI | Mistral `pixtral-12b-2409` via `@mistralai/mistralai` |
| Monorepo | pnpm workspaces |
| API contract | OpenAPI → Orval codegen (Zod schemas + React Query hooks) |

---

## Run it in under 5 minutes

### On Replit (fastest)

1. Fork this Repl
2. Open **Secrets** and add:
   - `MISTRAL_API_KEY` — get one free at [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
3. Click **Run** — both workflows start automatically
4. Open the preview pane and drop a receipt photo in

### Local clone

```bash
git clone <repo-url>
cd <repo>

# Install dependencies
pnpm install

# Set env var (only one required)
export MISTRAL_API_KEY=your_key_here

# Start both services (two terminals)
pnpm --filter @workspace/api-server run dev              # API on :8080
pnpm --filter @workspace/receipt-to-spreadsheet run dev  # UI on :5173
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project structure

```
artifacts/
  api-server/
    src/routes/parse-receipt.ts       Mistral vision call, JSON cleaning, error handling
  receipt-to-spreadsheet/
    src/
      pages/
        home.tsx                      State orchestrator — owns all receipt state
      components/
        receipt/
          UploadZone.tsx              Drag-and-drop file picker with inline validation
          LoadingCard.tsx             Spinner shown during the Mistral API call
          ErrorCard.tsx               Amber warning card for model / API errors
          MetaHeader.tsx              Editable vendor / date / currency + Download button
          EditableTable.tsx           Line items table with add / remove row controls
          FooterTotals.tsx            Editable subtotal / tax / total footer
          ResultsView.tsx             Composes all result components with the receipt thumbnail
          EditCell.tsx                Transparent inline input for table cells
          EditMeta.tsx                Transparent inline input for metadata fields
        ui/                           shadcn/ui primitives (button, card, table, …)
      types/
        receipt.ts                    EditableItem and EditableReceipt types
lib/
  api-spec/openapi.yaml               OpenAPI contract (source of truth for types and hooks)
  api-client-react/                   Generated React Query hooks
  api-zod/                            Generated Zod schemas
```

---

## API

**`POST /api/parse-receipt`**

Request body:
```json
{ "imageBase64": "<base64 string>", "mediaType": "image/jpeg" }
```

Success (HTTP 200):
```json
{
  "vendor": "Whole Foods Market",
  "date": "2024-11-15",
  "currency": "USD",
  "items": [
    { "description": "Organic Bananas", "qty": 1, "unit_price": 0.79, "total": 0.79 }
  ],
  "subtotal": 0.79,
  "tax": 0.07,
  "total": 0.86
}
```

Error (also HTTP 200 — always valid JSON, never a 500):
```json
{ "error": "Not a receipt" }
```

All fields except `items` can be `null` if not visible on the receipt.

---

## What I'd do with more time

- **Retry with backoff** — Mistral returns a `retryDelay` hint on 429s; use it to auto-retry once before surfacing the error to the user
- **Multi-page receipts** — let users upload several photos of the same long receipt and merge the parsed items into one table
- **Receipt history** — persist past scans in localStorage (or a DB) so users can re-download without re-uploading
- **Currency formatting** — use `Intl.NumberFormat` with the detected currency code to show proper symbols and decimal conventions
- **Image preprocessing** — auto-rotate, deskew, and boost contrast on the client before sending, to improve accuracy on phone photos
- **Google Sheets export** — one-click push to a new sheet via the Sheets API, not just CSV download

---

## Prompts used

Everything below was typed verbatim into the Replit Agent chat to build this project.

---

### Prompt 1 — Initial build

```
Build a Next.js app called "Receipt to Spreadsheet".

The app lets a user upload a photo of a receipt and get back a parsed table of
items, totals, and currency.

Stack:
- Next.js App Router
- Tailwind CSS for styling
- @google/generative-ai SDK for vision parsing

Features:
1. A drag-and-drop upload zone that accepts JPG, PNG, WEBP images
2. A POST API route at /api/parse-receipt that:
   - Accepts base64 image + mediaType
   - Calls gemini-2.0-flash with a vision prompt
   - Returns JSON: { vendor, date, currency, items[], subtotal, tax, total }
   - Returns { error: "reason" } if image is unreadable
3. A results table showing:
   - Header: vendor, date, currency
   - Line items: Description | Qty | Unit Price | Total
   - Footer: subtotal, tax, grand total
4. A "Download CSV" button that exports the parsed data
5. Error states:
   - Wrong file type: "Please upload an image (JPG, PNG, WEBP)"
   - Unreadable receipt: show error in a yellow warning card
   - Loading: spinner with "Reading your receipt..."

Read the API key from environment variable GEMINI_API_KEY.
Do not hardcode any API keys.
```

---

### Prompt 2 — Custom extraction prompt + schema change

```
You are a receipt data extractor. Analyze this image and extract whatever
data you can see.

Return ONLY a raw JSON object. No markdown. No backticks. No explanation.
Just the JSON.

Use this exact structure:
{
  "vendor": "string or null",
  "date": "string or null",
  "currency": "string or null",
  "items": [
    {
      "description": "string or null",
      "qty": number or null,
      "unit_price": number or null,
      "total": number or null
    }
  ],
  "subtotal": number or null,
  "tax": number or null,
  "total": number or null
}

Rules:
- If you can read a value clearly, fill it in
- If a value is missing, unclear, or not visible, set it to null
- Never guess or make up values
- If there are no line items visible, return "items": []
- If the image is not a receipt at all, return { "error": "Not a receipt" }
- Always return valid JSON, no matter what
```

---

### Prompt 3 — JSON parsing hardening + always-200 errors

```
In the /api/parse-receipt route, fix the JSON parsing to handle
markdown-wrapped responses. Before JSON.parse(), clean the text like this:

const clean = text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim()

Also wrap the entire function in a try/catch and if anything fails
return Response.json({ error: "Could not parse receipt" }, { status: 200 })
so the frontend always gets valid JSON instead of a 500 error.

Add a check at the start of the /api/parse-receipt route:
if (!process.env.GEMINI_API_KEY) {
  return Response.json({ error: "API key not configured" }, { status: 200 })
}
Console.log the first 5 characters of the key so we can confirm it's loading.
```

---

### Prompt 4 — Switch to Mistral AI

```
Replace the Gemini SDK with Mistral AI.
Install @mistralai/mistralai package.
Use the model "pixtral-12b-2409" for vision.
Read the API key from MISTRAL_API_KEY environment variable.
Keep the same JSON response structure:
{
  "vendor", "date", "currency", "items[]", "subtotal", "tax", "total"
}
with nulls for any fields that can't be read.
```
