import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { getLocalizedName } from '@/utils/localization';
import AppLayout from '@/layouts/app-layout';
import { index as dashboard } from '@/routes/dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, Clock, FileText, ArrowLeft, Edit } from 'lucide-react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
    description_en?: string;
    description_ar?: string;
    parent_id?: number;
    parent?: Category;
    status: 'active' | 'inactive';
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface ShowCategoryProps {
    category: Category;
}


export default function ShowCategory({ category }: ShowCategoryProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, textAlign } = useRTL();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('categories_management'),
            href: '/dashboard/categories',
        },
        {
            title: t('view_category'),
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('category_details')} - ${category.name_en}`} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')}>
                        <div className={cn("flex items-center gap-3", flexDirection)}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')}>{t('category_details')}</h1>
                            <Badge 
                                variant={category.status === 'active' ? 'default' : 'secondary'}
                                className={cn(
                                    "text-base px-4 py-1",
                                    category.status === 'active' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' 
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(category.status)}
                            </Badge>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')}>{t('view_category_information')}</p>
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)}>
                        <Link href={`/dashboard/categories/${category.id}/edit`}>
                            <Button 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('edit_category')}
                            >
                                <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                {t('edit_category')}
                            </Button>
                        </Link>
                        <Link href="/dashboard/categories">
                            <Button 
                                variant="outline" 
                                className={cn("flex items-center gap-2", flexDirection)}
                                aria-label={t('back')}
                            >
                                <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180')} />
                                {t('back')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Basic Information Section */}
                <div className={cn("space-y-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <div className={cn("flex items-center gap-3 mb-6", flexDirection)}>
                        <FileText className="h-6 w-6 text-primary" />
                        <h2 className={cn("text-2xl font-semibold text-foreground", isRTL ? '!text-right' : '!text-left')}>
                            {t('basic_information')}
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name (English) */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('name_en')}</p>
                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                {category.name_en}
                            </p>
                        </div>

                        {/* Name (Arabic) */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('name_ar')}</p>
                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">
                                {category.name_ar}
                            </p>
                        </div>

                        {/* Parent Category */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('parent_category')}</p>
                            {category.parent ? (
                                <div className={cn("space-y-1", isRTL ? '!text-right' : '!text-left')}>
                                    <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                        {category.parent.name_en}
                                    </p>
                                    <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">
                                        {category.parent.name_ar}
                                    </p>
                                </div>
                            ) : (
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>—</p>
                            )}
                        </div>

                        {/* Status */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('status')}</p>
                            <Badge 
                                variant={category.status === 'active' ? 'default' : 'secondary'}
                                className={cn(
                                    category.status === 'active' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' 
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
                                    isRTL ? '!text-right' : '!text-left'
                                )}
                            >
                                {t(category.status)}
                            </Badge>
                        </div>

                        {/* Sort Order */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('sort_order')}</p>
                            <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                {category.sort_order}
                            </p>
                        </div>

                        {/* Created At */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('created_at')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <Calendar className={cn("h-4 w-4 text-muted-foreground", iconMargin('md'))} />
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {formatDate(category.created_at)}
                                </p>
                            </div>
                        </div>

                        {/* Updated At */}
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('updated_at')}</p>
                            <div className={cn("flex items-center gap-2", flexDirection)}>
                                <Clock className={cn("h-4 w-4 text-muted-foreground", iconMargin('md'))} />
                                <p className={cn("text-base font-medium text-foreground", isRTL ? '!text-right' : '!text-left')}>
                                    {formatDate(category.updated_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description (English) */}
                    {category.description_en && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_en')}</p>
                            <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')} dir="ltr">
                                {category.description_en}
                            </p>
                        </div>
                    )}

                    {/* Description (Arabic) */}
                    {category.description_ar && (
                        <div className={cn("space-y-2", isRTL ? '!text-right' : '!text-left')}>
                            <p className={cn("text-sm text-muted-foreground", isRTL ? '!text-right' : '!text-left')}>{t('description_ar')}</p>
                            <p className={cn("text-base text-foreground", isRTL ? '!text-right' : '!text-left')} dir="rtl">
                                {category.description_ar}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

