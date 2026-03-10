import { ja } from "./ja";
import { en } from "./en";

export type Translations = typeof ja;
export type TranslationKey = keyof Translations;
export type Locale = "ja" | "en";

export const translations: Record<Locale, Translations> = { ja, en };
