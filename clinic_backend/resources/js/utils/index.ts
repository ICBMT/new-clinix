/**
 * Unified Utilities Index
 * 
 * This file exports all unified utilities for easy importing.
 * All utilities follow the same pattern and use the unified translation and RTL systems.
 */

// Translation utilities
export { translate, getLocale, getTranslations, isRTL, getDirection } from './i18n';

// RTL/LTR utilities
export {
    getFlexDirection,
    getTextAlign,
    getIconMargin,
    getJustify,
    getMargin,
    getPadding,
    getSpaceX,
    getInputDirection,
    getRTLClasses,
    getFloat,
    getRTLUtilities,
} from './rtl-unified';

// Date utilities
export { formatHumanDate } from './date-utils';

// Currency utilities
export { formatCurrency } from './currency-utils';

// File utilities
export { formatFileSize } from './file-utils';

// Localization utilities
export {
    getLocalizedName,
    getLocalizedDescription,
    getLocalizedCompanyName,
    getLocalizedBio,
} from './localization';

// Error formatting utilities
export {
    formatErrorMessage,
    formatFieldName,
    cleanValidationError,
} from './error-formatting';

// Re-export theme utilities (they use RTL utilities internally)
export {
    cn,
    themeClasses,
    getStatusClasses,
    getIconColorClasses,
    isDarkMode,
    getCurrentTheme,
    chartColors,
    getChartColors,
    getRTLClasses as getThemeRTLClasses,
    buildComponentClasses,
    gradients,
    transitions,
} from './theme-utils';





