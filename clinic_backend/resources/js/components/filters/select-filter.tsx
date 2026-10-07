import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectFilterProps {
    id: string;
    label: string;
    value?: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    clearable?: boolean;
}

export function SelectFilter({
    id,
    label,
    value = '',
    onChange,
    options,
    placeholder = 'Select option',
    className,
    disabled = false,
    clearable = true,
}: SelectFilterProps) {
    const { locale } = useTranslation();
    const { isRTL } = useRTL();
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    // Filter out empty string options and handle undefined value
    const validOptions = options.filter(option => option.value !== '');
    const selectValue = value || undefined;

    return (
        <div className={cn('flex flex-col gap-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
            <Label htmlFor={id} className={cn("text-sm font-medium text-foreground", isRTL && "text-right")}>
                {label}
            </Label>
            <div className="relative">
                <Select value={selectValue} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger id={id} className={cn("w-full text-sm", isRTL && "text-right [&>span]:text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
                        <SelectValue placeholder={placeholder} className={cn(isRTL && "text-right", isRTL ? "placeholder:text-right" : "placeholder:text-left")} />
                    </SelectTrigger>
                    <SelectContent className={cn(isRTL ? "rtl text-right" : "")} dir={isRTL ? 'rtl' : 'ltr'}>
                        {validOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className={cn(isRTL && "text-right")}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {clearable && value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-6 w-6 p-0 z-10",
                            isRTL ? "left-8" : "right-8"
                        )}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

