import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SearchableMultiSelect, SearchableMultiSelectOption } from '@/components/ui/searchable-multi-select';
import { PasswordInput } from '@/components/password-input';
import { PhoneInput } from '@/components/phone-input';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { FormEventHandler, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CreateUserProps {
    machines?: Array<{ id: number; name_en: string; name_ar: string }>;
}

// Breadcrumbs will be set inside component to use translation

export default function CreateUser({ machines = [] }: CreateUserProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign, textAlign } = useRTL();

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('users_management'),
            href: '/dashboard/users',
        },
        {
            title: t('create_user'),
            href: '/dashboard/users/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        gender: '',
        skin_type: '',
        age: '',
        last_machine_used: [] as number[],
        last_machine_used_name: '',
        restricted_machines: [] as number[],
        restricted_machines_name: '',
        allergies: '',
        medications: '',
        avatar: null as File | null,
    });

    // Convert machines to SearchableMultiSelect options with localized names
    const machineOptions: SearchableMultiSelectOption[] = (machines || []).map(m => ({
        value: m.id.toString(),
        label: getLocalizedName(m.name_en, m.name_ar, locale),
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Prepare data - convert empty strings to null for age
        if (data.age === '') {
            setData('age', null);
        }
        
        // Only send avatar if a file is selected
        if (!avatarFile) {
            setData('avatar', null);
        }
        
        post('/dashboard/users', {
            forceFormData: true,
            onSuccess: () => {
                setAvatarFile(null);
                setAvatarPreview(null);
            }
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setData('avatar', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setData('avatar', null);
    };

    // Memoize onChange handlers to prevent infinite loops
    const handleLastMachineUsedChange = useCallback((values: string[]) => {
        const newValue = values.map(v => parseInt(v)).filter(id => !isNaN(id));
        // Only update if value actually changed
        const currentValue = Array.isArray(data.last_machine_used) ? data.last_machine_used : [];
        if (newValue.length !== currentValue.length || !newValue.every((v, idx) => v === currentValue[idx])) {
            setData('last_machine_used', newValue);
        }
    }, [data.last_machine_used, setData]);

    const handleRestrictedMachinesChange = useCallback((values: string[]) => {
        const newValue = values.map(v => parseInt(v)).filter(id => !isNaN(id));
        // Only update if value actually changed
        const currentValue = Array.isArray(data.restricted_machines) ? data.restricted_machines : [];
        if (newValue.length !== currentValue.length || !newValue.every((v, idx) => v === currentValue[idx])) {
            setData('restricted_machines', newValue);
        }
    }, [data.restricted_machines, setData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('create_user')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('create_user')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('create_new_user_account')}</p>
                    </div>
                    
                    <Link href="/dashboard/users">
                        <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                            {t('back')}
                        </Button>
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={submit} encType="multipart/form-data" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Avatar Upload */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label className={cn(isRTL ? '!text-right' : '!text-left')}>{t('profile_picture') || t('avatar')}</Label>
                        <div className={cn("flex items-center gap-4", flexDirection)}>
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={avatarPreview || undefined} alt="" />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                    {data.name ? data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn("flex flex-col gap-2", textAlign)}>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn("gap-2", flexDirection)}
                                    onClick={() => {
                                        const input = document.getElementById('avatar') as HTMLInputElement;
                                        input?.click();
                                    }}
                                >
                                    <Upload className={cn("h-4 w-4", iconMargin('md'))} />
                                    {avatarPreview ? t('change_avatar') || t('change') : t('upload_avatar') || t('upload')}
                                </Button>
                                <Input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                                {avatarPreview && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleRemoveAvatar}
                                        className={cn("gap-2 text-red-600", flexDirection)}
                                    >
                                        <X className={cn("h-4 w-4", iconMargin('md'))} />
                                        {t('remove')}
                                    </Button>
                                )}
                                <p className={cn("text-xs text-muted-foreground", textAlign)} dir={dir}>
                                    {t('avatar_hint')}
                                </p>
                            </div>
                        </div>
                        {errors.avatar && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.avatar) !== errors.avatar ? t(errors.avatar) : errors.avatar}</p>
                        )}
                    </div>

                    {/* Full Name */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="name" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('full_name')}</> : <>{t('full_name')} <span className="text-red-500">*</span></>}
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('enter_name')}
                            dir={getFieldDir('text')}
                            className={cn(errors.name ? 'border-red-500' : '', getInputTextAlign('text'))}
                            maxLength={50}
                            required
                        />
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('name_alphabetic_only') || t('name_hint')}</p>
                        {errors.name && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.name) || errors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="email" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('email')}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('enter_email')}
                            dir={getFieldDir('email')}
                            className={cn(errors.email ? 'border-red-500' : '', getInputTextAlign('email'))}
                        />
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('email_optional_hint') || t('email_hint')}</p>
                        {errors.email && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.email) || errors.email}</p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="phone" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('phone_number')}</Label>
                        <PhoneInput
                            id="phone"
                            value={data.phone}
                            onChange={(value) => setData('phone', value)}
                            className={errors.phone ? 'border-red-500' : ''}
                        />
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_format_hint') || t('phone_hint')}</p>
                        {errors.phone && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.phone) || errors.phone}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="password" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('password')}</> : <>{t('password')} <span className="text-red-500">*</span></>}
                        </Label>
                        <PasswordInput
                            id="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={t('enter_password')}
                            error={errors.password}
                            required
                        />
                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('password_requirements') || t('password_hint')}</p>
                        {errors.password && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.password) || errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                        <Label htmlFor="password_confirmation" className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {isRTL ? <><span className="text-red-500">*</span> {t('confirm_password')}</> : <>{t('confirm_password')} <span className="text-red-500">*</span></>}
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder={t('enter_password')}
                            error={errors.password_confirmation}
                            required
                        />
                        {errors.password_confirmation && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.password_confirmation) || errors.password_confirmation}</p>
                        )}
                    </div>

                    {/* Medical Information Section */}
                    <div className={cn("pt-6 border-t", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold text-foreground mb-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('medical_information')}</h3>

                        {/* Gender */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="gender" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('gender')}</Label>
                            <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                                <SelectTrigger className={cn(errors.gender ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue placeholder={t('select_gender')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="male" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('male')}</SelectItem>
                                    <SelectItem value="female" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('female')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.gender && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.gender) || errors.gender}</p>
                            )}
                        </div>

                        {/* Skin Type */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="skin_type" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('skin_type')}</Label>
                            <Select value={data.skin_type} onValueChange={(value) => setData('skin_type', value)}>
                                <SelectTrigger className={cn(errors.skin_type ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <SelectValue placeholder={t('select_skin_type')} />
                                </SelectTrigger>
                                <SelectContent dir={dir}>
                                    <SelectItem value="fair" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('fair')}</SelectItem>
                                    <SelectItem value="medium" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('medium')}</SelectItem>
                                    <SelectItem value="dark" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('dark')}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.skin_type && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.skin_type) || errors.skin_type}</p>
                            )}
                        </div>

                        {/* Age */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="age" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('age')}</Label>
                            <Input
                                id="age"
                                type="number"
                                min="1"
                                max="150"
                                value={data.age}
                                onChange={(e) => setData('age', e.target.value)}
                                placeholder={t('enter_age')}
                                dir={getFieldDir('number')}
                                className={cn(errors.age ? 'border-red-500' : '', getInputTextAlign('number'))}
                            />
                            {errors.age && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.age) !== errors.age ? t(errors.age) : errors.age}</p>
                            )}
                        </div>

                        {/* Last Machine Used */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="last_machine_used" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('last_machine_used')}</Label>
                            <div dir={dir}>
                                <SearchableMultiSelect
                                    options={machineOptions}
                                    value={Array.isArray(data.last_machine_used) ? data.last_machine_used.map(id => id.toString()) : []}
                                    onChange={handleLastMachineUsedChange}
                                    placeholder={t('select_machines')}
                                    searchPlaceholder={t('search_machines')}
                                    className={cn(errors.last_machine_used ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                    disabled={false}
                                />
                            </div>
                            {errors.last_machine_used && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.last_machine_used) !== errors.last_machine_used ? t(errors.last_machine_used) : errors.last_machine_used}</p>
                            )}
                        </div>

                        {/* Last Machine Used Name (Other) */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="last_machine_used_name" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('last_machine_used_name')}</Label>
                            <Input
                                id="last_machine_used_name"
                                type="text"
                                value={data.last_machine_used_name}
                                onChange={(e) => setData('last_machine_used_name', e.target.value)}
                                placeholder={t('enter_other_machine_name')}
                                dir={getFieldDir('text')}
                                className={cn(errors.last_machine_used_name ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('enter_if_other_machine')}</p>
                            {errors.last_machine_used_name && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.last_machine_used_name) !== errors.last_machine_used_name ? t(errors.last_machine_used_name) : errors.last_machine_used_name}</p>
                            )}
                        </div>

                        {/* Restricted Machines */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="restricted_machines" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('restricted_machines')}</Label>
                            <div dir={dir}>
                                <SearchableMultiSelect
                                    options={machineOptions}
                                    value={Array.isArray(data.restricted_machines) ? data.restricted_machines.map(id => id.toString()) : []}
                                    onChange={handleRestrictedMachinesChange}
                                    placeholder={t('select_restricted_machines')}
                                    searchPlaceholder={t('search_machines')}
                                    className={cn(errors.restricted_machines ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                    disabled={false}
                                />
                            </div>
                            {errors.restricted_machines && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.restricted_machines) !== errors.restricted_machines ? t(errors.restricted_machines) : errors.restricted_machines}</p>
                            )}
                        </div>

                        {/* Restricted Machines Name (Other) */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="restricted_machines_name" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('restricted_machines_name')}</Label>
                            <Input
                                id="restricted_machines_name"
                                type="text"
                                value={data.restricted_machines_name}
                                onChange={(e) => setData('restricted_machines_name', e.target.value)}
                                placeholder={t('enter_other_restricted_machine_name')}
                                dir={getFieldDir('text')}
                                className={cn(errors.restricted_machines_name ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('enter_if_other_restricted_machine')}</p>
                            {errors.restricted_machines_name && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.restricted_machines_name) !== errors.restricted_machines_name ? t(errors.restricted_machines_name) : errors.restricted_machines_name}</p>
                            )}
                        </div>

                        {/* Allergies */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="allergies" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('do_you_have_any_known_allergies')}
                            </Label>
                            <Textarea
                                id="allergies"
                                value={data.allergies}
                                onChange={(e) => setData('allergies', e.target.value)}
                                placeholder={t('write_allergies')}
                                dir={getFieldDir('textarea')}
                                className={cn(errors.allergies ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                rows={3}
                            />
                            {errors.allergies && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.allergies) || errors.allergies}</p>
                            )}
                        </div>

                        {/* Medications */}
                        <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="medications" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('current_medications') || t('medications')}
                            </Label>
                            <Textarea
                                id="medications"
                                value={data.medications}
                                onChange={(e) => setData('medications', e.target.value)}
                                placeholder={t('write_medications')}
                                dir={getFieldDir('textarea')}
                                className={cn(errors.medications ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                rows={3}
                            />
                            {errors.medications && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.medications) || errors.medications}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection)}>
                        <Button type="submit" disabled={processing}>
                            {processing ? t('creating') : t('create_user')}
                        </Button>
                        <Link href="/dashboard/users">
                            <Button type="button" variant="outline">
                                {t('cancel')}
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
