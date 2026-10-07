import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { useRTL } from '@/hooks/use-rtl';

export interface SearchableSelectOption {
    value: string;
    label: string;
    description?: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    maxHeight?: string;
    emptyMessage?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select item...",
    searchPlaceholder,
    className,
    disabled = false,
    maxHeight = "300px",
    emptyMessage,
}: SearchableSelectProps) {
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();
    const isRtl = isRTL;
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    
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

    // Get selected option for display
    const selectedOption = React.useMemo(() => {
        return options.find((opt) => opt.value === value);
    }, [value, options]);

    const handleSelect = React.useCallback((selectedValue: string) => {
        if (selectedValue !== value) {
            onChange(selectedValue);
        }
        setOpen(false);
        setSearchQuery("");
    }, [value, onChange]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        if (!open) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setFocusedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case "Enter":
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[focusedIndex].value);
                }
                break;
            case "Escape":
                e.preventDefault();
                setOpen(false);
                setSearchQuery("");
                break;
        }
    }, [open, filteredOptions, focusedIndex, handleSelect]);

    // Focus search input when opened
    React.useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [open]);

    // Reset focused index when search query changes
    React.useEffect(() => {
        setFocusedIndex(-1);
    }, [searchQuery]);

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setSearchQuery("");
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [open]);

    return (
        <div ref={containerRef} className={cn("relative w-full", className)} dir={isRtl ? 'rtl' : 'ltr'}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                    "w-full justify-between min-h-10 h-auto dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600",
                    !value && "text-muted-foreground",
                    isRtl && "flex-row-reverse",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
            >
                <span className={cn("truncate", isRtl && "text-right")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronsUpDown className={cn(
                    "h-4 w-4 shrink-0 opacity-50",
                    isRtl && "ml-2 mr-0"
                )} />
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
                                isRtl ? "right-3" : "left-3"
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
                                    "pl-9 pr-9",
                                    isRtl && "pr-9 pl-9 text-right"
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
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage || t('no_results_found')}
                            </div>
                        ) : (
                            <div className="p-1">
                                {filteredOptions.map((option, index) => {
                                    const isSelected = option.value === value;
                                    const isFocused = index === focusedIndex;

                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => handleSelect(option.value)}
                                            onMouseEnter={() => setFocusedIndex(index)}
                                            className={cn(
                                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                                isFocused && "bg-accent text-accent-foreground",
                                                isSelected && "bg-accent/50",
                                                isRtl && "text-right"
                                            )}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0",
                                                    isRtl && "mr-0 ml-2"
                                                )}
                                            />
                                            <div className={cn("flex-1", isRtl && "text-right")}>
                                                <div className="font-medium">{option.label}</div>
                                                {option.description && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {option.description}
                                                    </div>
                                                )}
                                            </div>
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

