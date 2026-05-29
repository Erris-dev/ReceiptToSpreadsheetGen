import { Router, type IRouter } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a receipt data extractor. Analyze this image and extract whatever data you can see.

Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Just the JSON.

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
- Always return valid JSON, no matter what`;

router.post("/parse-receipt", async (req, res): Promise<void> => {
  if (!process.env.GEMINI_API_KEY) {
    req.log.warn("GEMINI_API_KEY is not configured");
    res.json({ error: "API key not configured" });
    return;
  }

  req.log.info({ keyPrefix: process.env.GEMINI_API_KEY.slice(0, 5) }, "GEMINI_API_KEY loaded");

  try {
    const { imageBase64, mediaType } = req.body as {
      imageBase64?: string;
      mediaType?: string;
    };

    if (!imageBase64 || !mediaType) {
      res.json({ error: "imageBase64 and mediaType are required" });
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

    const text = result.response.text();

    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(clean) as Record<string, unknown>;
    } catch {
      req.log.warn({ raw: text }, "Failed to parse Gemini response as JSON");
      res.json({ error: "Could not parse receipt" });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Unexpected error in parse-receipt");
    res.json({ error: "Could not parse receipt" });
  }
});

export default router;
