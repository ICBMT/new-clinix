/**
 * Theme Utilities for Lailah Admin Panel
 * Purple Gradient Theme - Light & Dark Mode Support
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind merge support
 * Useful for component styling with dark mode
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Theme-aware class builder for common patterns
 */
export const themeClasses = {
    // Card styles
    card: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200',
    
    // Background styles
    background: 'bg-background text-foreground',
    muted: 'bg-muted text-muted-foreground',
    primary: 'bg-primary text-primary-foreground',
    
    // Text styles
    textPrimary: 'text-primary',
    textMuted: 'text-muted-foreground',
    textForeground: 'text-foreground',
    
    // Border styles
    border: 'border border-border',
    borderPrimary: 'border border-primary/20',
    
    // Input styles
    input: 'bg-background border border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20',
    
    // Button styles
    buttonPrimary: 'bg-primary-gradient text-white hover:opacity-90 transition-opacity',
    buttonSecondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    buttonGhost: 'hover:bg-accent hover:text-accent-foreground',
    
    // Shadow styles
    shadow: 'shadow-sm hover:shadow-md dark:shadow-slate-900/50',
    shadowLg: 'shadow-md hover:shadow-lg dark:shadow-slate-900/70',
    
    // Sidebar styles
    sidebar: 'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
    sidebarItem: 'hover:bg-primary-gradient/10 dark:hover:bg-slate-700/50 transition-all duration-200',
    sidebarItemActive: 'bg-primary/10 text-primary dark:!bg-primary-gradient dark:!text-white',
    
    // Table styles
    tableHeader: 'bg-muted/50 text-muted-foreground font-semibold',
    tableRow: 'border-b border-border hover:bg-muted/50 transition-colors',
    
    // Status colors (work in both modes)
    statusSuccess: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    statusWarning: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    statusError: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    statusInfo: 'bg-primary/10 text-primary border-primary/20',
};

/**
 * Get status badge classes based on status
 */
export function getStatusClasses(status: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'active' | 'inactive'): string {
    switch (status) {
        case 'success':
        case 'active':
            return themeClasses.statusSuccess;
        case 'warning':
        case 'pending':
            return themeClasses.statusWarning;
        case 'error':
        case 'inactive':
            return themeClasses.statusError;
        case 'info':
            return themeClasses.statusInfo;
        default:
            return 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
}

/**
 * Get icon color classes based on status
 */
export function getIconColorClasses(variant: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error'): string {
    switch (variant) {
        case 'primary':
            return 'text-primary';
        case 'secondary':
            return 'text-secondary-foreground';
        case 'muted':
            return 'text-muted-foreground';
        case 'success':
            return 'text-green-600 dark:text-green-400';
        case 'warning':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'error':
            return 'text-red-600 dark:text-red-400';
        default:
            return 'text-foreground';
    }
}

/**
 * Check if dark mode is currently active
 */
export function isDarkMode(): boolean {
    if (typeof document === 'undefined') return false;
    if (!document.documentElement || !document.documentElement.classList) return false;
    return document.documentElement.classList.contains('dark');
}

/**
 * Get current theme (light, dark, or system)
 */
export function getCurrentTheme(): 'light' | 'dark' | 'system' {
    if (typeof localStorage === 'undefined') return 'system';
    return (localStorage.getItem('appearance') as 'light' | 'dark' | 'system') || 'system';
}

/**
 * Chart color schemes for light and dark modes
 */
export const chartColors = {
    light: {
        primary: 'oklch(0.55 0.18 280)',
        secondary: 'oklch(0.6 0.16 270)',
        tertiary: 'oklch(0.65 0.14 290)',
        gradient: ['#A8B5FF', '#6B46C1'],
    },
    dark: {
        primary: 'oklch(0.65 0.2 280)',
        secondary: 'oklch(0.7 0.18 270)',
        tertiary: 'oklch(0.75 0.16 290)',
        gradient: ['#818CF8', '#5B21B6'],
    },
};

/**
 * Get chart colors based on current theme
 */
export function getChartColors() {
    return isDarkMode() ? chartColors.dark : chartColors.light;
}

/**
 * RTL-aware margin/padding classes
 * 
 * @deprecated Use getRTLUtilities() from rtl-unified.ts instead
 * This function is kept for backward compatibility
 */
import { getRTLUtilities } from './rtl-unified';

export function getRTLClasses(rtl: boolean) {
    const locale = rtl ? 'ar' : 'en';
    const utilities = getRTLUtilities(locale);
    
    return {
        ml: utilities.marginLeft('2'),
        mr: utilities.marginRight('2'),
        pl: utilities.paddingLeft('4'),
        pr: utilities.paddingRight('4'),
        textLeft: rtl ? 'text-right' : 'text-left',
        textRight: rtl ? 'text-left' : 'text-right',
        floatLeft: utilities.floatLeft,
        floatRight: utilities.floatRight,
    };
}

/**
 * Build theme-aware component classes
 */
export function buildComponentClasses(
    baseClasses: string,
    darkClasses?: string,
    rtlClasses?: string,
    customClasses?: string
): string {
    return cn(
        baseClasses,
        darkClasses,
        rtlClasses,
        customClasses
    );
}

/**
 * Get gradient background for different elements
 */
export const gradients = {
    primary: 'bg-primary-gradient',
    primaryText: 'text-primary-gradient',
    primaryHover: 'hover:bg-primary-gradient hover:text-white',
    subtle: 'bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5',
};

/**
 * Animation classes for theme transitions
 */
export const transitions = {
    default: 'transition-all duration-200',
    fast: 'transition-all duration-150',
    slow: 'transition-all duration-300',
    colors: 'transition-colors duration-200',
    shadow: 'transition-shadow duration-200',
};

