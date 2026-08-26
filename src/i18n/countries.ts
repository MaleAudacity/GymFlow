export interface CountryOption {
  code: string; // ISO 2-letter
  name: string;
  dialCode: string;
  flag: string;
  defaultCurrency: string;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', defaultCurrency: 'INR' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', defaultCurrency: 'USD' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', defaultCurrency: 'GBP' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', defaultCurrency: 'AED' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', defaultCurrency: 'SAR' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', defaultCurrency: 'CAD' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', defaultCurrency: 'AUD' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', defaultCurrency: 'EUR' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', defaultCurrency: 'EUR' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', defaultCurrency: 'EUR' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', defaultCurrency: 'EUR' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', defaultCurrency: 'BRL' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', defaultCurrency: 'MXN' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', defaultCurrency: 'SGD' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', defaultCurrency: 'MYR' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', defaultCurrency: 'IDR' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', defaultCurrency: 'PHP' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', defaultCurrency: 'THB' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', defaultCurrency: 'VND' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', defaultCurrency: 'BDT' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', defaultCurrency: 'PKR' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', defaultCurrency: 'LKR' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', defaultCurrency: 'NPR' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', defaultCurrency: 'ZAR' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', defaultCurrency: 'NGN' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', defaultCurrency: 'KES' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', defaultCurrency: 'EGP' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', defaultCurrency: 'KWD' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', defaultCurrency: 'QAR' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', defaultCurrency: 'OMR' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', defaultCurrency: 'BHD' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', defaultCurrency: 'TRY' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', defaultCurrency: 'RUB' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', defaultCurrency: 'JPY' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', defaultCurrency: 'KRW' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', defaultCurrency: 'NZD' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', defaultCurrency: 'EUR' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', defaultCurrency: 'EUR' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', defaultCurrency: 'EUR' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', defaultCurrency: 'SEK' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', defaultCurrency: 'NOK' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', defaultCurrency: 'CHF' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', defaultCurrency: 'EUR' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', defaultCurrency: 'PLN' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', defaultCurrency: 'EUR' },
];

export const getCountryByCode = (code: string): CountryOption => {
  const found = SUPPORTED_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return (
    found || {
      code: 'IN',
      name: 'India',
      dialCode: '+91',
      flag: '🇮🇳',
      defaultCurrency: 'INR',
    }
  );
};
