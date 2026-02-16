/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_SUBTITLE: string
  readonly VITE_APP_LOGO: string
  readonly VITE_THEME_PRIMARY: string
  readonly VITE_THEME_SECONDARY: string
  readonly VITE_SERVER_URL: string
  readonly VITE_DEBUG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
