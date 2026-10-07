import { Check, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/use-rtl';
import { useTranslation } from '@/hooks/use-translation';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectFilterProps {
    id: string;
    label: string;
    values?: string[];
    onChange: (values: string[]) => void;
    options: MultiSelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function MultiSelectFilter({
    id,
    label,
    values = [],
    onChange,
    options,
    placeholder = 'Select options',
    className,
    disabled = false,
}: MultiSelectFilterProps) {
    const { isRTL } = useRTL();
    const { locale } = useTranslation();
    const [open, setOpen] = useState(false);

    const handleToggle = (value: string) => {
        const newValues = values.includes(value)
            ? values.filter((v) => v !== value)
            : [...values, value];
        onChange(newValues);
    };

    const handleRemove = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(values.filter((v) => v !== value));
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectedLabels = values
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter(Boolean);

    return (
        <div className={cn('flex flex-col gap-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
            <Label htmlFor={id} className={cn("text-sm font-medium text-foreground", isRTL && "text-right")}>
                {label}
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "w-full h-auto min-h-[40px] px-3 py-2",
                            isRTL ? "justify-between flex-row-reverse" : "justify-between"
                        )}
                    >
                        <div className={cn("flex flex-wrap gap-1 flex-1", isRTL && "justify-end")}>
                            {values.length === 0 ? (
                                <span className={cn("text-muted-foreground", isRTL && "text-right")}>{placeholder}</span>
                            ) : (
                                selectedLabels.map((label, index) => (
                                    <Badge
                                        key={values[index]}
                                        variant="secondary"
                                        className={cn(
                                            "mr-1 inline-flex items-center gap-1",
                                            isRTL && "ml-1 mr-0"
                                        )}
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                    >
                                        {isRTL ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0 ml-1"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                    }}
                                                    onClick={(e) => handleRemove(values[index], e)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                <span className="flex-1 text-right">{label}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex-1">{label}</span>
                                        <button
                                            type="button"
                                                    className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0 ml-1"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => handleRemove(values[index], e)}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                            </>
                                        )}
                                    </Badge>
                                ))
                            )}
                        </div>
                        <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                            {values.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="hover:bg-gray-100 rounded p-1"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className={cn("w-full p-0", isRTL && "text-right")} align={isRTL ? "end" : "start"} dir={isRTL ? "rtl" : "ltr"}>
                    <div className="max-h-64 overflow-auto p-2">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className={cn(
                                    "flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer",
                                    isRTL ? "space-x-reverse space-x-2 flex-row-reverse" : "space-x-2"
                                )}
                                onClick={() => handleToggle(option.value)}
                            >
                                <Checkbox
                                    checked={values.includes(option.value)}
                                    onCheckedChange={() => handleToggle(option.value)}
                                />
                                <label className={cn("flex-1 cursor-pointer", isRTL && "text-right")}>
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

