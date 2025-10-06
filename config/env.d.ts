/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_REDIRECT_URI: string;
  readonly VITE_BACKEND_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
