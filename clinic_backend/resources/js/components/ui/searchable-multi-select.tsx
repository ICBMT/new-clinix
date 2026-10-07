import * as React from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { useRTL } from '@/hooks/use-rtl';

export interface SearchableMultiSelectOption {
    value: string;
    label: string;
    description?: string;
}

interface SearchableMultiSelectProps {
    options: SearchableMultiSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    maxHeight?: string;
    emptyMessage?: string;
}

export function SearchableMultiSelect({
    options,
    value,
    onChange,
    placeholder = "Select items...",
    searchPlaceholder,
    className,
    disabled = false,
    maxHeight = "300px",
    emptyMessage,
}: SearchableMultiSelectProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();
    const isRtl = isRTL;
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const onChangeRef = React.useRef(onChange);
    const isProcessingRef = React.useRef(false);
    
    // Keep onChange ref up to date
    React.useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

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

    // Get selected options for display
    const selectedOptions = React.useMemo(() => {
        return value
            .map((val) => options.find((opt) => opt.value === val))
            .filter(Boolean) as SearchableMultiSelectOption[];
    }, [value, options]);

    const handleUnselect = React.useCallback((item: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        
        // Prevent duplicate calls
        if (isProcessingRef.current) {
            return;
        }
        
        const newValue = value.filter((i) => i !== item);
        // Only call onChange if value actually changed (check if item was actually in the array)
        if (value.includes(item)) {
            isProcessingRef.current = true;
            onChangeRef.current(newValue);
            // Reset flag after a short delay
            setTimeout(() => {
                isProcessingRef.current = false;
            }, 100);
        }
    }, [value]);

    const handleSelect = React.useCallback((currentValue: string) => {
        // Prevent duplicate calls
        if (isProcessingRef.current) {
            return;
        }
        
        const isSelected = value.includes(currentValue);
        let newValue: string[];
        
        if (isSelected) {
            newValue = value.filter((item) => item !== currentValue);
        } else {
            newValue = [...value, currentValue];
        }
        
        // Call onChange - the parent component will handle preventing unnecessary updates
        isProcessingRef.current = true;
            onChangeRef.current(newValue);
        
        // Reset flag after a short delay
        setTimeout(() => {
            isProcessingRef.current = false;
        }, 100);
        
        // Keep focus on search input after selection
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, [value]);

    const handleToggle = React.useCallback((currentValue: string) => {
        handleSelect(currentValue);
    }, [handleSelect]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setFocusedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                    handleToggle(filteredOptions[focusedIndex].value);
                }
                break;
            case "Escape":
                setOpen(false);
                setSearchQuery("");
                setFocusedIndex(-1);
                break;
        }
    };

    // Scroll focused item into view
    React.useEffect(() => {
        if (focusedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-item-index]');
            const focusedItem = items[focusedIndex] as HTMLElement;
            if (focusedItem) {
                focusedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
        }
    }, [focusedIndex]);

    // Focus search input when dropdown opens
    React.useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            setSearchQuery("");
            setFocusedIndex(-1);
        }
    }, [open]);

    // Click outside to close
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <div className={cn("w-full relative", className)} ref={containerRef} dir={isRtl ? 'rtl' : 'ltr'}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                onClick={() => !disabled && setOpen(!open)}
                className={cn(
                    "w-full justify-between min-h-10 h-auto py-2 px-3",
                    !value.length && "text-muted-foreground",
                    disabled && "cursor-not-allowed opacity-50",
                    isRtl && "flex-row-reverse"
                )}
                disabled={disabled}
            >
                <div className={cn("flex flex-wrap gap-1 flex-1 min-w-0", isRtl && "justify-end")}>
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map((option) => (
                            <Badge
                                variant="secondary"
                                key={option.value}
                                className={cn(
                                    "mr-1 mb-1 text-xs inline-flex items-center gap-1",
                                    isRtl && "ml-1 mr-0"
                                )}
                                dir={isRtl ? 'rtl' : 'ltr'}
                            >
                                {isRtl ? (
                                    <>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            aria-label={t('remove')}
                                            className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer inline-flex items-center justify-center flex-shrink-0 ml-1"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleUnselect(option.value);
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleUnselect(option.value, e);
                                            }}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </span>
                                        <span className="max-w-[150px] truncate flex-1 text-right">{option.label}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="max-w-[150px] truncate flex-1">{option.label}</span>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label={t('remove')}
                                            className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer inline-flex items-center justify-center flex-shrink-0 ml-1"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleUnselect(option.value);
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleUnselect(option.value, e);
                                    }}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </span>
                                    </>
                                )}
                            </Badge>
                        ))
                    ) : (
                        <span className={cn("text-muted-foreground", isRtl && "text-right")}>{placeholder}</span>
                    )}
                </div>
                <ChevronsUpDown className={cn("h-4 w-4 shrink-0 opacity-50", isRtl && "mr-auto ml-2")} />
            </Button>

            {open && (
                <div
                    className={cn(
                        "absolute z-50 w-full mt-1 bg-popover dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 border border-border rounded-md shadow-md",
                        isRtl && "text-right"
                    )}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    style={{ maxHeight }}
                >
                    {/* Search Input */}
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className={cn(
                                "absolute h-4 w-4 text-muted-foreground top-1/2 -translate-y-1/2",
                                isRtl ? "right-5" : "left-5"
                            )} />
                            <Input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setFocusedIndex(-1);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={searchPlaceholder || t('search')}
                                dir={isRtl ? 'rtl' : 'ltr'}
                                className={cn(
                                    isRtl ? "pr-10 pl-3 text-right" : "pl-10 pr-3"
                                )}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div
                        ref={listRef}
                        className="overflow-auto"
                        style={{ maxHeight: `calc(${maxHeight} - 60px)` }}
                    >
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {emptyMessage || t('no_item_found')}
                            </div>
                        ) : (
                            <div className="p-1">
                                {filteredOptions.map((option, index) => {
                                    const isSelected = value.includes(option.value);
                                    const isFocused = index === focusedIndex;

                                    return (
                                        <div
                                            key={option.value}
                                            data-item-index={index}
                                            onClick={(e) => {
                                                // Only handle click if it's not on the checkbox
                                                if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                                                    return;
                                                }
                                                handleToggle(option.value);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                                                isFocused && "bg-accent",
                                                isSelected && "bg-accent/50",
                                                "hover:bg-accent",
                                                isRtl && "flex-row-reverse"
                                            )}
                                            dir={isRtl ? 'rtl' : 'ltr'}
                                            onMouseEnter={() => setFocusedIndex(index)}
                                        >
                                            {isRtl ? (
                                                <>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => {
                                                            if (checked !== isSelected) {
                                                                if (checked) {
                                                                    handleSelect(option.value);
                                                                } else {
                                                                    handleUnselect(option.value);
                                                                }
                                                            }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                        }}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                                                    />
                                                    <div className="flex flex-col flex-1 min-w-0 text-right">
                                                        <span className="text-sm font-medium truncate">
                                                            {option.label}
                                                        </span>
                                                        {option.description && (
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {option.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                    if (checked !== isSelected) {
                                                    if (checked) {
                                                        handleSelect(option.value);
                                                    } else {
                                                        handleUnselect(option.value);
                                                        }
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                                            />
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                <span className="text-sm font-medium truncate">
                                                    {option.label}
                                                </span>
                                                {option.description && (
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {option.description}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary shrink-0" />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

