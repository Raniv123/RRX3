/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // הוסף משתני סביבה נוספים כאן אם צריך
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
