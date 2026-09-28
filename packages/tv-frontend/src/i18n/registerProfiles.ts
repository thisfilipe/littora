import i18n from '@pelagica/core/i18n';
import en from '../locales/en/profiles.json';
import pt from '../locales/pt/profiles.json';

// Merge Littora's TV-specific labels into the shared profiles namespace.
i18n.addResourceBundle('en', 'profiles', en, true, true);
i18n.addResourceBundle('pt', 'profiles', pt, true, true);
