import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a receipt parser. Extract structured data from the receipt image.
Return ONLY valid JSON with this exact structure, no markdown, no extra text:
{
  "vendor": "store name or null",
  "date": "date string or null",
  "currency": "3-letter currency code like USD, EUR, GBP",
  "items": [
    { "description": "item name", "qty": 1, "unitPrice": 0.00, "total": 0.00 }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00
}

Rules:
- If the image is not a receipt or is unreadable, respond with: { "error": "reason" }
- All numeric values must be numbers (not strings)
- qty should be a number (default 1 if not shown)
- Use null for vendor or date if not visible
- subtotal, tax, or total can be null if not shown on receipt
- currency must always be a non-null string`;

router.post("/parse-receipt", async (req, res): Promise<void> => {
  const { imageBase64, mediaType } = req.body as {
    imageBase64?: string;
    mediaType?: string;
  };

  if (!imageBase64 || !mediaType) {
    res.status(400).json({ error: "imageBase64 and mediaType are required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY is not configured");
    res.status(500).json({ error: "Gemini API key is not configured" });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          data: imageBase64,
          mimeType: mediaType as "image/jpeg" | "image/png" | "image/webp",
        },
      },
    ]);

    const rawText = result.response.text().trim();

    // Strip markdown code blocks if present
    const jsonText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      req.log.warn({ rawText }, "Failed to parse Gemini response as JSON");
      res.status(422).json({ error: "Could not parse receipt — please try a clearer photo" });
      return;
    }

    if ("error" in parsed && typeof parsed.error === "string") {
      res.status(422).json({ error: parsed.error });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Gemini API error");
    res.status(500).json({ error: "Failed to process receipt image" });
  }
});

export default router;
