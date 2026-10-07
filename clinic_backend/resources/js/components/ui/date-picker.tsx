import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { useRTL } from '@/hooks/use-rtl';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
    id?: string;
    value?: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    maxDate?: Date;
    minDate?: Date;
    showYearDropdown?: boolean;
    showMonthDropdown?: boolean;
    dateFormat?: string;
}

export function DatePickerComponent({
    id,
    value = '',
    onChange,
    placeholder = 'Select date',
    className,
    disabled = false,
    maxDate,
    minDate,
    showYearDropdown = true,
    showMonthDropdown = true,
    dateFormat = 'dd/MM/yyyy',
}: DatePickerProps) {
    const { locale, rtl } = usePage().props as { locale?: string; rtl?: boolean };
    const { isRTL: hookIsRTL } = useRTL();
    const isRTL = hookIsRTL || rtl;
    
    const [selectedDate, setSelectedDate] = useState<Date | null>(
        value && value.trim() !== '' ? (() => {
            try {
                // Parse date string as local date to avoid timezone issues
                const [year, month, day] = value.split('-').map(Number);
                if (year && month && day) {
                    return new Date(year, month - 1, day);
                }
                return null;
            } catch (e) {
                return null;
            }
        })() : null
    );

    // Sync with external values
    useEffect(() => {
        if (value && value.trim() !== '') {
            try {
                // Parse date string as local date to avoid timezone issues
                const [year, month, day] = value.split('-').map(Number);
                if (year && month && day) {
                    setSelectedDate(new Date(year, month - 1, day));
                } else {
                    setSelectedDate(null);
                }
            } catch (e) {
                setSelectedDate(null);
            }
        } else {
            setSelectedDate(null);
        }
    }, [value]);

    const handleChange = (date: Date | null) => {
        setSelectedDate(date);
        if (date) {
            // Use local date to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
        } else {
            onChange('');
        }
    };

    return (
        <div className="relative">
            <DatePicker
                id={id}
                selected={selectedDate}
                onChange={handleChange}
                placeholderText={placeholder}
                disabled={disabled}
                maxDate={maxDate}
                minDate={minDate}
                showYearDropdown={showYearDropdown}
                showMonthDropdown={showMonthDropdown}
                dropdownMode="select"
                dateFormat={dateFormat}
                className={cn(
                    "w-full h-9 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer",
                    isRTL ? 'text-right pr-10' : 'text-left pl-10',
                    className
                )}
                showPopperArrow={false}
                popperClassName="react-datepicker-popper"
                popperPlacement={isRTL ? 'bottom-end' : 'bottom-start'}
                onClickOutside={(e) => {
                    // Ensure datepicker closes properly
                }}
            />
            <div className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                isRTL ? 'left-3' : 'right-3'
            )}>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
    );
}

