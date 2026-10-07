import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';

interface SearchFieldFilterProps {
    id: string;
    label: string;
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchFieldFilter({
    id,
    label,
    value = '',
    onChange,
    placeholder = 'Search...',
    className,
    disabled = false,
}: SearchFieldFilterProps) {
    const { locale } = useTranslation();
    const { isRTL } = useRTL();
    const [internalValue, setInternalValue] = useState(value);

    // Sync internal state with external value changes (e.g., from Clear All Filters)
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange(newValue);
    };

    const handleClear = () => {
        setInternalValue('');
        onChange('');
    };

    return (
        <div className={cn('flex flex-col gap-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
            <Label htmlFor={id} className={cn("text-sm font-medium text-foreground", isRTL && "text-right")}>
                {label}
            </Label>
            <div className="relative">
                <Search className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                    isRTL ? "right-3" : "left-3"
                )} />
                <Input
                    id={id}
                    type="text"
                    value={internalValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "text-sm bg-background dark:bg-background text-foreground",
                        isRTL ? "pr-10 pl-10 text-right" : "pl-10 pr-10"
                    )}
                />
                {internalValue && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted",
                            isRTL ? "left-2" : "right-2"
                        )}
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </div>
        </div>
    );
}

