import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { useRTL } from '@/hooks/use-rtl';
import 'react-datepicker/dist/react-datepicker.css';

export interface DateRangeFilterProps {
    id: string;
    label: string;
    fromValue?: string;
    toValue?: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    fromPlaceholder?: string;
    toPlaceholder?: string;
    className?: string;
    disabled?: boolean;
}

export function DateRangeFilter({
    id,
    label,
    fromValue = '',
    toValue = '',
    onFromChange,
    onToChange,
    fromPlaceholder = 'From date',
    toPlaceholder = 'To date',
    className,
    disabled = false,
}: DateRangeFilterProps) {
    const { rtl } = usePage().props as { rtl?: boolean };
    const { isRTL } = useRTL();
    const [fromDate, setFromDate] = useState<Date | null>(fromValue ? new Date(fromValue) : null);
    const [toDate, setToDate] = useState<Date | null>(toValue ? new Date(toValue) : null);

    // Sync with external values
    useEffect(() => {
        if (fromValue) {
            // Parse date string as local date to avoid timezone issues
            const [year, month, day] = fromValue.split('-').map(Number);
            setFromDate(new Date(year, month - 1, day));
        } else {
            setFromDate(null);
        }
    }, [fromValue]);

    useEffect(() => {
        if (toValue) {
            // Parse date string as local date to avoid timezone issues
            const [year, month, day] = toValue.split('-').map(Number);
            setToDate(new Date(year, month - 1, day));
        } else {
            setToDate(null);
        }
    }, [toValue]);

    const handleFromChange = (date: Date | null) => {
        setFromDate(date);
        if (date) {
            // Use local date to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onFromChange(`${year}-${month}-${day}`);
        } else {
            onFromChange('');
        }
    };

    const handleToChange = (date: Date | null) => {
        setToDate(date);
        if (date) {
            // Use local date to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onToChange(`${year}-${month}-${day}`);
        } else {
            onToChange('');
        }
    };

    const rtlMode = isRTL || rtl;

    return (
        <div className={cn('flex flex-col gap-2 col-span-6', className)} dir={rtlMode ? 'rtl' : 'ltr'}>
            <Label className={cn("text-sm font-medium text-foreground", rtlMode && "text-right")}>{label}</Label>
            <div className="grid grid-cols-6 gap-2">
                <div className="relative col-span-3">
                    <DatePicker
                        selected={fromDate}
                        onChange={handleFromChange}
                        selectsStart
                        startDate={fromDate}
                        endDate={toDate}
                        placeholderText={fromPlaceholder}
                        disabled={disabled}
                        dateFormat="dd/MM/yyyy"
                        className={cn(
                            "w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            rtlMode ? 'text-right' : 'text-left'
                        )}
                        showPopperArrow={false}
                        popperClassName="react-datepicker-popper"
                        popperPlacement={rtlMode ? 'bottom-end' : 'bottom-start'}
                    />
                </div>
                <div className="relative col-span-3">
                    <DatePicker
                        selected={toDate}
                        onChange={handleToChange}
                        selectsEnd
                        startDate={fromDate}
                        endDate={toDate}
                        minDate={fromDate || undefined}
                        placeholderText={toPlaceholder}
                        disabled={disabled}
                        dateFormat="dd/MM/yyyy"
                        className={cn(
                            "w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            rtlMode ? 'text-right' : 'text-left'
                        )}
                        showPopperArrow={false}
                        popperClassName="react-datepicker-popper"
                        popperPlacement={rtlMode ? 'bottom-end' : 'bottom-start'}
                    />
                </div>
            </div>
        </div>
    );
}