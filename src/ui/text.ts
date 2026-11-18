import { formatNumber } from '../i18n/format';
import type { Translations } from '../i18n/locales';

/** Words every screen uses. */
const da = {
  back: 'Tilbage',
  home: 'Til forsiden',
  backHome: 'Tilbage til forsiden',
  cancel: 'Annullér',
  start: 'Start',
  hello: (name: string) => `Hej, ${name}`,
  /** Said of a score or progress: "3 af 10". */
  countOf: (count: number, total: number) =>
    `${formatNumber('da', count)} af ${formatNumber('da', total)}`,
};

export const common: Translations<typeof da> = {
  da,
  en: {
    back: 'Back',
    home: 'Home',
    backHome: 'Back home',
    cancel: 'Cancel',
    start: 'Start',
    hello: (name) => `Hi, ${name}`,
    countOf: (count, total) => `${formatNumber('en', count)} of ${formatNumber('en', total)}`,
  },
};
