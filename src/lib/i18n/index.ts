'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from '../translations/tr';
import en from '../translations/en';
import de from '../translations/de';
import ar from '../translations/ar';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: {
        translation: tr
      },
      en: {
        translation: en
      },
      de: {
        translation: de
      },
      ar: {
        translation: ar
      }
    },
    lng: 'tr',
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 