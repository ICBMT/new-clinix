import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Radio, Send, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem } from '@/types';
import { formatHumanDate } from '@/utils/date-utils';
import { type SharedData } from '@/types';

interface Broadcast {
    id: number;
    title_en: string;
    title_ar: string;
    message_en?: string;
    message_ar?: string;
    description_en?: string;
    description_ar?: string;
    recipients?: number[] | null;
    target_roles?: string[] | null;
    formattedRecipients?: {
        type: 'all' | 'specific';
        users?: Array<{
            id: number;
            name: string;
            email: string;
        }>;
        users_count?: number;
        roles?: Array<{
            name: string;
            alias: string;
        }>;
    } | null;
    topics?: number[] | null;
    status: 'draft' | 'pending' | 'scheduled' | 'sent';
    sent_at: string | null;
    scheduled_at?: string | null;
    created_at: string;
    updated_at: string;
}

interface BroadcastShowPageProps {
    broadcast: Broadcast;
}

export default function BroadcastShow({ broadcast }: BroadcastShowPageProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin } = useRTL();

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
            title: t('broadcast_details'),
            href: '#',
        },
    ];

    const handleSend = () => {
        router.patch(`/dashboard/broadcasts/${broadcast.id}/send`, {}, {
            onSuccess: () => {
                toast.success(t('broadcast_sent_successfully'));
            },
            onError: () => {
                toast.error(t('failed_to_send_broadcast'));
            },
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'sent':
                return 'default';
            case 'pending':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('broadcast_details')} - ${isRTL && broadcast.title_ar ? broadcast.title_ar : broadcast.title_en}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('broadcast_details')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('view_detailed_broadcast_information') || t('broadcast_details')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        {broadcast.status === 'pending' && (
                            <Button
                                variant="outline"
                                onClick={handleSend}
                                className={cn("flex items-center gap-2", flexDirection)}
                            >
                                <Send className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('send_broadcast')}
                            </Button>
                        )}
                        <Link href="/dashboard/broadcasts">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Broadcast Card */}
                <div className={cn("bg-muted/50 dark:bg-muted/30 rounded-lg p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("flex items-center gap-4", flexDirection)}>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                            <Radio className="h-8 w-8 text-primary" />
                        </div>
                        <div className={cn("flex-1", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                {isRTL && broadcast.title_ar ? broadcast.title_ar : broadcast.title_en}
                            </h3>
                            <div className={cn("flex items-center gap-2 mt-2", flexDirection)}>
                                <Badge variant={getStatusBadgeVariant(broadcast.status)} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t(broadcast.status)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">•</span>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{formatHumanDate(broadcast.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Broadcast Information */}
                <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    {/* Basic Information */}
                    <Card className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <CardHeader>
                            <CardTitle className={cn("flex items-center gap-2", flexDirection)}>
                                <Radio className="h-5 w-5" />
                                {t('broadcast_information')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {/* Title */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('broadcast_title')}</p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {isRTL && broadcast.title_ar ? broadcast.title_ar : broadcast.title_en}
                                </p>
                            </div>

                            {/* Message */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('broadcast_message')}</p>
                                <p className={cn("text-base font-medium text-foreground whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                    {isRTL 
                                        ? (broadcast.message_ar || broadcast.description_ar || '') 
                                        : (broadcast.message_en || broadcast.description_en || '')}
                                </p>
                            </div>

                            {/* Status */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('broadcast_status')}</p>
                                <Badge variant={getStatusBadgeVariant(broadcast.status)} className={cn(isRTL ? '!text-right' : '!text-left')}>
                                    {t(broadcast.status)}
                                </Badge>
                            </div>

                            {/* Created At */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                                <div className={cn("flex items-center gap-2", flexDirection)}>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatHumanDate(broadcast.created_at)}</p>
                                </div>
                            </div>

                            {/* Sent At */}
                            {broadcast.sent_at && (
                                <div className="space-y-2">
                                    <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>{t('sent_at')}</p>
                                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className={`text-base font-medium text-foreground ${isRTL ? 'text-right' : ''}`}>
                                            {new Date(broadcast.sent_at).toLocaleString(isRTL ? 'ar-KW' : 'en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recipients and Topics */}
                    <Card className={isRTL ? 'text-right' : ''} dir={isRTL ? 'rtl' : 'ltr'}>
                        <CardHeader className={isRTL ? 'text-right' : ''} dir={isRTL ? 'rtl' : 'ltr'}>
                            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Users className="h-5 w-5" />
                                {t('recipients')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={`space-y-4 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                            {/* Recipients */}
                            <div className="space-y-2">
                                <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>{t('recipients')}</p>
                                {broadcast.formattedRecipients ? (
                                    <>
                                        {broadcast.formattedRecipients.type === 'specific' && broadcast.formattedRecipients.users && (
                                            <div className="space-y-2">
                                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <p className={`text-base font-medium text-foreground ${isRTL ? 'text-right' : ''}`}>
                                                        {t('specific_users')}
                                                    </p>
                                                </div>
                                                <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                                                    {broadcast.formattedRecipients.users_count || broadcast.formattedRecipients.users.length} {t('users_selected')}
                                                </p>
                                                <div className={`space-y-2 max-h-48 overflow-y-auto ${isRTL ? 'text-right' : ''}`}>
                                                    {broadcast.formattedRecipients.users.map((user) => (
                                                        <div key={user.id} className={`p-2 bg-muted/50 rounded-md ${isRTL ? 'text-right' : ''}`}>
                                                            <p className={`text-sm font-medium text-foreground ${isRTL ? 'text-right' : ''}`}>{user.name}</p>
                                                            <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>{user.email}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {broadcast.formattedRecipients.type === 'all' && broadcast.formattedRecipients.roles && (
                                            <div className={`space-y-1 ${isRTL ? 'text-right' : ''}`}>
                                                <p className={`text-base font-medium text-foreground ${isRTL ? 'text-right' : ''}`}>
                                                    {t('selected_roles')}:
                                                </p>
                                                <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    {broadcast.formattedRecipients.roles.map((role, index) => (
                                                        <Badge key={index} variant="outline">
                                                            {role.alias || role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                                        {t('no_recipients_selected') || t('n_a')}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
