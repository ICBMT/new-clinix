import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, DollarSign, Building2, Calendar, CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
    const { isRTL, dir, textAlign, flexDirection, iconMargin, getFieldDir, getInputTextAlign } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('payouts_management'),
            href: '/dashboard/payouts',
        },
        {
            title: t('view_payout'),
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
        approveForm.post(`/dashboard/payouts/${payout.id}/complete`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowApproveDialog(false);
                approveForm.reset();
            },
        });
    };

    const handleFail = () => {
        failForm.post(`/dashboard/payouts/${payout.id}/fail`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowFailDialog(false);
                failForm.reset();
            },
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
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

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", textAlign)} dir={dir}>
                {/* Header */}
                <div className={cn("border-b pb-4 space-y-4", textAlign)}>
                    {/* Back button */}
                    <div className={cn("flex", isRTL ? 'justify-end' : 'justify-start')}>
                        <Link href="/dashboard/payouts">
                            <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                    
                    {/* Title */}
                    <div className={textAlign}>
                        <h1 className={cn("text-3xl font-bold text-foreground", textAlign)}>{t('payout_details')}</h1>
                        <p className={cn("text-muted-foreground mt-1", textAlign)}>{t('view_payout_information_and_earnings')}</p>
                    </div>
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        {payout.status === 'pending' && (
                            <>
                                <Button
                                    variant="default"
                                    onClick={() => setShowApproveDialog(true)}
                                    className={flexDirection}
                                >
                                    <CheckCircle className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('approve_payout')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowFailDialog(true)}
                                    className={flexDirection}
                                >
                                    <XCircle className={cn("h-4 w-4", iconMargin('md'))} />
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
                        className={
                            payout.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                            payout.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                        }
                    >
                        {t(payout.status)}
                    </Badge>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={flexDirection}>
                        <TabsTrigger value="details">{t('details')}</TabsTrigger>
                        <TabsTrigger value="related">{t('related_information')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className={cn("space-y-6 mt-6", textAlign)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Payout Reference */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <FileText className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('payout_reference')}
                                </p>
                                <p className={cn("font-medium font-mono text-lg", textAlign)} dir="ltr">{payout.payout_reference}</p>
                            </div>

                            {/* Clinic */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <Building2 className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('clinic')}
                                </p>
                                {payout.clinic ? (
                                    <div className={cn("flex flex-col", textAlign)}>
                                        <p className={cn("font-medium text-foreground", textAlign)} dir={dir}>
                                            {getLocalizedName(payout.clinic.name_en, payout.clinic.name_ar, locale)}
                                        </p>
                                        {payout.clinic.owner && (
                                            <p className={cn("text-sm text-muted-foreground", textAlign)} dir={dir}>{payout.clinic.owner.name}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className={cn("text-muted-foreground", textAlign)} dir={dir}>{t('n_a')}</p>
                                )}
                            </div>

                            {/* Total Amount */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <DollarSign className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('total_amount')}
                                </p>
                                <p className={cn("text-2xl font-bold text-foreground", textAlign)} dir="ltr">
                                    {parseFloat(payout.total_amount).toFixed(2)} {payout.currency}
                                </p>
                            </div>

                            {/* Commission Deducted */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('commission_deducted')}</p>
                                <p className={cn("text-xl font-semibold text-red-600 dark:text-red-400", textAlign)} dir="ltr">
                                    -{parseFloat(payout.commission_deducted || '0').toFixed(2)} {payout.currency}
                                </p>
                            </div>

                            {/* Net Amount */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('net_amount')}</p>
                                <p className={cn("text-2xl font-bold text-green-600 dark:text-green-400", textAlign)} dir="ltr">
                                    {parseFloat(payout.net_amount).toFixed(2)} {payout.currency}
                                </p>
                            </div>

                            {/* Frequency */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('frequency')}</p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{t(payout.frequency)}</p>
                            </div>

                            {/* Payout Date */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground flex items-center gap-2", flexDirection)}>
                                    <Calendar className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('payout_date')}
                                </p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDate(payout.payout_date)}</p>
                            </div>

                            {/* Bank Reference */}
                            {payout.bank_reference && (
                                <div className={cn("space-y-2", textAlign)}>
                                    <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('bank_reference')}</p>
                                    <p className={cn("text-base font-medium font-mono", textAlign)} dir="ltr">{payout.bank_reference}</p>
                                </div>
                            )}

                            {/* Bank Reference ID */}
                            {payout.bank_reference_id && (
                                <div className={cn("space-y-2", textAlign)}>
                                    <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('bank_reference_id')}</p>
                                    <p className={cn("text-base font-medium font-mono", textAlign)} dir="ltr">{payout.bank_reference_id}</p>
                                </div>
                            )}

                            {/* Processed At */}
                            {payout.processed_at && (
                                <div className={cn("space-y-2", textAlign)}>
                                    <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('processed_at')}</p>
                                    <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDateTime(payout.processed_at)}</p>
                                </div>
                            )}

                            {/* Processed By */}
                            {payout.processedBy && (
                                <div className={cn("space-y-2", textAlign)}>
                                    <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('processed_by')}</p>
                                    <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{payout.processedBy.name}</p>
                                    <p className={cn("text-sm text-muted-foreground", textAlign)} dir="ltr">{payout.processedBy.email}</p>
                                </div>
                            )}

                            {/* Admin Notes */}
                            {payout.admin_notes && (
                                <div className={cn("space-y-2 md:col-span-2", textAlign)}>
                                    <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('admin_notes')}</p>
                                    <p className={cn("text-base text-foreground bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg", textAlign)} dir={dir}>
                                        {payout.admin_notes}
                                    </p>
                                </div>
                            )}

                            {/* Failure Reason */}
                            {payout.failure_reason && (
                                <div className={cn("space-y-2 md:col-span-2", textAlign)}>
                                    <p className={cn("text-sm text-muted-foreground text-red-600 dark:text-red-400", textAlign)}>{t('failure_reason')}</p>
                                    <p className={cn("text-base text-foreground bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800", textAlign)} dir={dir}>
                                        {payout.failure_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="related" className={cn("space-y-6 mt-6", textAlign)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Created At */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('created_at')}</p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDateTime(payout.created_at)}</p>
                            </div>

                            {/* Updated At */}
                            <div className={cn("space-y-2", textAlign)}>
                                <p className={cn("text-sm text-muted-foreground", textAlign)}>{t('updated_at')}</p>
                                <p className={cn("text-base font-medium text-foreground", textAlign)} dir={dir}>{formatDateTime(payout.updated_at)}</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Approve Dialog */}
            {showApproveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={cn("bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4", textAlign)} dir={dir}>
                        <h3 className={cn("text-lg font-semibold mb-4", textAlign)}>{t('approve_payout')}</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleApprove(); }} className={cn("space-y-4", textAlign)} dir={dir}>
                            <div className={cn("space-y-2", textAlign)}>
                                <Label htmlFor="bank_reference" className={textAlign}>
                                    {t('bank_reference')} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="bank_reference"
                                    type="text"
                                    value={approveForm.data.bank_reference}
                                    onChange={(e) => approveForm.setData('bank_reference', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={getInputTextAlign('text')}
                                    required
                                />
                            </div>
                            <div className={cn("space-y-2", textAlign)}>
                                <Label htmlFor="bank_reference_id" className={textAlign}>{t('bank_reference_id')}</Label>
                                <Input
                                    id="bank_reference_id"
                                    type="text"
                                    value={approveForm.data.bank_reference_id}
                                    onChange={(e) => approveForm.setData('bank_reference_id', e.target.value)}
                                    dir={getFieldDir('text')}
                                    className={getInputTextAlign('text')}
                                />
                            </div>
                            <div className={cn("space-y-2", textAlign)}>
                                <Label htmlFor="admin_notes" className={textAlign}>{t('admin_notes')}</Label>
                                <Textarea
                                    id="admin_notes"
                                    value={approveForm.data.admin_notes}
                                    onChange={(e) => approveForm.setData('admin_notes', e.target.value)}
                                    dir={getFieldDir('textarea')}
                                    className={getInputTextAlign('textarea')}
                                    rows={3}
                                />
                            </div>
                            <div className={cn("flex gap-3 mt-6", flexDirection)}>
                                <Button type="submit" disabled={approveForm.processing}>
                                    {approveForm.processing ? t('processing') : t('approve')}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowApproveDialog(false)}>
                                    {t('cancel')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Fail Dialog */}
            {showFailDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={cn("bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4", textAlign)} dir={dir}>
                        <h3 className={cn("text-lg font-semibold mb-4", textAlign)}>{t('mark_as_failed')}</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleFail(); }} className={cn("space-y-4", textAlign)} dir={dir}>
                            <div className={cn("space-y-2", textAlign)}>
                                <Label htmlFor="failure_reason" className={textAlign}>
                                    {t('failure_reason')} <span className="text-red-500">*</span>
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
                            <div className={cn("flex gap-3 mt-6", flexDirection)}>
                                <Button type="submit" variant="destructive" disabled={failForm.processing}>
                                    {failForm.processing ? t('processing') : t('mark_as_failed')}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowFailDialog(false)}>
                                    {t('cancel')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

