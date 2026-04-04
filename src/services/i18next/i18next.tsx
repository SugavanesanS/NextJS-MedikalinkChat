import * as i18n from 'i18next';
import moment from 'moment';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const defaultNS = 'translation';

export const getLocalization = () => {
    const localisation = typeof window !== 'undefined'
        ? document.querySelector('meta[name="localization"]')?.getAttribute?.('content')
        : undefined
    moment.updateLocale(localisation || "fr", { week: { dow: 1 } })
    return localisation || "fr"
}

const lang = getLocalization()

moment.updateLocale(lang, {
    'week': {
        dow: 1
    }
})

i18n.use(initReactI18next).init({
    lng: lang,
    debug: process.env.NEXT_PUBLIC_ENV == 'dev',
    compatibilityJSON: 'v3',
    resources: {
        en: {
            'translation': en,
        },
        fr: {
            'translation': fr
        }
    },
    interpolation: {
        escapeValue: false  // Disable HTML escaping
    }
});

export default i18n