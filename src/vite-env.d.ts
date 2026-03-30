/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INITIAL_BG_IMAGE: string;
  readonly VITE_INITIAL_BG_OPACITY: string;
  readonly VITE_INITIAL_TEAMS_JSON: string;
  readonly VITE_INITIAL_SESSION_JSON: string;
  readonly VITE_INITIAL_AWARDS_JSON: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
