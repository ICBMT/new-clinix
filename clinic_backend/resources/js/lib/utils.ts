import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency-utils';

/**
 * Combines class names with Tailwind merge support
 * This is the standard utility for combining classes in the application
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format currency amount
 * Uses unified translation system and currency-utils
 * 
 * @deprecated Use formatCurrency from utils/currency-utils.ts instead
 * This function is kept for backward compatibility
 */
export function formatCurrency(amount: number | string, currency: string = 'KWD'): string {
    return formatCurrencyUtil(amount, currency);
}
