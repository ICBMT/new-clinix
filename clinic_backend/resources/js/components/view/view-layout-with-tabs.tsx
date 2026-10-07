import { type ReactNode, useState, useEffect } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';

interface Tab {
    value: string;
    label: string;
    content: ReactNode;
}

interface ViewLayoutWithTabsProps {
    breadcrumbs: BreadcrumbItem[];
    title: string;
    description?: string;
    status?: {
        value: string;
        variant?: 'default' | 'secondary' | 'destructive';
        className?: string;
    };
    editUrl?: string;
    backUrl?: string;
    backLabel?: string;
    editLabel?: string;
    actions?: ReactNode; // Custom action buttons
    tabs: Tab[];
    defaultTab?: string;
    className?: string;
    headTitle?: string;
    syncUrlTab?: boolean; // Whether to sync active tab with URL parameter
}

export function ViewLayoutWithTabs({
    breadcrumbs,
    title,
    description,
    status,
    editUrl,
    backUrl,
    backLabel,
    editLabel,
    actions,
    tabs,
    defaultTab,
    className,
    headTitle,
    syncUrlTab = true,
}: ViewLayoutWithTabsProps) {
    useRTLInit();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, iconMargin, textAlign } = useRTL();

    // Get initial tab from URL parameter or default
    const getInitialTab = () => {
        if (syncUrlTab) {
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab && tabs.some(t => t.value === tab)) {
                return tab;
            }
        }
        return defaultTab || tabs[0]?.value || '';
    };

    const [activeTab, setActiveTab] = useState<string>(getInitialTab());

    // Sync with URL parameter on mount
    useEffect(() => {
        if (syncUrlTab) {
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab && tabs.some(t => t.value === tab)) {
                setActiveTab(tab);
            }
        }
    }, [syncUrlTab, tabs]);

    // Handle tab change and update URL
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (syncUrlTab) {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', value);
            router.visit(url.toString(), {
                preserveScroll: true,
                preserveState: true,
                only: [],
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={headTitle || title} />

            <div className={cn("flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-card dark:bg-card p-6 border border-border", isRTL ? '!text-right' : '!text-left', className)} dir={dir}>
                {/* Header */}
                <div className={cn("flex items-center justify-between border-b pb-4", flexDirection)} dir={dir}>
                    <div className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                        <div className={cn("flex items-center gap-3", flexDirection)} dir={dir}>
                            <h1 className={cn("text-3xl font-bold text-foreground", isRTL ? '!text-right' : '!text-left')} dir={dir}>{title}</h1>
                            {status && (
                                <Badge 
                                    variant={status.variant || 'default'}
                                    className={cn(
                                        "text-base px-4 py-1",
                                        status.className,
                                        isRTL ? '!text-right' : '!text-left'
                                    )}
                                    dir={dir}
                                >
                                    {t(status.value)}
                                </Badge>
                            )}
                        </div>
                        {description && (
                            <p className={cn("text-muted-foreground mt-1", isRTL ? '!text-right' : '!text-left')} dir={dir}>{description}</p>
                        )}
                    </div>
                    
                    <div className={cn("flex items-center gap-3", flexDirection)} dir={dir}>
                        {actions || (
                            <>
                                {editUrl && (
                                    <Link href={editUrl}>
                                        <Button 
                                            className={cn("flex items-center gap-2", flexDirection)}
                                            aria-label={editLabel || t('edit')}
                                            dir={dir}
                                        >
                                            <Edit className={cn("h-4 w-4", iconMargin('md'))} />
                                            {editLabel || t('edit')}
                                        </Button>
                                    </Link>
                                )}
                                {backUrl && (
                                    <Link href={backUrl}>
                                        <Button 
                                            variant="outline" 
                                            className={cn("flex items-center gap-2", flexDirection)}
                                            aria-label={backLabel || t('back')}
                                            dir={dir}
                                        >
                                            <ArrowLeft className={cn("h-4 w-4", isRTL && 'rotate-180', iconMargin('md'))} />
                                            {backLabel || t('back')}
                                        </Button>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className={cn("w-full", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                    <TabsList className={cn("grid w-full", flexDirection)} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} dir={dir}>
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className={cn(isRTL ? '!text-right' : '!text-left')} dir={dir}>
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {tabs.map((tab) => (
                        <TabsContent key={tab.value} value={tab.value} className={cn("mt-6", isRTL ? '!text-right' : '!text-left')} dir={dir}>
                            {tab.content}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </AppLayout>
    );
}

