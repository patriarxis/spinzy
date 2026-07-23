/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_SETTINGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
