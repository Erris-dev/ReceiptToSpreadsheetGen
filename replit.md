# Receipt to Spreadsheet

Upload a photo of any receipt and get back a clean, exportable table of every line item — vendor, date, currency, quantities, prices, and totals — powered by Mistral AI vision. All parsed values are editable inline before CSV export.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/receipt-to-spreadsheet run dev` — run the frontend (port 19706)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `MISTRAL_API_KEY` — Mistral AI API key for pixtral-12b-2409 vision

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- AI: Mistral `pixtral-12b-2409` via `@mistralai/mistralai`
- DB: PostgreSQL + Drizzle ORM (provisioned, not yet used by any route)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- Build: esbuild (CJS bundle)

## Where things live

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
  api-spec/openapi.yaml               OpenAPI contract (source of truth)
  api-client-react/                   Generated React Query hooks
  api-zod/                            Generated Zod schemas
```

## Architecture decisions

- **Always-200 API errors** — `/api/parse-receipt` never returns a 5xx; all errors come back as `{ "error": "reason" }` at HTTP 200 so the frontend always gets valid JSON. The frontend checks `data.error` inside `onSuccess` rather than relying on `isError`.
- **OpenAPI-first** — the schema in `lib/api-spec/openapi.yaml` is the single source of truth. Run `pnpm --filter @workspace/api-spec run codegen` after any schema change.
- **snake_case item fields** — `unit_price` (not `unitPrice`) matches the model's natural output and the user's extraction prompt exactly.
- **Markdown stripping** — even though the prompt says "no backticks", the response is cleaned with `.replace(/```json/g, "").replace(/```/g, "")` before `JSON.parse()` as a defensive measure.
- **Structured logging** — all server logs use `req.log` (pino-http) or the `logger` singleton. No `console.log` in production paths.
- **Editable state uses strings** — numeric fields (qty, unit_price, total, subtotal, tax) are stored as strings in `EditableReceipt` so inline inputs can be edited freely without numeric coercion mid-type.

## Product

Single-page tool with three states:
1. **Upload** — drag-and-drop zone (JPG/PNG/WEBP), inline file-type error
2. **Loading** — spinner with "Reading your receipt..."
3. **Result** — receipt thumbnail + editable metadata header + editable line items table (add/delete rows) + editable subtotal/tax/total footer + Download CSV button + "Scan another" reset

Error card (amber) shown when the model returns `{ "error": "..." }` — e.g. "Not a receipt", quota exceeded, unparseable image.

## User preferences

- Prompts and decision rationale should be visible and documented (see README.md)
- API always returns HTTP 200 with JSON — no 500s surfaced to the frontend
- snake_case for `unit_price` field to match extraction prompt
- Component structure should be easy to read — each component has a single, clear responsibility

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always run codegen before touching frontend or backend code — otherwise TypeScript types will be stale.
- The API server bundles with esbuild on every `dev` start — it's fast (~100ms) but means you must restart the workflow to pick up backend changes.
- `MISTRAL_API_KEY` must be set as a Replit Secret (not an env var) for the deployed version.
- `@workspace/db` and `drizzle-orm` are present in the repo but not imported by any route. They are safe to ignore.
