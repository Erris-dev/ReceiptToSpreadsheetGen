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
