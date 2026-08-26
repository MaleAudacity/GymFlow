import { LanguageCode, SUPPORTED_LANGUAGES, translations } from './translations';
import { CurrencyOption, SUPPORTED_CURRENCIES, getCurrencyByCode } from './currencies';
import { CountryOption, SUPPORTED_COUNTRIES, getCountryByCode } from './countries';

export * from './translations';
export * from './currencies';
export * from './countries';

export const getTranslation = (
  key: string,
  lang: LanguageCode = 'en',
  params?: Record<string, string | number>
): string => {
  const dict = translations[lang] || translations.en;
  let text = dict[key] || translations.en[key] || key;

  if (params) {
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
    });
  }

  return text;
};

export const formatCurrency = (
  amount: number,
  currencyCodeOrSymbol: string = 'INR',
  options?: { decimals?: number }
): string => {
  const curr = getCurrencyByCode(currencyCodeOrSymbol);
  const decimals = options?.decimals !== undefined ? options.decimals : (amount % 1 === 0 ? 0 : 2);
  const formattedNum = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (curr.symbolBefore) {
    return `${curr.symbol}${formattedNum}`;
  } else {
    return `${formattedNum} ${curr.symbol}`;
  }
};

export const formatDate = (
  dateInput: string | number | Date,
  lang: LanguageCode = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const d = new Date(dateInput);
    return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang, options || {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
};
