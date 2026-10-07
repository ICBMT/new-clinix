import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { useRTL } from '@/hooks/use-rtl';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface FormFieldProps extends Omit<HTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'onChange'> {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    error?: string | string[];
    placeholder?: string;
    required?: boolean;
    type?: 'text' | 'textarea' | 'email' | 'tel' | 'password' | 'url' | 'number';
    dir?: 'ltr' | 'rtl' | 'auto';
    className?: string;
    labelClassName?: string;
    inputClassName?: string;
    maxLength?: number;
    minLength?: number;
    disabled?: boolean;
    readOnly?: boolean;
    autoComplete?: string;
    ariaDescribedBy?: string;
}

/**
 * Universal form field component for all admin panel forms
 * Handles RTL, labels, errors, and accessibility automatically
 */
export function FormField({
    label,
    name,
    value,
    onChange,
    error,
    placeholder,
    required = false,
    type = 'text',
    dir = 'auto',
    className,
    labelClassName,
    inputClassName,
    maxLength,
    minLength,
    disabled = false,
    readOnly = false,
    autoComplete,
    ariaDescribedBy,
    ...props
}: FormFieldProps) {
    const { t } = useTranslation();
    const { isRTL } = useRTL();
    const fieldId = `field-${name}`;
    const errorId = `${fieldId}-error`;
    const describedBy = [error ? errorId : null, ariaDescribedBy].filter(Boolean).join(' ') || undefined;
    
    // Normalize error to string
    const errorMessage = Array.isArray(error) ? error[0] : error;

    // Determine direction based on field type if auto
    let fieldDir = dir;
    if (dir === 'auto') {
        // English fields should be LTR, Arabic fields should be RTL
        if (name.includes('_en') || name.includes('_english') || type === 'email' || type === 'url') {
            fieldDir = 'ltr';
        } else if (name.includes('_ar') || name.includes('_arabic')) {
            fieldDir = 'rtl';
        } else {
            fieldDir = isRTL ? 'rtl' : 'ltr';
        }
    }

    return (
        <div className={cn("space-y-2", className)}>
            <Label 
                htmlFor={fieldId}
                className={cn(
                    isRTL ? 'text-right' : 'text-left',
                    labelClassName
                )}
            >
                {label}
                {required && (
                    <span className={cn("text-red-500", isRTL ? 'mr-1' : 'ml-1')}>*</span>
                )}
            </Label>
            {type === 'textarea' ? (
                <Textarea
                    id={fieldId}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    dir={fieldDir}
                    required={required}
                    disabled={disabled}
                    readOnly={readOnly}
                    maxLength={maxLength}
                    minLength={minLength}
                    aria-required={required}
                    aria-invalid={!!errorMessage}
                    aria-describedby={describedBy}
                    className={cn(
                        isRTL ? 'text-right' : 'text-left',
                        errorMessage && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                        inputClassName
                    )}
                    {...(props as any)}
                />
            ) : (
                <Input
                    id={fieldId}
                    name={name}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    dir={fieldDir}
                    required={required}
                    disabled={disabled}
                    readOnly={readOnly}
                    maxLength={maxLength}
                    minLength={minLength}
                    autoComplete={autoComplete}
                    aria-required={required}
                    aria-invalid={!!errorMessage}
                    aria-describedby={describedBy}
                    className={cn(
                        isRTL ? 'text-right' : 'text-left',
                        errorMessage && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                        inputClassName
                    )}
                    {...props}
                />
            )}
            {errorMessage && (
                <InputError 
                    message={errorMessage} 
                    id={errorId}
                />
            )}
            {maxLength && value.length > 0 && (
                <p className={cn(
                    "text-xs text-muted-foreground",
                    isRTL ? 'text-right' : 'text-left',
                    value.length >= maxLength && 'text-red-500'
                )}>
                    {value.length} / {maxLength} {t('characters') || 'characters'}
                </p>
            )}
        </div>
    );
}

