
export type LanguageValue = "en" // | 'fr' | 'vi' | 'cn' | 'ar';

export const fallbackLng = "en"
export const languages = ["en"]
export const defaultNS = "common"
export const cookieName = "i18next"

export function i18nOptions(lng: string = fallbackLng, ns: string = defaultNS) {
  return {
    // debug: true,
    lng,
    fallbackLng,
    ns,
    defaultNS,
    fallbackNS: defaultNS,
    supportedLngs: languages
  }
}

// ----------------------------------------------------------------------

export const changeLangMessages: Record<
  LanguageValue,
  {
    success: string
    error: string
    loading: string
  }
> = {
  en: {
    success: "Language has been changed!",
    error: "Error changing language!",
    loading: "Loading..."
  }
}
