import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocalePreference } from './locale'
import { translationResources } from './translations'

void i18n
  .use(initReactI18next)
  .init({
    resources: translationResources,
    lng: getLocalePreference(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
    keySeparator: false,
    nsSeparator: false,
  })

export { i18n }

