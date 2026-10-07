/**
 * Utility functions for formatting error messages
 * 
 * All error messages should use the unified translation system.
 * This module handles formatting and cleaning of error messages.
 */

import { translate } from './i18n';

/**
 * Removes trailing dots from error messages
 * Converts translation keys to proper format
 */
export function formatErrorMessage(error: string): string {
    if (!error) return '';
    
    // Remove trailing dots
    let cleaned = error.trim().replace(/\.+$/, '');
    
    // If error looks like a translation key with dots, convert to underscore format
    if (cleaned.includes('.') && !cleaned.includes(' ')) {
        // Handle nested keys like "clinic.name" -> "clinic_name"
        cleaned = cleaned.replace(/\./g, '_');
    }
    
    // Try to translate the error message if it looks like a translation key
    if (cleaned && !cleaned.includes(' ')) {
        const translated = translate(cleaned);
        // Only use translation if it's different from the key (meaning translation exists)
        if (translated !== cleaned && translated !== cleaned.replace(/_/g, ' ')) {
            return translated;
        }
    }
    
    return cleaned;
}

/**
 * Formats field names for display (removes dots and formats nicely)
 * Attempts to translate field names if they look like translation keys
 */
export function formatFieldName(fieldName: string): string {
    if (!fieldName) return '';
    
    // Remove trailing dots and replace dots with spaces
    const formatted = fieldName.replace(/\.+$/, '').replace(/\./g, ' ');
    
    // Try to translate if it looks like a translation key
    if (formatted && !formatted.includes(' ')) {
        const translated = translate(formatted);
        // Only use translation if it's different from the key
        if (translated !== formatted && translated !== formatted.replace(/_/g, ' ')) {
            return translated;
        }
    }
    
    return formatted;
}

/**
 * Cleans validation error messages from Laravel
 * Removes trailing dots and attempts to translate
 */
export function cleanValidationError(error: string | undefined): string {
    if (!error) return '';
    
    return formatErrorMessage(error);
}

