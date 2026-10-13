/// <reference types="vite-plugin-pwa/vanillajs" />

interface ImportMetaEnv {
  readonly VITE_VERSION: string;
  readonly VITE_PR_NUMERO?: string;
  readonly VITE_COMMIT?: string;
  readonly VITE_BUILD?: string;
  readonly VITE_SERVICE_RAPPORTS: string;
}
