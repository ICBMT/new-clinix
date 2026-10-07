import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        google: any;
        initGooglePlaces: () => void;
    }
}

interface AddressComponents {
    address?: string;
    block?: string;
    street?: string;
    avenue?: string;
    house?: string;
    floor?: string;
    apt?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    latitude?: string;
    longitude?: string;
}

interface AddressAutocompleteProps {
    id: string;
    label: string;
    value: string;
    onChange: (field: string, value: string) => void;
    onAddressChange?: (components: AddressComponents) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    inputClassName?: string;
    labelClassName?: string;
    rows?: number;
    maxLength?: number;
    countryRestriction?: string | string[];
    governorateName?: string; // Governorate name for filtering
    areaName?: string; // Area name for filtering
    requireGovernorateAndArea?: boolean; // If true, disable until both are selected
}

export function AddressAutocomplete({
    id,
    label,
    value,
    onChange,
    onAddressChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    className,
    inputClassName,
    labelClassName,
    rows = 2,
    maxLength = 500,
    countryRestriction = 'KW', // Default to Kuwait
    governorateName,
    areaName,
    requireGovernorateAndArea = false,
}: AddressAutocompleteProps) {
    const { t } = useTranslation();
    const { isRTL } = useRTL();
    const { props } = usePage<{ siteSettings?: Record<string, string>; locale?: string }>();
    // Get API key from siteSettings - handle both direct access and nested structure
    const apiKey = (props.siteSettings?.google_maps_api_key || '').trim();
    
    // Debug: Log API key status (remove in production)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Google Maps API Key Debug:', {
                hasSiteSettings: !!props.siteSettings,
                apiKey: apiKey || 'EMPTY',
                apiKeyLength: apiKey.length,
                allSiteSettingsKeys: props.siteSettings ? Object.keys(props.siteSettings) : []
            });
        }
    }, [apiKey, props.siteSettings]);
    
    const autocompleteRef = useRef<HTMLTextAreaElement>(null);
    const autocompleteInstanceRef = useRef<any>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Check if governorate and area are required and selected
    const isDisabledBySelection = requireGovernorateAndArea && (!governorateName || !areaName);
    const isActuallyDisabled = disabled || isDisabledBySelection || !isScriptLoaded;

    // Load Google Maps script
    useEffect(() => {
        if (!apiKey || isScriptLoaded) return;

        // Check if script is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
            setIsScriptLoaded(true);
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            // Wait for script to load
            existingScript.addEventListener('load', () => {
                setIsScriptLoaded(true);
            });
            return;
        }

        // Load the script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${props.locale || 'en'}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setIsScriptLoaded(true);
        };
        script.onerror = () => {
            console.error('Failed to load Google Maps script');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup: remove script if component unmounts
            // Note: We don't remove it as other components might use it
        };
    }, [apiKey, isScriptLoaded, props.locale]);

    // Initialize autocomplete
    useEffect(() => {
        if (!isScriptLoaded || !autocompleteRef.current || !window.google) return;
        
        // If disabled by selection requirement, don't initialize
        if (isDisabledBySelection) {
            // Clean up existing instance if governorate/area was deselected
            if (autocompleteInstanceRef.current) {
                window.google?.maps?.event?.clearInstanceListeners?.(autocompleteInstanceRef.current);
                autocompleteInstanceRef.current = null;
                setIsInitialized(false);
            }
            return;
        }

        // Clean up existing instance before creating new one (when governorate/area changes)
        if (autocompleteInstanceRef.current) {
            window.google?.maps?.event?.clearInstanceListeners?.(autocompleteInstanceRef.current);
            autocompleteInstanceRef.current = null;
        }

        try {
            const autocomplete = new window.google.maps.places.Autocomplete(
                autocompleteRef.current,
                {
                    componentRestrictions: countryRestriction ? { country: countryRestriction } : undefined,
                    fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
                    types: ['address'],
                }
            );
            
            // Note: Google Places Autocomplete will automatically filter results based on country restriction
            // The governorate and area names are passed for potential future use in biasing results

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                
                if (!place.geometry || !place.geometry.location) {
                    return;
                }

                // Extract address components
                const components: AddressComponents = {
                    address: place.formatted_address || value,
                    latitude: place.geometry.location.lat().toString(),
                    longitude: place.geometry.location.lng().toString(),
                };

                // Parse address components
                place.address_components?.forEach((component: any) => {
                    const types = component.types;

                    // Street number
                    if (types.includes('street_number')) {
                        components.house = component.long_name;
                    }

                    // Route (street name)
                    if (types.includes('route')) {
                        components.street = component.long_name;
                    }

                    // Locality (city)
                    if (types.includes('locality')) {
                        components.city = component.long_name;
                    }

                    // Administrative area level 1 (state/governorate)
                    if (types.includes('administrative_area_level_1')) {
                        components.state = component.long_name;
                    }

                    // Country
                    if (types.includes('country')) {
                        components.country = component.long_name;
                    }

                    // Postal code
                    if (types.includes('postal_code')) {
                        components.postal_code = component.long_name;
                    }

                    // Subpremise (apartment/floor)
                    if (types.includes('subpremise')) {
                        components.apt = component.long_name;
                    }
                });

                // Update the main address field
                onChange(id, components.address || '');

                // Call the callback to update other fields
                if (onAddressChange) {
                    onAddressChange(components);
                }
            });

            autocompleteInstanceRef.current = autocomplete;
            setIsInitialized(true);
        } catch (error) {
            console.error('Error initializing Google Places Autocomplete:', error);
        }
    }, [isScriptLoaded, isDisabledBySelection, governorateName, areaName, countryRestriction]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autocompleteInstanceRef.current) {
                window.google?.maps?.event?.clearInstanceListeners?.(autocompleteInstanceRef.current);
            }
        };
    }, []);

    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={id} className={cn(isRTL ? 'text-right' : 'text-left', labelClassName)}>
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
                ref={autocompleteRef}
                id={id}
                value={value}
                onChange={(e) => {
                    const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
                    onChange(id, newValue);
                }}
                placeholder={
                    isDisabledBySelection 
                        ? (t('select_governorate_and_area_first') || 'Please select governorate and area first')
                        : (placeholder || t('enter_full_address'))
                }
                disabled={isActuallyDisabled}
                rows={rows}
                maxLength={maxLength}
                className={cn(
                    'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 dark:text-slate-100',
                    error ? 'border-red-500' : '',
                    isDisabledBySelection ? 'opacity-60 cursor-not-allowed' : '',
                    inputClassName
                )}
                dir={isRTL ? 'ltr' : 'ltr'} // Keep input LTR for address autocomplete
            />
            {isDisabledBySelection && (
                <p className="text-xs text-muted-foreground">
                    {t('select_governorate_and_area_first') || 'Please select governorate and area first to enable address autocomplete'}
                </p>
            )}
            {!isScriptLoaded && apiKey && !isDisabledBySelection && (
                <p className="text-xs text-muted-foreground">
                    {t('loading_google_maps') || 'Loading Google Maps...'}
                </p>
            )}
            {!apiKey && !isDisabledBySelection && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {t('google_maps_api_key_missing') || 'Google Maps API key is not configured'}
                </p>
            )}
            <InputError message={error} className={isRTL ? 'text-right' : 'text-left'} />
        </div>
    );
}

