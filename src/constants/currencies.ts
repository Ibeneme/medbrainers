/**
 * Selling currencies for the pharmacy with country flags. Codes are ISO-4217.
 * NGN = Nigerian Naira, USD = US Dollar, EUR = Euro, and so on.
 */
export interface CurrencyOption {
  code: string;
  name: string;
  region: "Africa" | "Americas" | "Europe" | "Asia" | "Middle East" | "Oceania";
  /** Emoji flag representing the primary country/region for the currency */
  flag?: string;
  /** Optional hand-picked symbol; falls back to Intl's narrow symbol, then the code. */
  symbol?: string;
}

export const DEFAULT_CURRENCY = "NGN";

export const CURRENCIES: CurrencyOption[] = [
  /* ------------------------------- Africa ------------------------------- */
  { code: "NGN", name: "Nigerian Naira", region: "Africa", flag: "🇳🇬", symbol: "₦" },
  { code: "GHS", name: "Ghanaian Cedi", region: "Africa", flag: "🇬🇭", symbol: "GH₵" },
  { code: "KES", name: "Kenyan Shilling", region: "Africa", flag: "🇰🇪", symbol: "KSh" },
  { code: "ZAR", name: "South African Rand", region: "Africa", flag: "🇿🇦", symbol: "R" },
  { code: "EGP", name: "Egyptian Pound", region: "Africa", flag: "🇪🇬", symbol: "E£" },
  { code: "MAD", name: "Moroccan Dirham", region: "Africa", flag: "🇲🇦", symbol: "MAD" },
  { code: "TZS", name: "Tanzanian Shilling", region: "Africa", flag: "🇹🇿", symbol: "TSh" },
  { code: "UGX", name: "Ugandan Shilling", region: "Africa", flag: "🇺🇬", symbol: "USh" },
  { code: "RWF", name: "Rwandan Franc", region: "Africa", flag: "🇷🇼", symbol: "RF" },
  { code: "ETB", name: "Ethiopian Birr", region: "Africa", flag: "🇪🇹", symbol: "Br" },
  { code: "XOF", name: "West African CFA Franc (BCEAO)", region: "Africa", flag: "🌍", symbol: "CFA" },
  { code: "XAF", name: "Central African CFA Franc (BEAC)", region: "Africa", flag: "🌍", symbol: "FCFA" },
  { code: "DZD", name: "Algerian Dinar", region: "Africa", flag: "🇩🇿", symbol: "DA" },
  { code: "TND", name: "Tunisian Dinar", region: "Africa", flag: "🇹🇳", symbol: "DT" },
  { code: "LYD", name: "Libyan Dinar", region: "Africa", flag: "🇱🇾", symbol: "LD" },
  { code: "ZMW", name: "Zambian Kwacha", region: "Africa", flag: "🇿🇲", symbol: "ZK" },
  { code: "MWK", name: "Malawian Kwacha", region: "Africa", flag: "🇲🇼", symbol: "MK" },
  { code: "MZN", name: "Mozambican Metical", region: "Africa", flag: "🇲🇿", symbol: "MT" },
  { code: "BWP", name: "Botswana Pula", region: "Africa", flag: "🇧🇼", symbol: "P" },
  { code: "NAD", name: "Namibian Dollar", region: "Africa", flag: "🇳🇦", symbol: "N$" },
  { code: "SZL", name: "Eswatini Lilangeni", region: "Africa", flag: "🇸🇿", symbol: "E" },
  { code: "LSL", name: "Lesotho Loti", region: "Africa", flag: "🇱🇸", symbol: "L" },
  { code: "AOA", name: "Angolan Kwanza", region: "Africa", flag: "🇦🇴", symbol: "Kz" },
  { code: "CDF", name: "Congolese Franc", region: "Africa", flag: "🇨🇩", symbol: "FC" },
  { code: "SLE", name: "Sierra Leonean Leone", region: "Africa", flag: "🇸🇱", symbol: "Le" },
  { code: "LRD", name: "Liberian Dollar", region: "Africa", flag: "🇱🇷", symbol: "L$" },
  { code: "GMD", name: "Gambian Dalasi", region: "Africa", flag: "🇬🇲", symbol: "D" },
  { code: "GNF", name: "Guinean Franc", region: "Africa", flag: "🇬🇳", symbol: "FG" },
  { code: "SDG", name: "Sudanese Pound", region: "Africa", flag: "🇸🇩", symbol: "SDG" },
  { code: "SSP", name: "South Sudanese Pound", region: "Africa", flag: "🇸🇸", symbol: "SSP" },
  { code: "SOS", name: "Somali Shilling", region: "Africa", flag: "🇸🇴", symbol: "Sh" },
  { code: "DJF", name: "Djiboutian Franc", region: "Africa", flag: "🇩🇯", symbol: "Fdj" },
  { code: "ERN", name: "Eritrean Nakfa", region: "Africa", flag: "🇪🇷", symbol: "Nfk" },
  { code: "BIF", name: "Burundian Franc", region: "Africa", flag: "🇧🇮", symbol: "FBu" },
  { code: "MGA", name: "Malagasy Ariary", region: "Africa", flag: "🇲🇬", symbol: "Ar" },
  { code: "MUR", name: "Mauritian Rupee", region: "Africa", flag: "🇲🇺", symbol: "Rs" },
  { code: "SCR", name: "Seychellois Rupee", region: "Africa", flag: "🇸🇨", symbol: "SR" },
  { code: "CVE", name: "Cape Verdean Escudo", region: "Africa", flag: "🇨🇻", symbol: "CVE" },
  { code: "STN", name: "São Tomé & Príncipe Dobra", region: "Africa", flag: "🇸🇹", symbol: "Db" },
  { code: "MRU", name: "Mauritanian Ouguiya", region: "Africa", flag: "🇲🇷", symbol: "UM" },
  { code: "KMF", name: "Comorian Franc", region: "Africa", flag: "🇰🇲", symbol: "CF" },
  { code: "ZWL", name: "Zimbabwean Dollar", region: "Africa", flag: "🇿🇼", symbol: "Z$" },

  /* --------------------- Global / top-economy currencies ------------------ */
  { code: "USD", name: "US Dollar", region: "Americas", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", name: "Euro", region: "Europe", flag: "🇪🇺", symbol: "€" },
  { code: "GBP", name: "British Pound", region: "Europe", flag: "🇬🇧", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", region: "Americas", flag: "🇨🇦", symbol: "CA$" },
  { code: "BRL", name: "Brazilian Real", region: "Americas", flag: "🇧🇷", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", region: "Americas", flag: "🇲🇽", symbol: "MX$" },
  { code: "ARS", name: "Argentine Peso", region: "Americas", flag: "🇦🇷", symbol: "AR$" },
  { code: "CLP", name: "Chilean Peso", region: "Americas", flag: "🇨🇱", symbol: "CLP$" },
  { code: "COP", name: "Colombian Peso", region: "Americas", flag: "🇨🇴", symbol: "COL$" },
  { code: "JMD", name: "Jamaican Dollar", region: "Americas", flag: "🇯🇲", symbol: "J$" },
  { code: "TTD", name: "Trinidad & Tobago Dollar", region: "Americas", flag: "🇹🇹", symbol: "TT$" },
  { code: "CHF", name: "Swiss Franc", region: "Europe", flag: "🇨🇭", symbol: "CHF" },
  { code: "SEK", name: "Swedish Krona", region: "Europe", flag: "🇸🇪", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", region: "Europe", flag: "🇳🇴", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", region: "Europe", flag: "🇩🇰", symbol: "kr" },
  { code: "PLN", name: "Polish Złoty", region: "Europe", flag: "🇵🇱", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", region: "Europe", flag: "🇨🇿", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", region: "Europe", flag: "🇭🇺", symbol: "Ft" },
  { code: "RON", name: "Romanian Leu", region: "Europe", flag: "🇷🇴", symbol: "lei" },
  { code: "TRY", name: "Turkish Lira", region: "Europe", flag: "🇹🇷", symbol: "₺" },
  { code: "RUB", name: "Russian Ruble", region: "Europe", flag: "🇷🇺", symbol: "₽" },
  { code: "UAH", name: "Ukrainian Hryvnia", region: "Europe", flag: "🇺🇦", symbol: "₴" },
  { code: "JPY", name: "Japanese Yen", region: "Asia", flag: "🇯🇵", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", region: "Asia", flag: "🇨🇳", symbol: "CN¥" },
  { code: "HKD", name: "Hong Kong Dollar", region: "Asia", flag: "🇭🇰", symbol: "HK$" },
  { code: "INR", name: "Indian Rupee", region: "Asia", flag: "🇮🇳", symbol: "₹" },
  { code: "PKR", name: "Pakistani Rupee", region: "Asia", flag: "🇵🇰", symbol: "Rs" },
  { code: "BDT", name: "Bangladeshi Taka", region: "Asia", flag: "🇧🇩", symbol: "৳" },
  { code: "LKR", name: "Sri Lankan Rupee", region: "Asia", flag: "🇱🇰", symbol: "Rs" },
  { code: "KRW", name: "South Korean Won", region: "Asia", flag: "🇰🇷", symbol: "₩" },
  { code: "SGD", name: "Singapore Dollar", region: "Asia", flag: "🇸🇬", symbol: "S$" },
  { code: "MYR", name: "Malaysian Ringgit", region: "Asia", flag: "🇲🇾", symbol: "RM" },
  { code: "THB", name: "Thai Baht", region: "Asia", flag: "🇹🇭", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", region: "Asia", flag: "🇮🇩", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", region: "Asia", flag: "🇵🇭", symbol: "₱" },
  { code: "VND", name: "Vietnamese Dong", region: "Asia", flag: "🇻🇳", symbol: "₫" },
  { code: "AED", name: "UAE Dirham", region: "Middle East", flag: "🇦🇪", symbol: "AED" },
  { code: "SAR", name: "Saudi Riyal", region: "Middle East", flag: "🇸🇦", symbol: "SAR" },
  { code: "QAR", name: "Qatari Riyal", region: "Middle East", flag: "🇶🇦", symbol: "QAR" },
  { code: "KWD", name: "Kuwaiti Dinar", region: "Middle East", flag: "🇰🇼", symbol: "KD" },
  { code: "ILS", name: "Israeli Shekel", region: "Middle East", flag: "🇮🇱", symbol: "₪" },
  { code: "AUD", name: "Australian Dollar", region: "Oceania", flag: "🇦🇺", symbol: "A$" },
  { code: "NZD", name: "New Zealand Dollar", region: "Oceania", flag: "🇳🇿", symbol: "NZ$" },
];

export const CURRENCY_REGIONS: CurrencyOption["region"][] = ["Africa", "Americas", "Europe", "Asia", "Middle East", "Oceania"];

const byCode = new Map(CURRENCIES.map((c) => [c.code, c]));

export const getCurrency = (code?: string | null) => byCode.get((code || DEFAULT_CURRENCY).toUpperCase());

/** "₦", "$", "€", "GH₵" … falls back to the ISO code. */
export function currencySymbol(code?: string | null): string {
  const c = (code || DEFAULT_CURRENCY).toUpperCase();
  return byCode.get(c)?.symbol || c;
}

/** "₦1,250.50", "$12.00", "€3.40". Zero-decimal currencies (JPY, UGX, XOF …) show no decimals. */
export function formatMoney(amount?: number | null, code?: string | null): string {
  const c = (code || DEFAULT_CURRENCY).toUpperCase();
  const n = Number(amount ?? 0) || 0;
  let digits = 2;
  try {
    digits = new Intl.NumberFormat("en", { style: "currency", currency: c }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    /* unknown to this runtime – keep 2 */
  }
  // whole amounts read cleanly ("₦5,000"); anything with kobo/cents always shows full precision ("₦1,250.50", never "₦1,250.5")
  const body = n.toLocaleString(undefined, { minimumFractionDigits: Number.isInteger(n) ? 0 : digits, maximumFractionDigits: digits });
  const sym = currencySymbol(c);
  // long textual symbols read better with a space ("CHF 12", "AED 40")
  return /^[A-Za-z]{2,}$/.test(sym) ? `${sym} ${body}` : `${sym}${body}`;
}

/* Active currency for the current facility. Set by usePharmacy() as soon as the setup loads. */
let activeCurrency = DEFAULT_CURRENCY;
export const setActiveCurrency = (code?: string | null) => {
  activeCurrency = (code || DEFAULT_CURRENCY).toUpperCase();
};
export const getActiveCurrency = () => activeCurrency;