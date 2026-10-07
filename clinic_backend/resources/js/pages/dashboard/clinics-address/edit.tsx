import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { type SharedData } from '@/types';

interface Clinic {
    id: number;
    name_en: string;
    name_ar: string;
    address?: string;
    governorate_id?: number;
    area_id?: number;
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
    governorate?: {
        id: number;
        name_en: string;
        name_ar: string;
    };
    area?: {
        id: number;
        name_en: string;
        name_ar: string;
    };
}

interface Governorate {
    id: number;
    name_en: string;
    name_ar: string;
}

interface Area {
    id: number;
    name_en: string;
    name_ar: string;
    governorate_id: number;
}

interface EditClinicAddressProps {
    clinic: Clinic;
    governorates?: Governorate[];
    areas?: Area[];
}

export default function EditClinicAddress({ clinic, governorates = [], areas = [] }: EditClinicAddressProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('clinics_address_management'),
            href: '/dashboard/clinics-address',
        },
        {
            title: t('edit_address'),
            href: '#',
        },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        address: clinic?.address || '',
        governorate_id: clinic?.governorate_id?.toString() || (clinic?.governorate?.id?.toString() || ''),
        area_id: clinic?.area_id?.toString() || (clinic?.area?.id?.toString() || ''),
        block: clinic?.block || '',
        street: clinic?.street || '',
        avenue: clinic?.avenue || '',
        house: clinic?.house || '',
        floor: clinic?.floor || '',
        apt: clinic?.apt || '',
        city: clinic?.city || '',
        state: clinic?.state || '',
        country: clinic?.country || 'Kuwait',
        postal_code: clinic?.postal_code || '',
        latitude: clinic?.latitude || '',
        longitude: clinic?.longitude || '',
    });

    const filteredAreas = data.governorate_id 
        ? areas.filter(area => area.governorate_id.toString() === data.governorate_id)
        : [];
    
    // Initialize area_id if governorate_id is set but area_id doesn't match
    useEffect(() => {
        if (data.governorate_id && data.area_id) {
            const areaExists = filteredAreas.some(area => area.id.toString() === data.area_id);
            if (!areaExists) {
                setData('area_id', '');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.governorate_id]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!clinic?.id) return;
        patch(`/dashboard/clinics-address/${clinic.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit_address')} - ${clinic?.name_en || clinic?.name_ar || t('clinic')}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_address')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('update_clinic_address')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        {clinic?.id && (
                            <Link href={`/dashboard/clinics-address/${clinic.id}`}>
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('view')}
                                </Button>
                            </Link>
                        )}
                        <Link href={clinic?.id ? `/dashboard/clinics-address/${clinic.id}` : '/dashboard/clinics-address'}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Basic Address */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('basic_address')}</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="governorate_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('governorate')}</> : <>{t('governorate')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Select
                                    value={data.governorate_id}
                                    onValueChange={(value) => {
                                        setData('governorate_id', value);
                                        setData('area_id', ''); // Reset area when governorate changes
                                    }}
                                >
                                    <SelectTrigger className={cn(errors.governorate_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                        <SelectValue placeholder={t('select_governorate')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {governorates.map((gov) => (
                                            <SelectItem key={gov.id} value={gov.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                {isRTL ? gov.name_ar : gov.name_en}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.governorate_id && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.governorate_id) || errors.governorate_id}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="area_id" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('area')}</> : <>{t('area')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Select
                                    value={data.area_id}
                                    onValueChange={(value) => setData('area_id', value)}
                                    disabled={!data.governorate_id}
                                >
                                    <SelectTrigger className={cn(errors.area_id ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}>
                                        <SelectValue placeholder={t('select_area')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredAreas.map((area) => (
                                            <SelectItem key={area.id} value={area.id.toString()} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                {isRTL ? area.name_ar : area.name_en}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.area_id && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.area_id) || errors.area_id}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="city" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('city')}</> : <>{t('city')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="city"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.city ? 'border-red-500' : '', getInputTextAlign('text'))}
                                    required
                                />
                                {errors.city && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.city) || errors.city}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="country" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL ? <><span className="text-red-500">*</span> {t('country')}</> : <>{t('country')} <span className="text-red-500">*</span></>}
                                </Label>
                                <Input
                                    id="country"
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.country ? 'border-red-500' : '', getInputTextAlign('text'))}
                                    required
                                />
                                {errors.country && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.country) || errors.country}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Address */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('detailed_address')}</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="block" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('block')}</Label>
                                <Input
                                    id="block"
                                    value={data.block}
                                    onChange={(e) => setData('block', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.block ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.block && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.block) || errors.block}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="street" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('street')}</Label>
                                <Input
                                    id="street"
                                    value={data.street}
                                    onChange={(e) => setData('street', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.street ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.street && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.street) || errors.street}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="avenue" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('avenue')}</Label>
                                <Input
                                    id="avenue"
                                    value={data.avenue}
                                    onChange={(e) => setData('avenue', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.avenue ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.avenue && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.avenue) || errors.avenue}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="house" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('house')}</Label>
                                <Input
                                    id="house"
                                    value={data.house}
                                    onChange={(e) => setData('house', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.house ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.house && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.house) || errors.house}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="floor" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('floor')}</Label>
                                <Input
                                    id="floor"
                                    value={data.floor}
                                    onChange={(e) => setData('floor', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.floor ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.floor && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.floor) || errors.floor}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="apt" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('apt')}</Label>
                                <Input
                                    id="apt"
                                    value={data.apt}
                                    onChange={(e) => setData('apt', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.apt ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.apt && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.apt) || errors.apt}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="state" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('state')}</Label>
                                <Input
                                    id="state"
                                    value={data.state}
                                    onChange={(e) => setData('state', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.state ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.state && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.state) || errors.state}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="postal_code" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('postal_code')}</Label>
                                <Input
                                    id="postal_code"
                                    value={data.postal_code}
                                    onChange={(e) => setData('postal_code', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={cn(errors.postal_code ? 'border-red-500' : '', getInputTextAlign('text'))}
                                />
                                {errors.postal_code && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.postal_code) || errors.postal_code}</p>
                                )}
                            </div>
                        </div>

                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="address" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('full_address')}</Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                dir={getFieldDir('textarea')}
                                className={cn(errors.address ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                rows={3}
                            />
                            {errors.address && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.address) || errors.address}</p>
                            )}
                        </div>
                    </div>

                    {/* Coordinates */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold", isRTL ? '!text-right' : '!text-left')}>{t('coordinates')}</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="latitude" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('latitude')}</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    value={data.latitude}
                                    onChange={(e) => setData('latitude', e.target.value)}
                                    dir={getFieldDir('number')}
                                    className={cn(errors.latitude ? 'border-red-500' : '', getInputTextAlign('number'))}
                                    placeholder="-90 to 90"
                                />
                                {errors.latitude && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.latitude) || errors.latitude}</p>
                                )}
                            </div>

                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="longitude" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('longitude')}</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    value={data.longitude}
                                    onChange={(e) => setData('longitude', e.target.value)}
                                    dir={getFieldDir('number')}
                                    className={cn(errors.longitude ? 'border-red-500' : '', getInputTextAlign('number'))}
                                    placeholder="-180 to 180"
                                />
                                {errors.longitude && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.longitude) || errors.longitude}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center justify-end gap-3 border-t pt-4", flexDirection)}>
                        <Link href={clinic?.id ? `/dashboard/clinics-address/${clinic.id}` : '/dashboard/clinics-address'}>
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing || !clinic?.id}>
                            {processing ? t('updating') : t('update')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

