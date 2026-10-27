/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** POST endpoint that receives lead-form JSON (Formspree, Apps Script, CRM webhook). Optional. */
  readonly VITE_LEAD_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
