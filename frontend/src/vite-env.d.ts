/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend. Vacía en desarrollo: Vite redirige /api al backend. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
