import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from '@/components/user-card';
import { ViewPageLayout, PageHeader } from '@/components/page-layouts';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Mail, Phone, Calendar, Clock, FileText, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface ShowVendorProps {
    vendor: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        email_verified_at?: string | null;
        phone_verified_at?: string | null;
        created_at: string;
        updated_at: string;
        last_login_at?: string | null;
        verification_status: 'pending' | 'approved' | 'rejected';
        description_en?: string;
        description_ar?: string;
        business_license_path?: string;
        id_document_path?: string;
        rejection_reason?: string;
    };
}

export default function ShowVendor({ vendor }: ShowVendorProps) {
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
            title: t('vendors_management'),
            href: '/dashboard/vendors',
        },
        {
            title: t('view_vendor'),
            href: '#',
        },
    ];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('vendor_details')} - ${vendor.name}`} />

            <ViewPageLayout>
                <PageHeader
                    title={t('vendor_details')}
                    description={t('view_vendor_information')}
                    actions={
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
                                <Button className={cn("flex items-center gap-2", flexDirection)}>
                                    <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                    {t('edit_vendor')}
                                </Button>
                            </Link>
                            <Link href="/dashboard/vendors">
                                <Button variant="outline" className={cn("flex items-center gap-2", flexDirection)}>
                                    <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                    {t('back')}
                                </Button>
                            </Link>
                        </div>
                    }
                />

                {/* Vendor Card with Status */}
                <div className={cn("bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 flex items-center justify-between", flexDirection)}>
                    <UserCard user={vendor} showVerificationBadges={true} />
                    <div className={cn("flex flex-col gap-2", isRTL ? 'items-start' : 'items-end')}>
                        <Badge 
                            variant={
                                vendor.verification_status === 'approved' ? 'default' : 
                                vendor.verification_status === 'pending' ? 'secondary' : 'destructive'
                            }
                            className={cn(
                                "text-base px-4 py-1",
                                vendor.verification_status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                                vendor.verification_status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                isRTL ? '!text-right' : '!text-left'
                            )}
                        >
                            {t(vendor.verification_status)}
                        </Badge>
                        {vendor.verification_status === 'rejected' && vendor.rejection_reason && (
                            <div className={cn("flex items-center gap-1 text-sm text-red-600 dark:text-red-400", flexDirection)}>
                                <AlertCircle className={cn("h-4 w-4", iconMargin('sm'))} />
                                <span className={cn(isRTL ? '!text-right' : '!text-left')}>{t('rejection_reason_provided')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Tab */}
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className={cn(flexDirection)}>
                        <TabsTrigger value="profile" className={cn(isRTL ? '!text-right' : '!text-left')}>{t('profile')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className={cn("space-y-6 mt-6", isRTL ? '!text-right' : '!text-left')}>
                        {/* Basic Information */}
                        <div className={cn("space-y-4", isRTL ? '!text-right' : '!text-left')}>
                            <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('basic_information')}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Company Name */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('company_name')}</p>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{vendor.name}</p>
                                </div>

                                {/* Email */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('email')}</p>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Mail className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{vendor.email}</p>
                                        {vendor.email_verified_at ? (
                                            <Badge variant="default" className={cn(isRTL ? 'mr-2' : 'ml-2', "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800", isRTL ? '!text-right' : '!text-left')}>{t('verified')}</Badge>
                                        ) : (
                                            <Badge variant="secondary" className={cn(isRTL ? 'mr-2' : 'ml-2', "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700", isRTL ? '!text-right' : '!text-left')}>{t('not_verified')}</Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Phone */}
                                {vendor.phone && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('phone_number')}</p>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <Phone className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                            <p className={cn("text-base font-medium font-mono text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">{vendor.phone}</p>
                                            {vendor.phone_verified_at ? (
                                                <Badge variant="default" className={cn(isRTL ? 'mr-2' : 'ml-2', "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800", isRTL ? '!text-right' : '!text-left')}>{t('verified')}</Badge>
                                            ) : (
                                                <Badge variant="secondary" className={cn(isRTL ? 'mr-2' : 'ml-2', "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700", isRTL ? '!text-right' : '!text-left')}>{t('not_verified')}</Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Verification Status */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('verification_status')}</p>
                                    <Badge 
                                        variant={
                                            vendor.verification_status === 'approved' ? 'default' : 
                                            vendor.verification_status === 'pending' ? 'secondary' : 'destructive'
                                        }
                                        className={cn(
                                            vendor.verification_status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                                            vendor.verification_status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                            isRTL ? '!text-right' : '!text-left'
                                        )}
                                    >
                                        {t(vendor.verification_status)}
                                    </Badge>
                                </div>

                                {/* Created At */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Calendar className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(vendor.created_at)}</p>
                                    </div>
                                </div>

                                {/* Last Updated */}
                                <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('updated_at')}</p>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <Clock className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                        <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(vendor.updated_at)}</p>
                                    </div>
                                </div>

                                {/* Last Login */}
                                {vendor.last_login_at && (
                                    <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('last_login')}</p>
                                        <div className={cn("flex items-center gap-2", flexDirection)}>
                                            <Clock className={cn("h-4 w-4 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{formatDate(vendor.last_login_at)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rejection Reason */}
                        {vendor.verification_status === 'rejected' && vendor.rejection_reason && (
                            <div className={cn("pt-6 border-t", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2", flexDirection)}>
                                    <AlertCircle className={cn("h-5 w-5", iconMargin('md'))} />
                                    {t('rejection_reason')}
                                </h3>
                                <div className={cn("p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-gray-800 dark:text-gray-200", isRTL ? '!text-right' : '!text-left')} dir={dir}>{vendor.rejection_reason}</p>
                                </div>
                            </div>
                        )}

                    {/* Documents Section */}
                    <div className={cn("pt-6 border-t", isRTL ? '!text-right' : '!text-left')}>
                        <h3 className={cn("text-lg font-semibold text-foreground mb-4", isRTL ? '!text-right' : '!text-left')}>{t('documents')}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Business License */}
                                <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')}>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <FileText className={cn("h-5 w-5 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                        <p className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('business_license')}</p>
                                    </div>
                                    {vendor.business_license_path ? (
                                        <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between", flexDirection)}>
                                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                                <FileText className={cn("h-8 w-8 text-purple-500 dark:text-purple-400", iconMargin('md'))} />
                                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                    <p className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('business_license')}</p>
                                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('file_uploaded')}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className={cn("flex items-center gap-2", flexDirection)}>
                                                <Download className={cn("h-4 w-4", iconMargin('md'))} />
                                                {t('download')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center", isRTL ? '!text-right' : '!text-left')}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_file_uploaded')}</p>
                                        </div>
                                    )}
                                </div>

                                {/* ID Document */}
                                <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')}>
                                    <div className={cn("flex items-center gap-2", flexDirection)}>
                                        <FileText className={cn("h-5 w-5 text-gray-400 dark:text-gray-500", iconMargin('sm'))} />
                                        <p className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('id_document')}</p>
                                    </div>
                                    {vendor.id_document_path ? (
                                        <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between", flexDirection)}>
                                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                                <FileText className={cn("h-8 w-8 text-purple-500 dark:text-purple-400", iconMargin('md'))} />
                                                <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                                                    <p className={cn("text-sm font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('id_document')}</p>
                                                    <p className={cn("text-xs text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('file_uploaded')}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className={cn("flex items-center gap-2", flexDirection)}>
                                                <Download className={cn("h-4 w-4", iconMargin('md'))} />
                                                {t('download')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center", isRTL ? '!text-right' : '!text-left')}>
                                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_file_uploaded')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    {/* Description Section */}
                    <div className={cn("pt-6 border-t", isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')}>
                            {/* English Description */}
                            <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_english')}</h3>
                                {vendor.description_en ? (
                                    <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-gray-800 dark:text-gray-200 whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir="ltr">{vendor.description_en}</p>
                                    </div>
                                ) : (
                                    <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_description_available')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Arabic Description */}
                            <div className={cn("space-y-3", isRTL ? '!text-right' : '!text-left')}>
                                <h3 className={cn("text-lg font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_arabic')}</h3>
                                {vendor.description_ar ? (
                                    <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-gray-800 dark:text-gray-200 whitespace-pre-wrap", isRTL ? '!text-right' : '!text-left')} dir="rtl">{vendor.description_ar}</p>
                                    </div>
                                ) : (
                                    <div className={cn("p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center", isRTL ? '!text-right' : '!text-left')}>
                                        <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('no_description_available')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    </TabsContent>
                </Tabs>
            </ViewPageLayout>
        </AppLayout>
    );
}

