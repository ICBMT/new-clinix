/**
 * RTL utility functions for consistent layout support
 * 
 * @deprecated This file is kept for backward compatibility.
 * Please use rtl-unified.ts for new code.
 * This file re-exports from rtl-unified.ts to maintain compatibility.
 */

import { 
    getFlexDirection, 
    getTextAlign, 
    getIconMargin, 
    getJustify, 
    getRTLClasses,
    getLocale 
} from './rtl-unified';

/**
 * Get RTL-aware flex direction class
 * @deprecated Use getFlexDirection() from rtl-unified.ts
 */
export function rtlFlex(locale?: string): string {
    return getFlexDirection(locale);
}

/**
 * Get RTL-aware text alignment class
 * @deprecated Use getTextAlign() from rtl-unified.ts
 */
export function rtlText(locale?: string): string {
    return getTextAlign(locale);
}

/**
 * Get RTL-aware margin/padding classes for icons
 * Use this for icons in buttons (e.g., ml-2 vs mr-2)
 * @deprecated Use getIconMargin() from rtl-unified.ts
 */
export function rtlIconMargin(locale?: string, margin: 'sm' | 'md' | 'lg' = 'md'): string {
    return getIconMargin(margin, locale);
}

/**
 * Get RTL-aware justify class
 * @deprecated Use getJustify() from rtl-unified.ts
 */
export function rtlJustify(locale?: string): string {
    return getJustify(locale);
}

/**
 * Combine multiple RTL classes
 * @deprecated Use getRTLClasses() from rtl-unified.ts
 */
export function rtlClasses(locale?: string, classes: {
    flex?: boolean;
    text?: boolean;
    justify?: boolean;
} = {}): string {
    return getRTLClasses(classes, locale);
}


