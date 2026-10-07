import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/use-rtl';

interface DatePickerFilterProps {
    id: string;
    label: string;
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function DatePickerFilter({
    id,
    label,
    value = '',
    onChange,
    placeholder = 'Select date',
    className,
    disabled = false,
}: DatePickerFilterProps) {
    const { isRTL, inputDir } = useRTL();
    const [internalValue, setInternalValue] = useState(value);

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
                <Input
                    id={id}
                    type="date"
                    value={internalValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    dir={inputDir}
                    className={cn(isRTL ? 'pl-20 text-right' : 'pr-20')}
                />
                <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 flex items-center gap-1",
                    isRTL ? 'left-2' : 'right-2'
                )}>
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {internalValue && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="h-6 w-6 p-0"
                        >
                            ×
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

