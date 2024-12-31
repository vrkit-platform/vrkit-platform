import i18next from "i18next"
import resourcesToBackend from "i18next-resources-to-backend"
import LanguageDetector from "i18next-browser-languagedetector"
import { I18nextProvider as Provider, initReactI18next } from "react-i18next"
import { localStorageGetItem } from "vrkit-app-renderer/utils/storage-available"
import { fallbackLng, i18nOptions } from "./config-locales"

const lng = localStorageGetItem("i18nextLng", fallbackLng)

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend((lang: string, ns: string) => import(`./langs/${lang}/${ns}.json`)))
  .init({ ...i18nOptions(lng), detection: { caches: ["localStorage"] } })

// ----------------------------------------------------------------------

export type I18nProviderProps = {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <Provider i18n={i18next}>{children}</Provider>
}

export default I18nProvider
