import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, DollarSign, Building2, Calendar, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import { type SharedData } from '@/types';

interface PayoutEarning {
    id: number;
    gross_amount: string;
    commission_amount: string;
    net_amount: string;
    currency: string;
    status: string;
    booking?: {
        id: number;
        booking_reference: string;
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
}

interface ShowPayoutProps {
    payout: {
        id: number;
        payout_reference: string;
        clinic?: {
            id: number;
            name_en: string;
            name_ar: string;
            email?: string;
            owner?: {
                id: number;
                name: string;
                email: string;
            };
        };
        total_amount: string;
        commission_deducted: string;
        net_amount: string;
        currency: string;
        status: 'pending' | 'approved' | 'failed';
        frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'manual';
        payout_date: string;
        processed_at?: string;
        date_approved?: string;
        bank_reference?: string;
        bank_reference_id?: string;
        admin_notes?: string;
        failure_reason?: string;
        processed_by?: number;
        processedBy?: {
            id: number;
            name: string;
            email: string;
        };
        earnings?: PayoutEarning[];
        created_at: string;
        updated_at: string;
    };
}

export default function ShowPayout({ payout }: ShowPayoutProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, getFieldDir, getInputTextAlign, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'dashboard',
            href: dashboard.url(),
        },
        {
            title: t('clinics_payouts_management'),
            href: '/dashboard/clinics-payouts',
        },
        {
            title: t('payout_details'),
            href: '#',
        },
    ];
    const [activeTab, setActiveTab] = useState('details');
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showFailDialog, setShowFailDialog] = useState(false);

    const approveForm = useForm({
        bank_reference: '',
        bank_reference_id: '',
        admin_notes: '',
    });

    const failForm = useForm({
        failure_reason: '',
    });

    const handleApprove = () => {
        if (!approveForm.data.bank_reference || approveForm.data.bank_reference.trim() === '') {
            approveForm.setError('bank_reference', t('bank_reference_required'));
            return;
        }
        approveForm.post(`/dashboard/clinics-payouts/${payout.id}/complete`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowApproveDialog(false);
                approveForm.reset();
            },
        });
    };

    const handleFail = () => {
        failForm.post(`/dashboard/clinics-payouts/${payout.id}/fail`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowFailDialog(false);
                failForm.reset();
            },
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('payout_details')} - ${payout.payout_reference}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("border-b pb-4 space-y-4", isRTL ? '!text-right' : '!text-left')}>
                    {/* Back button */}
                    <div className={cn("flex", isRTL ? 'justify-end' : 'justify-start')}>
                        <Link href="/dashboard/clinics-payouts">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                    
                    {/* Title */}
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('payout_details')}</h1>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('view_payout_information_and_earnings')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        {payout.status === 'pending' && (
                            <>
                                <Button
                                    variant="default"
                                    onClick={() => setShowApproveDialog(true)}
                                    className={cn("flex items-center gap-2", flexDirection)}
                                >
                                    <CheckCircle className={cn("h-4 w-4", iconMargin('sm'))} />
                                    {t('approve_payout')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowFailDialog(true)}
                                    className={cn("flex items-center gap-2", flexDirection)}
                                >
                                    <XCircle className={cn("h-4 w-4", iconMargin('sm'))} />
                                    {t('mark_as_failed')}
                                </Button>
                            </>
                        )}
                        
                    </div>
                </div>

                {/* Status Badge */}
                <div className={cn("flex items-center gap-2", flexDirection)}>
                    <Badge
                        variant={
                            payout.status === 'approved' ? 'default' : 
                            payout.status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className={cn(
                            payout.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                            payout.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                            isRTL ? '!text-right' : '!text-left'
                        )}
                    >
                        {t(payout.status)}
                    </Badge>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={flexDirection}>
                        <TabsTrigger value="details" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('details')}</TabsTrigger>
                        <TabsTrigger value="related" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('related_information')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Payout Reference */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <FileText className="h-4 w-4" />
                                    {t('payout_reference')}
                                </p>
                                <p className={cn("font-medium font-mono text-lg", isRTL ? '!text-right' : '!text-left')}>{payout.payout_reference}</p>
                            </div>

                            {/* Clinic */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <Building2 className="h-4 w-4" />
                                    {t('clinic')}
                                </p>
                                {payout.clinic ? (
                                    <div className={cn("flex flex-col", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                            {getLocalizedName(payout.clinic.name_en, payout.clinic.name_ar, locale) || t('n_a')}
                                        </p>
                                        {payout.clinic.owner && (
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{payout.clinic.owner.name}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className={cn("text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('n_a')}</p>
                                )}
                            </div>

                            {/* Total Amount */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <DollarSign className="h-4 w-4" />
                                    {t('total_amount')}
                                </p>
                                <p className={cn("text-2xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {parseFloat(payout.total_amount).toFixed(2)} {payout.currency}
                                </p>
                            </div>

                            {/* Commission Deducted */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('commission_deducted')}</p>
                                <p className={cn("text-xl font-semibold text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')}>
                                    -{parseFloat(payout.commission_deducted || '0').toFixed(2)} {payout.currency}
                                </p>
                            </div>

                            {/* Net Amount */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('net_amount')}</p>
                                <p className={cn("text-2xl font-bold text-green-600 dark:text-green-400", isRTL ? '!text-right' : '!text-left')}>
                                    {parseFloat(payout.net_amount).toFixed(2)} {payout.currency}
                                </p>
                            </div>

                            {/* Frequency */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('frequency')}</p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{t(payout.frequency)}</p>
                            </div>

                            {/* Payout Date */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <Calendar className="h-4 w-4" />
                                    {t('payout_date')}
                                </p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDate(payout.payout_date)}</p>
                            </div>

                            {/* Bank Reference */}
                            {payout.bank_reference && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('bank_reference')}</p>
                                    <p className={cn("text-base font-medium font-mono", isRTL ? '!text-right' : '!text-left')}>{payout.bank_reference}</p>
                                </div>
                            )}

                            {/* Bank Reference ID */}
                            {payout.bank_reference_id && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('bank_reference_id')}</p>
                                    <p className={cn("text-base font-medium font-mono", isRTL ? '!text-right' : '!text-left')}>{payout.bank_reference_id}</p>
                                </div>
                            )}

                            {/* Processed At */}
                            {payout.processed_at && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('processed_at')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDateTime(payout.processed_at)}</p>
                                </div>
                            )}

                            {/* Processed By */}
                            {payout.processedBy && (
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('processed_by')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{payout.processedBy.name}</p>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{payout.processedBy.email}</p>
                                </div>
                            )}

                            {/* Admin Notes */}
                            {payout.admin_notes && (
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('admin_notes')}</p>
                                    <p className={cn("text-base text-foreground bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {payout.admin_notes}
                                    </p>
                                </div>
                            )}

                            {/* Failure Reason */}
                            {payout.failure_reason && (
                                <div className={cn("space-y-2 md:col-span-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground text-red-600 dark:text-red-400", isRTL ? '!text-right' : '!text-left')}>{t('failure_reason')}</p>
                                    <p className={cn("text-base text-foreground bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                        {payout.failure_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>


                    <TabsContent value="related" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Created At */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDateTime(payout.created_at)}</p>
                            </div>

                            {/* Updated At */}
                            <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('updated_at')}</p>
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{formatDateTime(payout.updated_at)}</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent className={cn(isRTL ? 'rtl' : 'ltr', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <DialogHeader>
                        <DialogTitle className={cn(isRTL ? '!text-right' : '!text-left')}>{t('approve_payout')}</DialogTitle>
                        <DialogDescription className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('approve_payout_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div>
                            <Label htmlFor="bank_reference" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('bank_reference')}</> : <>{t('bank_reference')} <span className="text-red-500">*</span></>}
                            </Label>
                            <Input
                                id="bank_reference"
                                type="text"
                                value={approveForm.data.bank_reference}
                                onChange={(e) => {
                                    approveForm.setData('bank_reference', e.target.value);
                                    approveForm.clearErrors('bank_reference');
                                }}
                                dir={getFieldDir('text')}
                                className={cn(approveForm.errors.bank_reference ? 'border-red-500' : '', getInputTextAlign('text'))}
                                required
                            />
                            {approveForm.errors.bank_reference && (
                                <p className={cn("text-sm text-red-500 mt-1", isRTL ? '!text-right' : '!text-left')}>{t(approveForm.errors.bank_reference) || approveForm.errors.bank_reference}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="bank_reference_id" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('bank_reference_id')}</Label>
                            <Input
                                id="bank_reference_id"
                                type="text"
                                value={approveForm.data.bank_reference_id}
                                onChange={(e) => approveForm.setData('bank_reference_id', e.target.value)}
                                dir={getFieldDir('text')}
                                className={getInputTextAlign('text')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="admin_notes" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('admin_notes')}</Label>
                            <Textarea
                                id="admin_notes"
                                value={approveForm.data.admin_notes}
                                onChange={(e) => approveForm.setData('admin_notes', e.target.value)}
                                dir={getFieldDir('textarea')}
                                className={getInputTextAlign('textarea')}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className={flexDirection}>
                        <Button onClick={handleApprove} disabled={approveForm.processing}>
                            {approveForm.processing ? t('processing') : t('approve')}
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setShowApproveDialog(false);
                            approveForm.clearErrors();
                        }}>
                            {t('cancel')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fail Dialog */}
            <Dialog open={showFailDialog} onOpenChange={setShowFailDialog}>
                <DialogContent className={cn(isRTL ? 'rtl' : 'ltr', isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <DialogHeader>
                        <DialogTitle className={cn(isRTL ? '!text-right' : '!text-left')}>{t('mark_as_failed')}</DialogTitle>
                        <DialogDescription className={cn(isRTL ? '!text-right' : '!text-left')}>
                            {t('mark_as_failed_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div>
                            <Label htmlFor="failure_reason" className={cn(isRTL ? '!text-right' : '!text-left')}>
                                {isRTL ? <><span className="text-red-500">*</span> {t('failure_reason')}</> : <>{t('failure_reason')} <span className="text-red-500">*</span></>}
                            </Label>
                            <Textarea
                                id="failure_reason"
                                value={failForm.data.failure_reason}
                                onChange={(e) => failForm.setData('failure_reason', e.target.value)}
                                dir={getFieldDir('textarea')}
                                className={getInputTextAlign('textarea')}
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className={flexDirection}>
                        <Button variant="destructive" onClick={handleFail} disabled={failForm.processing}>
                            {failForm.processing ? t('processing') : t('mark_as_failed')}
                        </Button>
                        <Button variant="outline" onClick={() => setShowFailDialog(false)}>
                            {t('cancel')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

