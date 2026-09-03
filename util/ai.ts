import Constants from "expo-constants";

const MODEL = "gemini-3.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = [
  "Read the nutrition table in this photo and return the values per 100 g.",
  "If the label lists values only per serving, convert them using the stated serving size.",
  "If both a per-100g and a per-serving column are present, use the per-100g column.",
  "The label may be in any language. Return productName in the language printed on the package.",
  "Only set productName if a product or brand name is actually visible in the photo.",
  "Nutrition tables are often photographed without the front of the package, so if no name is visible return an empty string. Never guess a name from the ingredients or the nutrition values.",
  "calories is in kcal. fat, carbohydrates, sugar, protein and fiber are in grams.",
  "Use 0 for any value the label does not list.",
].join(" ");

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    productName: { type: "STRING" },
    calories: { type: "NUMBER" },
    fat: { type: "NUMBER" },
    carbohydrates: { type: "NUMBER" },
    sugar: { type: "NUMBER" },
    protein: { type: "NUMBER" },
    fiber: { type: "NUMBER" },
  },
  required: [
    "productName",
    "calories",
    "fat",
    "carbohydrates",
    "sugar",
    "protein",
    "fiber",
  ],
};

export type LabelReading = {
  productName: string;
  calories: number;
  fat: number;
  carbohydrates: number;
  sugar: number;
  protein: number;
  fiber: number;
};

const toNumber = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;

export const readNutritionLabel = async (
  base64Jpeg: string,
  signal?: AbortSignal,
): Promise<LabelReading> => {
  const apiKey = Constants.expoConfig?.extra?.geminiApiKey;
  if (!apiKey) throw new Error("Missing Gemini API key");

  const response = await fetch(ENDPOINT, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: "image/jpeg", data: base64Jpeg } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const parsed = JSON.parse(text);

  return {
    productName:
      typeof parsed?.productName === "string" ? parsed.productName.trim() : "",
    calories: toNumber(parsed?.calories),
    fat: toNumber(parsed?.fat),
    carbohydrates: toNumber(parsed?.carbohydrates),
    sugar: toNumber(parsed?.sugar),
    protein: toNumber(parsed?.protein),
    fiber: toNumber(parsed?.fiber),
  };
};
