import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SearchableMultiSelect, SearchableMultiSelectOption } from '@/components/ui/searchable-multi-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from '@/components/user-card';
import { PhoneInput } from '@/components/phone-input';
import { PasswordInput } from '@/components/password-input';
import { DatePickerComponent } from '@/components/ui/date-picker';
import InputError from '@/components/input-error';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { usePermissions } from '@/hooks/use-permissions';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { ArrowLeft, Eye, Upload, X } from 'lucide-react';
import { FormEventHandler, useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { customToast } from '@/components/ui/custom-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EditUserProps {
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string | null;
        email_verified_at?: string | null;
        phone_verified_at?: string | null;
        gender?: string | null;
        skin_type?: string | null;
        age?: number | null;
        date_of_birth?: string | null;
        last_machine_used?: number[] | null;
        last_machine_used_name?: string | null;
        restricted_machines?: number[] | null;
        restricted_machines_name?: string | null;
        allergies?: string | null;
        medications?: string | null;
    };
    machines?: Array<{ id: number; name_en: string; name_ar: string }>;
}

export default function EditUser({ user, machines = [] }: EditUserProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    const { can } = usePermissions();
    const { flash } = usePage<SharedData>().props;
    const lastFlashRef = useRef<string | null>(null);

    // Flash messages - prevent duplicate messages
    useEffect(() => {
        const flashKey = flash?.success || flash?.error || null;

        // Only show message if it's different from the last one shown
        if (flashKey && flashKey !== lastFlashRef.current) {
            if (flash?.success) {
                customToast.success(flash.success, user.name);
                lastFlashRef.current = flashKey;
            }
            if (flash?.error) {
                customToast.error(flash.error);
                lastFlashRef.current = flashKey;
            }
        }
    }, [flash]);

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
            title: t('edit_user'),
            href: '#',
        },
    ];

    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [removeAvatar, setRemoveAvatar] = useState<boolean>(false);

    // Handle allergies - convert array to string if needed
    const allergiesValue = Array.isArray(user.allergies)
        ? (user.allergies.length > 0 ? user.allergies[0] : '')
        : (user.allergies || '');

    // Calculate age from date_of_birth
    const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
        if (!dateOfBirth) return null;
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const userAge = useMemo(() => {
        if (user.date_of_birth) {
            return calculateAge(user.date_of_birth);
        }
        return user.age;
    }, [user.date_of_birth, user.age]);

    const { data, setData, post, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        password_confirmation: '',
        gender: user.gender || '',
        skin_type: user.skin_type || '',
        date_of_birth: user.date_of_birth || '',
        age: user.age?.toString() || '',
        last_machine_used: (Array.isArray(user.last_machine_used) ? user.last_machine_used : []) as number[],
        last_machine_used_name: user.last_machine_used_name || '',
        restricted_machines: (Array.isArray(user.restricted_machines) ? user.restricted_machines : []) as number[],
        restricted_machines_name: user.restricted_machines_name || '',
        allergies: allergiesValue,
        medications: user.medications || '',
        avatar: null as File | null,
        remove_avatar: false,
    });

    // Calculate and update age when date_of_birth changes
    const [calculatedAge, setCalculatedAge] = useState<number | null>(userAge);

    useEffect(() => {
        if (data.date_of_birth) {
            const age = calculateAge(data.date_of_birth);
            setCalculatedAge(age);
        } else if (user.date_of_birth) {
            // If form date_of_birth is empty but user has date_of_birth, calculate from user
            const age = calculateAge(user.date_of_birth);
            setCalculatedAge(age);
        } else {
            setCalculatedAge(userAge);
        }
    }, [data.date_of_birth, user.date_of_birth, userAge]);

    // Convert machines to SearchableMultiSelect options with localized names
    const machineOptions: SearchableMultiSelectOption[] = (machines || []).map(m => ({
        value: m.id.toString(),
        label: getLocalizedName(m.name_en, m.name_ar, locale),
    }));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Build FormData manually to ensure all fields are sent
        const formData = new FormData();

        // Always include these fields (even if empty)
        formData.append('name', data.name || '');
        formData.append('email', data.email || '');
        formData.append('phone', data.phone || '');
        formData.append('gender', data.gender || '');
        formData.append('skin_type', data.skin_type || '');
        formData.append('date_of_birth', data.date_of_birth || '');
        formData.append('allergies', data.allergies || '');
        formData.append('medications', data.medications || '');
        formData.append('last_machine_used_name', data.last_machine_used_name || '');
        formData.append('restricted_machines_name', data.restricted_machines_name || '');

        // Handle arrays
        if (data.last_machine_used && Array.isArray(data.last_machine_used)) {
            data.last_machine_used.forEach((id: number) => {
                formData.append('last_machine_used[]', id.toString());
            });
        }

        if (data.restricted_machines && Array.isArray(data.restricted_machines)) {
            data.restricted_machines.forEach((id: number) => {
                formData.append('restricted_machines[]', id.toString());
            });
        }

        // Only include password if provided
        if (data.password && data.password !== '') {
            formData.append('password', data.password);
            formData.append('password_confirmation', data.password_confirmation || '');
        }

        // Include avatar if a new file is selected
        if (avatarFile) {
            formData.append('avatar', avatarFile);
            formData.append('remove_avatar', 'false'); // Don't remove if uploading new file
        } else if (removeAvatar) {
            // If removing avatar, send the flag
            formData.append('remove_avatar', 'true');
        }

        // Use post() from useForm - POST route now directly handles updates
        post(`/dashboard/users/${user.id}`, {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setAvatarFile(null);
                setRemoveAvatar(false);
                // Success message will be shown via flash message
            },
            onError: (errors) => {
                // Handle validation errors
                if (errors && Object.keys(errors).length > 0) {
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') {
                        customToast.error(firstError);
                    } else if (Array.isArray(firstError) && firstError.length > 0) {
                        customToast.error(firstError[0]);
                    }
                }
            }
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setData('avatar', file);
            setData('remove_avatar', false); // Reset remove flag when selecting new file
            setRemoveAvatar(false);

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
        setData('remove_avatar', true);
        setRemoveAvatar(true);
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
            <Head title={`${t('edit_user')} - ${user.name}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('edit_user')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('update_user_information')}</p>
                    </div>

                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/users/${user.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/users">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* User Card */}
                <div className={cn("bg-gray-50 dark:bg-gray-800 rounded-lg p-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <UserCard user={user} showVerificationBadges={true} />
                </div>

                <form onSubmit={submit} encType="multipart/form-data" className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Tabs */}
                    <Tabs defaultValue="profile" className={cn("w-full", isRTL ? '!text-right' : '!text-left')}>
                        <TabsList className={cn(`grid w-full ${(() => {
                            const visibleTabs = [
                                can('users.edit-profile'),
                                can('users.edit-medical'),
                            ].filter(Boolean).length;
                            return visibleTabs === 1 ? 'grid-cols-1' : 'grid-cols-2';
                        })()
                            }`, flexDirection)}>
                            {can('users.edit-profile') && (
                                <TabsTrigger value="profile" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('profile')}</TabsTrigger>
                            )}
                            {can('users.edit-medical') && (
                                <TabsTrigger value="medical" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('medical_information')}</TabsTrigger>
                            )}
                        </TabsList>

                        {can('users.edit-profile') && (
                            <TabsContent value="profile" className={cn("mt-6 space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {/* Avatar Upload */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('profile_picture') || t('avatar')}</Label>
                                    <div className={cn("flex items-center gap-4", flexDirection)}>
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={avatarPreview || user.avatar || undefined} alt={user.name} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn("flex flex-col gap-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
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
                                                {avatarPreview ? (t('change_avatar') || t('change')) : (t('upload_avatar') || t('upload'))}
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
                                            <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                                {t('avatar_hint')}
                                            </p>
                                        </div>
                                    </div>
                                    {errors.avatar && (
                                        <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t(errors.avatar) !== errors.avatar ? t(errors.avatar) : errors.avatar}</p>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="name" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
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
                                        required
                                    />
                                    {errors.name && (
                                        <InputError message={errors.name} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Email */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="email" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
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
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('email_optional_hint')}</p>
                                    {errors.email && (
                                        <InputError message={errors.email} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Phone Number */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="phone" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_number')}</Label>
                                    <PhoneInput
                                        id="phone"
                                        value={data.phone}
                                        onChange={(value) => setData('phone', value)}
                                        className={errors.phone ? 'border-red-500' : ''}
                                    />
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('phone_format_hint')}</p>
                                    {errors.phone && (
                                        <InputError message={errors.phone} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Password Section */}
                                <div className={cn("pt-6 border-t", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <h3 className={cn("text-lg font-semibold text-foreground mb-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('change_password')}</h3>
                                    <p className={cn("text-sm text-muted-foreground mb-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('leave_blank_to_keep_current')}</p>

                                    {/* Password */}
                                    <div className={cn("space-y-2 mb-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        <Label htmlFor="password" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('new_password')}</Label>
                                        <PasswordInput
                                            id="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder={t('enter_new_password') || t('enter_password')}
                                            className={errors.password ? 'border-red-500' : ''}
                                            error={errors.password}
                                        />
                                        {errors.password && (
                                            <InputError message={errors.password} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    {data.password && (
                                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <Label htmlFor="password_confirmation" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('confirm_password')}</Label>
                                            <PasswordInput
                                                id="password_confirmation"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                placeholder={t('confirm_password') || t('enter_password')}
                                                className={errors.password_confirmation ? 'border-red-500' : ''}
                                                error={errors.password_confirmation}
                                            />
                                            {errors.password_confirmation && (
                                                <InputError message={errors.password_confirmation} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection, isRTL ? 'justify-start' : 'justify-end')}>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? t('updating') : t('update_user')}
                                    </Button>
                                    <Link href="/dashboard/users">
                                        <Button type="button" variant="outline">
                                            {t('cancel')}
                                        </Button>
                                    </Link>
                                </div>
                            </TabsContent>
                        )}

                        {can('users.edit-medical') && (
                            <TabsContent value="medical" className={cn("mt-6 space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {/* Gender */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="gender" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('gender')}</Label>
                                    <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                                        <SelectTrigger className={cn(errors.gender ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <SelectValue placeholder={t('select_gender')} />
                                        </SelectTrigger>
                                        <SelectContent dir={dir}>
                                            <SelectItem value="male" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('male')}</SelectItem>
                                            <SelectItem value="female" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('female')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.gender && (
                                        <InputError message={errors.gender} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Skin Type */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="skin_type" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('skin_type')}</Label>
                                    <Select value={data.skin_type} onValueChange={(value) => setData('skin_type', value)}>
                                        <SelectTrigger className={cn(errors.skin_type ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            <SelectValue placeholder={t('select_skin_type')} />
                                        </SelectTrigger>
                                        <SelectContent dir={dir}>
                                            <SelectItem value="fair" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('skin_tone_fair')}</SelectItem>
                                            <SelectItem value="wheatish" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('skin_tone_wheatish')}</SelectItem>
                                            <SelectItem value="bronze" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('skin_tone_bronze')}</SelectItem>
                                            <SelectItem value="medium_brown" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('skin_tone_medium_brown')}</SelectItem>
                                            <SelectItem value="black" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('skin_tone_black')}</SelectItem>
                                        </SelectContent>

                                    </Select>
                                    {errors.skin_type && (
                                        <InputError message={errors.skin_type} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Date of Birth */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="date_of_birth" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('date_of_birth')}
                                        {calculatedAge !== null && (
                                            <span className={cn("text-muted-foreground font-normal", isRTL ? 'mr-2' : 'ml-2')} dir={dir}>
                                                ({t('age')}: <span className="font-semibold">{calculatedAge}</span> {t('years_old') || 'years'})
                                            </span>
                                        )}
                                    </Label>
                                    <DatePickerComponent
                                        id="date_of_birth"
                                        value={data.date_of_birth}
                                        onChange={(value) => setData('date_of_birth', value)}
                                        placeholder={t('select_date_of_birth')}
                                        maxDate={new Date()} // Cannot select future dates
                                        minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 150))} // Max 150 years ago
                                        className={cn(errors.date_of_birth ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                    />
                                    {calculatedAge !== null && (
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                            {t('age')}: <span className="font-semibold">{calculatedAge}</span> {t('years_old') || 'years old'}
                                        </p>
                                    )}
                                    {errors.date_of_birth && (
                                        <InputError message={errors.date_of_birth} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Last Machine Used */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="last_machine_used" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('last_machine_used')}</Label>
                                    <div dir={dir}>
                                        <SearchableMultiSelect
                                            options={machineOptions}
                                            value={Array.isArray(data.last_machine_used) ? data.last_machine_used.map(id => id.toString()) : []}
                                            onChange={handleLastMachineUsedChange}
                                            placeholder={t('select_machines')}
                                            searchPlaceholder={t('search_machines')}
                                            emptyMessage={t('no_machines_found')}
                                            className={cn(errors.last_machine_used ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                            disabled={false}
                                        />
                                    </div>
                                    {errors.last_machine_used && (
                                        <InputError message={errors.last_machine_used} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Last Machine Used Name (Other) */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="last_machine_used_name" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('last_machine_used_name')}</Label>
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
                                        <InputError message={errors.last_machine_used_name} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Restricted Machines */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="restricted_machines" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('restricted_machines')}</Label>
                                    <div dir={dir}>
                                        <SearchableMultiSelect
                                            options={machineOptions}
                                            value={Array.isArray(data.restricted_machines) ? data.restricted_machines.map(id => id.toString()) : []}
                                            onChange={handleRestrictedMachinesChange}
                                            placeholder={t('select_restricted_machines')}
                                            searchPlaceholder={t('search_machines')}
                                            emptyMessage={t('no_machines_found')}
                                            className={cn(errors.restricted_machines ? 'border-red-500' : '', isRTL ? '!text-right' : '!text-left')}
                                            disabled={false}
                                        />
                                    </div>
                                    {errors.restricted_machines && (
                                        <InputError message={errors.restricted_machines} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Restricted Machines Name (Other) */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="restricted_machines_name" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>{t('restricted_machines_name')}</Label>
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
                                        <InputError message={errors.restricted_machines_name} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Allergies */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="allergies" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
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
                                        <InputError message={errors.allergies} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Medications */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    <Label htmlFor="medications" className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {t('current_medications') || t('medications')}
                                    </Label>
                                    <Textarea
                                        id="medications"
                                        value={data.medications || ''}
                                        onChange={(e) => setData('medications', e.target.value)}
                                        placeholder={t('write_medications')}
                                        dir={getFieldDir('textarea')}
                                        className={cn(errors.medications ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                        rows={3}
                                    />
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {data.medications ? t('medications_hint') || '' : t('no_medications_used')}
                                    </p>
                                    {errors.medications && (
                                        <InputError message={errors.medications} className={cn(isRTL ? '!text-right' : '!text-left')} />
                                    )}
                                </div>

                                {/* Actions */}
                                <div className={cn("flex items-center gap-3 pt-4 border-t", flexDirection, isRTL ? 'justify-start' : 'justify-end')} dir={dir}>
                                    <Button type="submit" disabled={processing} className={cn("flex items-center gap-2", flexDirection)}>
                                        {processing ? t('updating') : t('update_user')}
                                    </Button>
                                    <Link href="/dashboard/users">
                                        <Button type="button" variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                            {t('cancel')}
                                        </Button>
                                    </Link>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </form>
            </div>
        </AppLayout >
    );
}
