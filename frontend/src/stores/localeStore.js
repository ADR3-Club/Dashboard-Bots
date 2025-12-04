import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations } from '../locales/translations';

const useLocaleStore = create(
  persist(
    (set, get) => ({
      locale: 'fr', // Default to French

      setLocale: (locale) => {
        if (translations[locale]) {
          set({ locale });
          // Update HTML lang attribute
          document.documentElement.lang = locale;
        }
      },

      t: (key) => {
        const { locale } = get();
        return translations[locale]?.[key] || key;
      },

      toggleLocale: () => {
        const { locale } = get();
        const newLocale = locale === 'fr' ? 'en' : 'fr';
        get().setLocale(newLocale);
      }
    }),
    {
      name: 'locale-storage',
    }
  )
);

export default useLocaleStore;
