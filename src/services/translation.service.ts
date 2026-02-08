import "dotenv/config";
import { LingoDotDevEngine } from "lingo.dev/sdk";

const apiKey = process.env.LINGODOTDEV_API_KEY;
if (!apiKey) {
  throw new Error("LINGODOTDEV_API_KEY is missing");
}

const lingo = new LingoDotDevEngine({ apiKey });

export interface TranslateOptions {
  sourceLocale: string;
  targetLocale: string;
  fast?: boolean;
}

/**
 * Translates text using lingo.dev.
 *
 * @returns Translated text string
 * @throws Error when translation fails
 */
export async function translateText(
  text: string,
  { sourceLocale, targetLocale, fast = false }: TranslateOptions
): Promise<string> {
  try {
    const result = await lingo.localizeText(text, {
      sourceLocale,
      targetLocale,
      fast,
    });

    if (typeof result !== "string") {
      throw new Error("Invalid translation response");
    }

    return result;
  } catch (err: any) {
    console.error("[translateText] failed:", err?.status ?? err?.code ?? "UNKNOWN_ERROR");
    throw new Error("Translation failed");
  }
}