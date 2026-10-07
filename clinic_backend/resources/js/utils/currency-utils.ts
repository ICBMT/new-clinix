/**
 * Format currency amount
 * Uses unified translation system - currency codes come from translation files
 * Always uses English number formatting regardless of locale
 */
import { translate, getTranslations } from './i18n';

export function formatCurrency(amount: string | number, currency: string = 'KWD'): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Always use English number formatting (don't convert numbers in Arabic)
    let formattedAmount: string;
    if (isNaN(numAmount) || numAmount === 0) {
        formattedAmount = '0.00';
    } else {
        formattedAmount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount);
    }
    
    // Get currency name from translations
    const currencyKey = `currency_${currency.toLowerCase()}`;
    const translations = getTranslations();
    let currencyName = translations[currencyKey];
    
    // If translation not found, try the translate function
    if (!currencyName || currencyName === currencyKey) {
        currencyName = translate(currencyKey);
    }
    
    // If still not found or returns the key itself, use currency code as fallback
    if (!currencyName || currencyName === currencyKey || currencyName.trim() === '') {
        // Fallback: Use currency code directly (e.g., "KWD" instead of "currency_kwd")
        currencyName = currency;
    }
    
    return `${formattedAmount} ${currencyName}`;
}

