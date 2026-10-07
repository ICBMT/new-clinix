/**
 * Unified RTL/LTR Utility System
 * 
 * This module provides a consistent, unified pattern for RTL/LTR handling across the entire application.
 * All RTL-aware utilities should use functions from this module.
 * 
 * Usage:
 * - In React components: use useRTL() hook (which uses these utilities internally)
 * - In utility functions: import and use functions directly from this module
 * - Always use these utilities instead of hardcoding RTL logic
 */

import { getLocale } from './i18n';

/**
 * Get RTL-aware flex direction class
 */
export function getFlexDirection(locale?: string): string {
    const currentLocale = locale || getLocale();
    return currentLocale === 'ar' ? 'flex-row-reverse' : 'flex-row';
}

/**
 * Get RTL-aware text alignment class
 */
export function getTextAlign(locale?: string): string {
    const currentLocale = locale || getLocale();
    return currentLocale === 'ar' ? 'text-right' : 'text-left';
}

/**
 * Get RTL-aware margin/padding classes for icons
 * Use this for icons in buttons (e.g., ml-2 vs mr-2)
 * @param margin - Size of margin ('sm', 'md', or 'lg')
 * @param locale - Optional locale override
 */
export function getIconMargin(margin: 'sm' | 'md' | 'lg' = 'md', locale?: string): string {
    const currentLocale = locale || getLocale();
    const margins = {
        sm: currentLocale === 'ar' ? 'ml-1' : 'mr-1',
        md: currentLocale === 'ar' ? 'ml-2' : 'mr-2',
        lg: currentLocale === 'ar' ? 'ml-3' : 'mr-3',
    };
    return margins[margin];
}

/**
 * Get RTL-aware justify class
 */
export function getJustify(locale?: string): string {
    const currentLocale = locale || getLocale();
    return currentLocale === 'ar' ? 'justify-end' : 'justify-start';
}

/**
 * Get RTL-aware margin class
 * @param side - 'left' or 'right'
 * @param value - Tailwind value (e.g., '2', '4', 'auto')
 * @param locale - Optional locale override
 */
export function getMargin(side: 'left' | 'right', value: string, locale?: string): string {
    const currentLocale = locale || getLocale();
    if (currentLocale === 'ar') {
        return side === 'left' ? `mr-${value}` : `ml-${value}`;
    }
    return side === 'left' ? `ml-${value}` : `mr-${value}`;
}

/**
 * Get RTL-aware padding class
 * @param side - 'left' or 'right'
 * @param value - Tailwind value (e.g., '2', '4', 'auto')
 * @param locale - Optional locale override
 */
export function getPadding(side: 'left' | 'right', value: string, locale?: string): string {
    const currentLocale = locale || getLocale();
    if (currentLocale === 'ar') {
        return side === 'left' ? `pr-${value}` : `pl-${value}`;
    }
    return side === 'left' ? `pl-${value}` : `pr-${value}`;
}

/**
 * Get RTL-aware space-x class
 */
export function getSpaceX(locale?: string): string {
    const currentLocale = locale || getLocale();
    return currentLocale === 'ar' ? 'space-x-reverse' : '';
}

/**
 * Get input direction ('rtl' or 'ltr')
 */
export function getInputDirection(locale?: string): 'rtl' | 'ltr' {
    const currentLocale = locale || getLocale();
    return currentLocale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Combine multiple RTL classes
 * @param classes - Object with boolean flags for which RTL classes to include
 * @param locale - Optional locale override
 */
export function getRTLClasses(classes: {
    flex?: boolean;
    text?: boolean;
    justify?: boolean;
    spaceX?: boolean;
}, locale?: string): string {
    const result: string[] = [];
    if (classes.flex) result.push(getFlexDirection(locale));
    if (classes.text) result.push(getTextAlign(locale));
    if (classes.justify) result.push(getJustify(locale));
    if (classes.spaceX) result.push(getSpaceX(locale));
    return result.filter(Boolean).join(' ');
}

/**
 * Get RTL-aware float class
 */
export function getFloat(side: 'left' | 'right', locale?: string): string {
    const currentLocale = locale || getLocale();
    if (currentLocale === 'ar') {
        return side === 'left' ? 'float-right' : 'float-left';
    }
    return side === 'left' ? 'float-left' : 'float-right';
}

/**
 * Get direction attribute ('rtl' or 'ltr')
 */
export function getDirection(locale?: string): 'rtl' | 'ltr' {
    const currentLocale = locale || getLocale();
    return currentLocale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Get RTL-aware input direction for specific field types
 * Email, phone, URL should always be LTR
 * @param fieldType - Type of field ('email' | 'phone' | 'url' | 'text' | 'textarea')
 * @param locale - Optional locale override
 */
export function getFieldDirection(fieldType: 'email' | 'phone' | 'url' | 'text' | 'textarea' | 'number' = 'text', locale?: string): 'rtl' | 'ltr' {
    // Email, phone, and URL fields should always be LTR
    if (fieldType === 'email' || fieldType === 'phone' || fieldType === 'url' || fieldType === 'number') {
        return 'ltr';
    }
    // Text and textarea fields follow locale
    return getInputDirection(locale);
}

/**
 * Get RTL-aware text alignment for input fields
 * LTR fields (email, phone) should use text-start
 * RTL fields should use text-right
 */
export function getInputTextAlign(fieldType: 'email' | 'phone' | 'url' | 'text' | 'textarea' | 'number' = 'text', locale?: string): string {
    const currentLocale = locale || getLocale();
    // Email, phone, URL, and number should always be left-aligned (text-start)
    if (fieldType === 'email' || fieldType === 'phone' || fieldType === 'url' || fieldType === 'number') {
        return 'text-start';
    }
    // Text and textarea follow locale
    return currentLocale === 'ar' ? 'text-right' : 'text-left';
}

/**
 * Get all RTL utility classes as an object
 * Useful for destructuring in components
 * @param locale - Optional locale override
 */
export function getRTLUtilities(locale?: string) {
    const currentLocale = locale || getLocale();
    const rtl = currentLocale === 'ar';
    
    return {
        isRTL: rtl,
        locale: currentLocale,
        dir: getDirection(currentLocale),
        textAlign: getTextAlign(currentLocale),
        flexDirection: getFlexDirection(currentLocale),
        spaceX: getSpaceX(currentLocale),
        marginLeft: (value: string) => getMargin('left', value, currentLocale),
        marginRight: (value: string) => getMargin('right', value, currentLocale),
        paddingLeft: (value: string) => getPadding('left', value, currentLocale),
        paddingRight: (value: string) => getPadding('right', value, currentLocale),
        inputDir: getInputDirection(currentLocale),
        getFieldDir: (fieldType: 'email' | 'phone' | 'url' | 'text' | 'textarea' | 'number' = 'text') => getFieldDirection(fieldType, currentLocale),
        getInputTextAlign: (fieldType: 'email' | 'phone' | 'url' | 'text' | 'textarea' | 'number' = 'text') => getInputTextAlign(fieldType, currentLocale),
        floatLeft: getFloat('left', currentLocale),
        floatRight: getFloat('right', currentLocale),
        justify: getJustify(currentLocale),
        iconMargin: (margin: 'sm' | 'md' | 'lg' = 'md') => getIconMargin(margin, currentLocale),
    };
}

