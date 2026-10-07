import * as React from "react";
import { ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export interface MultiSelectOption {
    value: string;
    label: string;
    description?: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    maxHeight?: string;
}

export function MultiSelect({
    options,
    value,
    onChange,
    placeholder = "Select items...",
    className,
    disabled = false,
    maxHeight = "200px",
}: MultiSelectProps) {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    
    // Direction handling
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    
    const [open, setOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const [popoverWidth, setPopoverWidth] = React.useState<string>('auto');
    const shouldCloseRef = React.useRef(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleUnselect = (item: string) => {
        onChange(value.filter((i) => i !== item));
    };

    const handleSelect = (currentValue: string) => {
        if (value.includes(currentValue)) {
            onChange(value.filter((item) => item !== currentValue));
        } else {
            onChange([...value, currentValue]);
        }
    };

    // Handle popover open change - prevent closing when selecting items
    const handleOpenChange = React.useCallback((newOpen: boolean) => {
        if (newOpen) {
            // Always allow opening
            setOpen(true);
        } else {
            // Only close if explicitly requested (click outside or escape)
            if (shouldCloseRef.current) {
                setOpen(false);
                shouldCloseRef.current = false;
            }
        }
    }, []);

    // Update popover width when opening to match trigger width
    React.useEffect(() => {
        if (open && triggerRef.current) {
            const width = triggerRef.current.offsetWidth;
            setPopoverWidth(`${width}px`);
        }
    }, [open]);

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return options;
        }
        const query = searchQuery.toLowerCase();
        return options.filter(
            (option) =>
                option.label.toLowerCase().includes(query) ||
                option.description?.toLowerCase().includes(query) ||
                option.value.toLowerCase().includes(query)
        );
    }, [options, searchQuery]);

    return (
        <div className={cn("w-full", className)} dir={dir}>
            <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
                <PopoverTrigger asChild>
                    <Button
                        ref={triggerRef}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full min-h-10 h-auto dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600",
                            !value.length && "text-muted-foreground",
                            isRTL ? "flex-row-reverse" : "flex-row",
                            "justify-between"
                        )}
                        disabled={disabled}
                        dir={dir}
                    >
                        {/* Selected Chips Container - RTL: right→left, LTR: left→right */}
                        <div className={cn(
                            "flex flex-wrap flex-1 min-w-0 gap-1",
                            isRTL ? "flex-row-reverse justify-end" : "flex-row justify-start"
                        )}>
                            {value.length > 0 ? (
                                value.map((item) => {
                                    const option = options.find((opt) => opt.value === item);
                                    return (
                                        <Badge
                                            variant="secondary"
                                            key={item}
                                            className={cn(
                                                "mb-1 inline-flex items-center gap-1",
                                                isRTL ? "flex-row-reverse ml-1 mr-0" : "flex-row mr-1 ml-0"
                                            )}
                                            dir={dir}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnselect(item);
                                            }}
                                        >
                                            <span className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
                                            {option?.label}
                                            </span>
                                            <button
                                                className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleUnselect(item);
                                                    }
                                                }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleUnselect(item);
                                                }}
                                            >
                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        </Badge>
                                    );
                                })
                            ) : (
                                <span className={cn(
                                    "text-muted-foreground w-full block",
                                    isRTL ? "text-right" : "text-left"
                                )}>{placeholder}</span>
                            )}
                        </div>
                        {/* Dropdown Arrow - RTL: left, LTR: right */}
                        <ChevronsUpDown className={cn(
                            "h-4 w-4 shrink-0 opacity-50",
                            isRTL ? "mr-2" : "ml-2"
                        )} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent 
                    className={cn(
                        "p-0 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100",
                        isRTL ? "text-right" : "text-left"
                    )} 
                    align={isRTL ? "end" : "start"}
                    dir={dir}
                    style={{ width: popoverWidth, minWidth: '200px' }}
                    onInteractOutside={() => {
                        // Allow closing when clicking outside
                        shouldCloseRef.current = true;
                    }}
                    onEscapeKeyDown={() => {
                        // Allow closing on escape
                        shouldCloseRef.current = true;
                    }}
                >
                    <div className="flex flex-col" dir={dir}>
                        {/* Search Input - RTL: icon right, text right | LTR: icon left, text left */}
                        <div className={cn(
                            "flex items-center border-b px-3 dark:border-slate-600 relative",
                            isRTL && "flex-row-reverse"
                        )}>
                            <Search className={cn(
                                "h-4 w-4 shrink-0 opacity-50 absolute top-1/2 -translate-y-1/2",
                                isRTL ? "right-5" : "left-5"
                            )} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search')}
                                dir={dir}
                                className={cn(
                                    "flex h-11 w-full rounded-md bg-transparent dark:bg-slate-800 dark:text-slate-100 py-3 text-sm outline-none placeholder:text-muted-foreground",
                                    isRTL ? "text-right pr-10 pl-3" : "text-left pl-10 pr-3"
                                )}
                            />
                        </div>
                        
                        {/* Options List */}
                        <div className="overflow-auto" style={{ maxHeight }}>
                            {filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    {t('no_item_found')}
                                </div>
                            ) : (
                                <div className="p-1">
                                    {filteredOptions.map((option) => {
                                    const isSelected = value.includes(option.value);
                                    return (
                                        <div
                                        key={option.value}
                                            onClick={(e) => {
                                                if (!disabled) {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    shouldCloseRef.current = false;
                                            handleSelect(option.value);
                                                }
                                        }}
                                            onMouseDown={(e) => {
                                                if (!disabled) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    shouldCloseRef.current = false;
                                                }
                                            }}
                                            className={cn(
                                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none gap-2",
                                                "hover:bg-accent dark:hover:bg-slate-700 focus:bg-accent dark:focus:bg-slate-700",
                                                isRTL && "flex-row-reverse",
                                                disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                                                isSelected && "bg-accent/50 dark:bg-slate-700/50"
                                            )}
                                            dir={dir}
                                    >
                                        {isRTL ? (
                                            <>
                                                {/* RTL: Checkbox on right, text on left */}
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => {
                                                        if (disabled) return;
                                                        shouldCloseRef.current = false;
                                                        if (checked) {
                                                            handleSelect(option.value);
                                                        } else {
                                                            handleUnselect(option.value);
                                                        }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        shouldCloseRef.current = false;
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        shouldCloseRef.current = false;
                                                    }}
                                                    disabled={disabled}
                                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shrink-0"
                                                />
                                                <div className={cn("flex flex-col flex-1", isRTL ? "text-right" : "text-left")}>
                                                    <span className="text-sm font-medium">{option.label}</span>
                                                    {option.description && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {option.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* LTR: Checkbox on left, text on right */}
                                        <Checkbox
                                                checked={isSelected}
                                            onCheckedChange={(checked) => {
                                                    if (disabled) return;
                                                    shouldCloseRef.current = false;
                                                if (checked) {
                                                    handleSelect(option.value);
                                                } else {
                                                    handleUnselect(option.value);
                                                }
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                    e.preventDefault();
                                                    shouldCloseRef.current = false;
                                                }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    shouldCloseRef.current = false;
                                            }}
                                                disabled={disabled}
                                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shrink-0"
                                        />
                                                <div className={cn("flex flex-col flex-1", isRTL ? "text-right" : "text-left")}>
                                            <span className="text-sm font-medium">{option.label}</span>
                                            {option.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                            </>
                                        )}
                                        </div>
                                    );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
