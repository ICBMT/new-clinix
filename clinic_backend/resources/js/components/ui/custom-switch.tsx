import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface CustomSwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showIcons?: boolean;
    label?: string;
    labelPosition?: 'left' | 'right';
}

export function CustomSwitch({
    checked,
    onCheckedChange,
    disabled = false,
    size = 'md',
    className,
    showIcons = true,
    label,
    labelPosition = 'right'
}: CustomSwitchProps) {
    const { rtl } = usePage().props;
    
    const sizeClasses = {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11'
    };

    const thumbSizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    };

    const iconSizeClasses = {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3'
    };

    const switchClasses = cn(
        'relative inline-flex items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[size],
        checked 
            ? 'border-primary bg-primary' 
            : 'border-gray-300 bg-gray-200 hover:border-gray-400',
        disabled && 'cursor-not-allowed opacity-50',
        className
    );

    const thumbClasses = cn(
        'inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out',
        thumbSizeClasses[size],
        checked 
            ? rtl ? 'translate-x-0' : 'translate-x-4' 
            : rtl ? 'translate-x-4' : 'translate-x-0'
    );

    const iconClasses = cn(
        'absolute inset-0 flex items-center justify-center text-white transition-opacity duration-200',
        iconSizeClasses[size],
        checked ? 'opacity-100' : 'opacity-0'
    );

    const labelClasses = cn(
        'text-sm font-medium transition-colors duration-200',
        checked ? 'text-primary' : 'text-muted-foreground',
        disabled && 'text-gray-400'
    );

    const handleClick = () => {
        if (!disabled) {
            onCheckedChange(!checked);
        }
    };

    const switchElement = (
        <div className={switchClasses} onClick={handleClick}>
            <div className={thumbClasses}>
                {showIcons && (
                    <div className={iconClasses}>
                        {checked ? (
                            <Check className={iconSizeClasses[size]} />
                        ) : (
                            <X className={iconSizeClasses[size]} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    if (label) {
        const isLabelLeft = rtl ? labelPosition === 'right' : labelPosition === 'left';
        
        return (
            <div className="flex items-center gap-2">
                {isLabelLeft && <span className={labelClasses}>{label}</span>}
                {switchElement}
                {!isLabelLeft && <span className={labelClasses}>{label}</span>}
            </div>
        );
    }

    return switchElement;
}
