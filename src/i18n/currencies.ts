export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  symbolBefore?: boolean;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', symbolBefore: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', symbolBefore: true },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', symbolBefore: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', symbolBefore: true },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', flag: '🇦🇪', symbolBefore: true },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR ', flag: '🇸🇦', symbolBefore: true },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', symbolBefore: true },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', symbolBefore: true },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', symbolBefore: true },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', symbolBefore: true },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', symbolBefore: true },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', symbolBefore: true },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', symbolBefore: true },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', symbolBefore: true },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', symbolBefore: true },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', symbolBefore: true },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', symbolBefore: true },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', symbolBefore: true },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', symbolBefore: true },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', symbolBefore: true },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽', symbolBefore: true },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', symbolBefore: true },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', flag: '🇨🇭', symbolBefore: true },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', symbolBefore: false },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', symbolBefore: false },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', symbolBefore: true },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', symbolBefore: true },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', symbolBefore: false },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', symbolBefore: true },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD ', flag: '🇰🇼', symbolBefore: true },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR ', flag: '🇶🇦', symbolBefore: true },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR ', flag: '🇴🇲', symbolBefore: true },
];

export const getCurrencyByCode = (codeOrSymbol: string): CurrencyOption => {
  const found = SUPPORTED_CURRENCIES.find(
    (c) => c.code.toUpperCase() === codeOrSymbol.toUpperCase() || c.symbol.trim() === codeOrSymbol.trim()
  );
  return (
    found || {
      code: 'INR',
      name: 'Indian Rupee',
      symbol: codeOrSymbol || '₹',
      flag: '🇮🇳',
      symbolBefore: true,
    }
  );
};
