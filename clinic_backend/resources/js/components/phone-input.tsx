import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
    value: string;
    onChange: (value: string) => void;
    countryCode?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, value, onChange, countryCode = "+965", ...props }, ref) => {
        const { t } = useTranslation();
        // Check document direction for RTL
        const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
        
        // Remove country code from value for display
        const displayValue = value.startsWith(countryCode) 
            ? value.slice(countryCode.length) 
            : value.replace(/[^\d]/g, '');

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Only allow digits
            const digits = e.target.value.replace(/\D/g, '');
            // Limit to 8 digits (Kuwait phone format)
            const limitedDigits = digits.slice(0, 8);
            // Combine with country code
            const fullPhone = limitedDigits ? `${countryCode}${limitedDigits}` : '';
            onChange(fullPhone);
        };

        const handleBlur = () => {
            // Ensure country code is always present if there are digits
            if (value && !value.startsWith(countryCode)) {
                const digits = value.replace(/\D/g, '').slice(0, 8);
                if (digits) {
                    onChange(`${countryCode}${digits}`);
                }
            }
        };

        return (
            <div className="relative" dir={isRTL ? 'rtl' : 'ltr'}>
                <span className={cn(
                    "absolute top-1/2 -translate-y-1/2 font-mono text-sm font-semibold",
                    "text-primary dark:text-primary",
                    isRTL ? "right-3" : "left-3"
                )}>
                    {countryCode}
                </span>
                <Input
                    ref={ref}
                    type="tel"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('phone_digits_placeholder') || '12345678'}
                    className={cn(
                        "font-mono tracking-wide",
                        isRTL ? "pr-12" : "pl-12",
                        className
                    )}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    {...props}
                />
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };

