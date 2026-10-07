import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Clock, Send, Eye } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { customToast } from '@/components/ui/custom-toast';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface Role {
    id: number;
    name: string;
    alias: string;
}

interface Broadcast {
    id: number;
    title_en: string;
    title_ar: string;
    description_en?: string;
    description_ar?: string;
    recipients?: string[] | null;
    target_roles?: string[] | null;
    scheduled_at?: string | null;
    status: 'draft' | 'scheduled' | 'sent';
}

interface EditBroadcastProps {
    broadcast: Broadcast;
    users: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    roles: Role[];
}

export default function EditBroadcast({ broadcast, users, roles }: EditBroadcastProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    const { flash } = usePage<SharedData>().props;
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState(
        broadcast.scheduled_at ? new Date(broadcast.scheduled_at).toISOString().slice(0, 16) : ''
    );

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            customToast.success(flash.success);
        }
        if (flash?.error) {
            customToast.error(flash.error);
        }
    }, [flash]);
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('broadcast_management'),
            href: '/dashboard/broadcasts',
        },
        {
            title: t('edit_broadcast'),
            href: '#',
        },
    ];

    // Determine recipient type based on existing data
    const hasTargetRoles = Array.isArray(broadcast.target_roles) && broadcast.target_roles.length > 0;
    const hasRecipients = Array.isArray(broadcast.recipients) && broadcast.recipients.length > 0;
    const initialRecipientType = hasTargetRoles ? 'roles' : (hasRecipients ? 'specific_users' : 'roles');

    const { data, setData, put, processing, errors } = useForm({
        title_en: broadcast.title_en || '',
        title_ar: broadcast.title_ar || '',
        message_en: broadcast.description_en || '',
        message_ar: broadcast.description_ar || '',
        recipient_type: initialRecipientType as 'roles' | 'specific_users',
        target_roles: Array.isArray(broadcast.target_roles) ? broadcast.target_roles : [],
        selected_users: Array.isArray(broadcast.recipients) 
            ? broadcast.recipients.map(r => r.toString()) 
            : [],
        send_type: broadcast.scheduled_at ? 'scheduled' as const : 'now' as const,
        scheduled_at: broadcast.scheduled_at ? new Date(broadcast.scheduled_at).toISOString().slice(0, 16) : '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // scheduled_at is already set in handleScheduleConfirm, just submit
        put(`/dashboard/broadcasts/${broadcast.id}`);
    };

    const handleScheduleClick = () => {
        // Sync scheduleDateTime with current data.scheduled_at if it exists
        if (data.scheduled_at) {
            setScheduleDateTime(data.scheduled_at);
        }
        setShowScheduleDialog(true);
    };

    const handleScheduleConfirm = () => {
        setData('send_type', 'scheduled');
        setData('scheduled_at', scheduleDateTime);
        setShowScheduleDialog(false);
        // Don't auto-submit - let user review and submit manually
    };

    const handleSendNow = () => {
        setData('send_type', 'now');
        setData('scheduled_at', '');
        // User can click the submit button to submit
    };

    const handleRoleChange = (roleName: string, checked: boolean) => {
        if (checked) {
            setData('target_roles', [...data.target_roles, roleName]);
        } else {
            setData('target_roles', data.target_roles.filter(r => r !== roleName));
        }
    };

    const handleUserSelect = (selectedUserIds: string[]) => {
        setData('selected_users', selectedUserIds);
    };

    // Convert users to MultiSelectOption format
    const userOptions: MultiSelectOption[] = users.map(user => ({
        value: user.id.toString(),
        label: user.name,
        description: user.email,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('edit_broadcast')} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('edit_broadcast')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('edit_broadcast_message') || t('edit_broadcast')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/broadcasts/${broadcast.id}`}>
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <Eye className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('view')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/broadcasts">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title English */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="title_en" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('broadcast_title')} ({t('english')})</Label>
                            <Input
                                id="title_en"
                                type="text"
                                value={data.title_en}
                                onChange={(e) => setData('title_en', e.target.value)}
                                placeholder={t('enter_title_english')}
                                dir={getFieldDir('text')}
                                className={cn(errors.title_en ? 'border-red-500' : '', getInputTextAlign('text'))}
                            />
                            {errors.title_en && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.title_en) || errors.title_en}</p>
                            )}
                        </div>

                        {/* Title Arabic */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="title_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('broadcast_title')} ({t('arabic')})</Label>
                            <Input
                                id="title_ar"
                                type="text"
                                value={data.title_ar}
                                onChange={(e) => setData('title_ar', e.target.value)}
                                placeholder={t('enter_title_arabic')}
                                dir="rtl"
                                className={cn(errors.title_ar ? 'border-red-500' : '', 'text-right')}
                            />
                            {errors.title_ar && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.title_ar) || errors.title_ar}</p>
                            )}
                        </div>

                        {/* Message English */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="message_en" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('broadcast_message')} ({t('english')})</Label>
                            <Textarea
                                id="message_en"
                                value={data.message_en}
                                onChange={(e) => setData('message_en', e.target.value)}
                                placeholder={t('enter_message_english')}
                                dir={getFieldDir('textarea')}
                                className={cn(errors.message_en ? 'border-red-500' : '', getInputTextAlign('textarea'))}
                                rows={4}
                            />
                            {errors.message_en && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.message_en) || errors.message_en}</p>
                            )}
                        </div>

                        {/* Message Arabic */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <Label htmlFor="message_ar" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('broadcast_message')} ({t('arabic')})</Label>
                            <Textarea
                                id="message_ar"
                                value={data.message_ar}
                                onChange={(e) => setData('message_ar', e.target.value)}
                                placeholder={t('enter_message_arabic')}
                                dir="rtl"
                                className={cn(errors.message_ar ? 'border-red-500' : '', 'text-right')}
                                rows={4}
                            />
                            {errors.message_ar && (
                                <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.message_ar) || errors.message_ar}</p>
                            )}
                        </div>
                    </div>

                    {/* Recipients Section */}
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('select_recipients')}</h3>
                        
                        {/* Recipient Type Selection */}
                        <div className={cn("flex gap-4 mb-4", flexDirection)}>
                            <Button
                                type="button"
                                variant={data.recipient_type === 'roles' ? 'default' : 'outline'}
                                onClick={() => {
                                    setData('recipient_type', 'roles');
                                    setData('selected_users', []);
                                }}
                            >
                                {t('select_by_roles')}
                            </Button>
                            <Button
                                type="button"
                                variant={data.recipient_type === 'specific_users' ? 'default' : 'outline'}
                                onClick={() => {
                                    setData('recipient_type', 'specific_users');
                                    setData('target_roles', []);
                                }}
                            >
                                {t('select_specific_users')}
                            </Button>
                        </div>

                        {/* Roles Selection */}
                        {data.recipient_type === 'roles' && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label className={cn(isRTL ? '!text-right' : '!text-left')}>{t('select_roles')}</Label>
                                <div className={cn("space-y-2 border rounded-lg p-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {roles.map((role) => (
                                        <div key={role.id} className={cn("flex items-center", flexDirection, "gap-2")}>
                                            <Checkbox
                                                id={`role_${role.id}`}
                                                checked={data.target_roles.includes(role.name)}
                                                onCheckedChange={(checked) => handleRoleChange(role.name, checked as boolean)}
                                            />
                                            <Label htmlFor={`role_${role.id}`} className={cn("cursor-pointer", isRTL ? '!text-right' : '!text-left')}>
                                                {role.alias || role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.target_roles && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.target_roles) || errors.target_roles}</p>
                                )}
                            </div>
                        )}

                        {/* Specific Users Selection */}
                        {data.recipient_type === 'specific_users' && (
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label className={cn(isRTL ? '!text-right' : '!text-left')}>{t('select_specific_users')}</Label>
                                <MultiSelect
                                    options={userOptions}
                                    value={data.selected_users}
                                    onChange={handleUserSelect}
                                    placeholder={t('select_specific_users')}
                                    maxHeight="200px"
                                />
                                {errors.selected_users && (
                                    <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.selected_users) || errors.selected_users}</p>
                                )}
                            </div>
                        )}

                        {errors.recipient_type && (
                            <p className={cn("text-sm text-red-500", isRTL ? '!text-right' : '!text-left')}>{t(errors.recipient_type) || errors.recipient_type}</p>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className={cn("flex gap-3 pt-6 border-t", isRTL ? 'flex-row-reverse justify-start' : 'justify-end')}>
                        {data.send_type !== 'scheduled' && (
                            <Button 
                                type="button" 
                                variant="outline"
                                disabled={processing}
                                onClick={handleScheduleClick}
                                className={cn("flex items-center gap-2", flexDirection)}
                            >
                                <Clock className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('schedule_broadcast')}
                            </Button>
                        )}
                        {data.send_type === 'scheduled' && data.scheduled_at && (
                            <Button 
                                type="button" 
                                variant="outline"
                                disabled={processing}
                                onClick={handleScheduleClick}
                                className={cn("flex items-center gap-2", flexDirection)}
                            >
                                <Clock className={cn("h-4 w-4", iconMargin('md'))} />
                                {new Date(data.scheduled_at).toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-US')}
                            </Button>
                        )}
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className={cn("flex items-center gap-2", flexDirection)}
                        >
                            <Send className={cn("h-4 w-4", iconMargin('md'))} />
                            {processing ? t('updating') : t('update_broadcast')}
                        </Button>
                    </div>
                </form>

                {/* Schedule Dialog */}
                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                    <DialogContent className={cn(isRTL ? 'rtl' : 'ltr', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <DialogHeader>
                            <DialogTitle className={cn(isRTL ? '!text-right' : '!text-left')}>{t('schedule_broadcast')}</DialogTitle>
                            <DialogDescription className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {t('select_date_and_time_to_schedule_broadcast')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className={cn("space-y-4 py-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <Label htmlFor="schedule_datetime" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('date_and_time')}</Label>
                                <Input
                                    id="schedule_datetime"
                                    type="datetime-local"
                                    value={scheduleDateTime}
                                    onChange={(e) => setScheduleDateTime(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="w-full"
                                    dir="ltr"
                                />
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {t('schedule_datetime_help')}
                                </p>
                            </div>
                        </div>
                        <DialogFooter className={flexDirection}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowScheduleDialog(false)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleScheduleConfirm}
                                disabled={!scheduleDateTime || new Date(scheduleDateTime) <= new Date()}
                            >
                                {t('schedule')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

