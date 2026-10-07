/**
 * Format file size to human-readable format
 * Uses unified translation system - all size units come from translation files
 */
import { translate } from './i18n';

export function formatFileSize(bytes: number): string {
    if (bytes === 0) {
        const bytesUnit = translate('file_size_bytes');
        return `0 ${bytesUnit}`;
    }
    
    const k = 1024;
    const sizeUnits = ['bytes', 'kb', 'mb', 'gb', 'tb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    
    // Get unit translation
    const unitKey = `file_size_${sizeUnits[i]}`;
    const unit = translate(unitKey) || sizeUnits[i].toUpperCase();
    
    // Format using translation template or fallback
    const formatTemplate = translate('file_size_format');
    if (formatTemplate && formatTemplate !== 'file_size_format') {
        return formatTemplate
            .replace('{size}', size.toString())
            .replace('{unit}', unit);
    }
    
    // Fallback format
    return `${size} ${unit}`;
}

