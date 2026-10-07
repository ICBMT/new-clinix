import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    showValidation?: boolean;
}

interface ValidationRule {
    test: (value: string) => boolean;
    message: string;
}

export function PasswordInput({ className, error, showValidation = false, value, ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { locale, t } = useTranslation();
    const { isRTL } = useRTL();
    const passwordValue = (value as string) || '';

    const validationRules: ValidationRule[] = useMemo(() => [
        {
            test: (val) => val.length >= 8,
            message: t('password_min_length'),
        },
        {
            test: (val) => /[A-Z]/.test(val),
            message: t('password_must_contain_uppercase'),
        },
        {
            test: (val) => /[a-z]/.test(val),
            message: t('password_must_contain_lowercase'),
        },
        {
            test: (val) => /[0-9]/.test(val),
            message: t('password_must_contain_numbers'),
        },
        {
            test: (val) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val),
            message: t('password_must_contain_special'),
        },
    ], [t]);

    const validationResults = useMemo(() => {
        if (!showValidation || !passwordValue) {
            return validationRules.map(rule => ({ ...rule, isValid: false }));
        }
        return validationRules.map(rule => ({
            ...rule,
            isValid: rule.test(passwordValue),
        }));
    }, [passwordValue, showValidation, validationRules]);

    return (
        <div className="space-y-2">
        <div className="relative">
            <Input
                type={showPassword ? 'text' : 'password'}
                dir={isRTL ? 'rtl' : 'ltr'}
                className={cn(
                    isRTL ? 'pl-10' : 'pr-10', 
                    error && 'border-red-500',
                    'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
                    className
                )}
                value={value}
                {...props}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                    className={cn('absolute top-0 h-full px-3 py-2 hover:bg-transparent', isRTL ? 'left-0' : 'right-0')}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
            >
                {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">{showPassword ? t('hide_password') : t('show_password')}</span>
            </Button>
            </div>
            {showValidation && passwordValue && (
                <div className="space-y-1.5 text-xs">
                    {validationResults.map((result, index) => (
                        <div
                            key={index}
                            className={cn(
                                'flex items-center gap-2',
                                isRTL ? 'flex-row-reverse' : 'flex-row'
                            )}
                        >
                            {result.isValid ? (
                                <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            ) : (
                                <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span
                                className={cn(
                                    result.isValid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                                )}
                            >
                                {result.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

