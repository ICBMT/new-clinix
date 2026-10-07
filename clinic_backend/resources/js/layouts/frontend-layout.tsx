import { Head, Link, usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { login, register, logout } from '@/routes';
import dashboard from '@/routes/dashboard';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationBell } from '@/components/notification-bell';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { type PropsWithChildren } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseLayout } from './base-layout';
import { cn } from '@/lib/utils';

interface FrontendLayoutProps {
    title?: string;
    showFooter?: boolean;
    showHeader?: boolean;
}

export default function FrontendLayout({
    children,
    title,
    showFooter = true,
    showHeader = true,
}: PropsWithChildren<FrontendLayoutProps>) {
    const { t } = useTranslation();
    const { auth, siteSettings } = usePage<SharedData>().props;
    
    useRTLInit();
    const { isRTL } = useRTL();
    
    const appNameEn = siteSettings?.app_name_en || t('app_name');
    const appNameAr = siteSettings?.app_name_ar || t('app_name');
    const appName = isRTL ? appNameAr : appNameEn;
    const appLogo = siteSettings?.app_logo;
    const appInitial = appName.charAt(0).toUpperCase();

    return (
        <BaseLayout>
            <Head title={title ? `${title} - ${appName}` : appName} />
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#A8B5FF] via-[#8B7FD9] to-[#6B46C1] dark:from-slate-900 dark:via-[#4C1D95] dark:to-[#3B0F6B] relative">
                {/* Header Navigation */}
                {showHeader && (
                <header className="absolute top-6 left-6 right-6 z-10">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-3">
                                {appLogo ? (
                                    <img
                                        src={appLogo}
                                        alt={appName}
                                        className="h-8 w-8 object-contain"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded bg-primary-gradient flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">{appInitial}</span>
                                    </div>
                                )}
                                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    {appName}
                                </div>
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <LanguageSwitcher />
                            {auth?.user ? (
                                <>
                                    <Link
                                        href={dashboard.index.url()}
                                        className="group rounded-full border border-primary/20 bg-white dark:bg-slate-800 px-6 py-2 font-medium text-primary dark:text-primary shadow-sm transition-all duration-200 hover:shadow-md hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white"
                                        title={t('dashboard')}
                                    >
                                        <span className="transition-colors duration-200">{t('dashboard')}</span>
                                    </Link>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            router.post(logout(), {}, {
                                                onSuccess: () => {
                                                    router.flushAll();
                                                    setTimeout(() => {
                                                        window.location.reload();
                                                    }, 100);
                                                }
                                            });
                                        }}
                                        className="rounded-full border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 px-4 py-2 font-medium text-red-600 dark:text-red-400 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                        <span className="text-red-600 dark:text-red-400">{t('logout')}</span>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="px-6 py-2 font-medium text-slate-600 dark:text-slate-300 transition-colors duration-200 hover:text-primary dark:hover:text-primary"
                                    >
                                        <span className="text-slate-600 dark:text-slate-300">{t('login')}</span>
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-primary-gradient px-6 py-2 font-medium text-white transition-all duration-200 hover:opacity-90"
                                    >
                                        <span className="text-white">{t('register')}</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>
                )}

                {/* Main Content */}
                {children}

                {/* Footer */}
                {showFooter && (
                    <footer className="absolute bottom-6 left-6 right-6 text-center">
                        <p className="mb-4 text-slate-100 dark:text-slate-200 text-base font-medium">
                            © {new Date().getFullYear()} {appName}. {t('all_rights_reserved')}
                        </p>
                        <div className="flex justify-center gap-6 text-sm">
                            <Link
                                href="/privacy"
                                className="text-slate-100 dark:text-slate-200 transition-colors hover:text-white dark:hover:text-slate-100 font-medium"
                            >
                                {t('privacy_policy')}
                            </Link>
                            <Link
                                href="/terms"
                                className="text-slate-100 dark:text-slate-200 transition-colors hover:text-white dark:hover:text-slate-100 font-medium"
                            >
                                {t('terms_conditions')}
                            </Link>
                            <Link
                                href="/contact"
                                className="text-slate-100 dark:text-slate-200 transition-colors hover:text-white dark:hover:text-slate-100 font-medium"
                            >
                                {t('contact_us')}
                            </Link>
                        </div>
                    </footer>
                )}
            </div>
        </BaseLayout>
    );
}

