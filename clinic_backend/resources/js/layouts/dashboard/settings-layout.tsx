import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';
import { edit as editPassword } from '@/routes/dashboard/password';
import { edit } from '@/routes/dashboard/profile';
import { show } from '@/routes/dashboard/two-factor';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function SettingsLayout({ children }: PropsWithChildren) {
    useRTLInit();
    const { isRTL, dir } = useRTL();
    const { t } = useTranslation();
    
    const sidebarNavItems: NavItem[] = [
        {
            title: t('profile'),
            href: edit(),
            icon: null,
        },
        {
            title: t('password'),
            href: editPassword(),
            icon: null,
        },
        {
            title: t('two_factor_auth'),
            href: show(),
            icon: null,
        },
    ];
    
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className={cn(
            "py-6",
            isRTL ? '!text-right pl-4' : '!text-left px-4'
        )} dir={dir}>
            <Heading
                title={t('settings')}
                description={t('settings_description')}
            />

            <div className={cn(
                "flex flex-col",
                isRTL ? "lg:flex-row-reverse" : "lg:flex-row",
                "lg:gap-12"
            )} dir={dir}>
                {/* Sidebar - On right in RTL mode (first in DOM, appears on right with dir="rtl") */}
                <aside className={cn(
                    "w-full lg:w-48 lg:flex-shrink-0",
                    isRTL ? 'lg:order-2 !text-right' : 'lg:order-1 !text-left'
                )} dir={dir}>
                    <nav className={cn(
                        "flex flex-col space-y-1",
                        isRTL ? "items-end" : "items-start"
                    )} dir={dir}>
                        {sidebarNavItems.map((item, index) => {
                            const isActive = currentPath === (typeof item.href === 'string' ? item.href : item.href.url);
                            return (
                                <Button
                                    key={`${typeof item.href === 'string' ? item.href : item.href.url}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'w-full',
                                        isRTL ? '!justify-end !text-right' : '!justify-start !text-left',
                                        {
                                            'bg-muted': isActive,
                                        }
                                    )}
                                    dir={dir}
                                >
                                    <Link 
                                        href={item.href} 
                                        className={cn(
                                            "flex items-center w-full",
                                            isRTL ? "flex-row-reverse !text-right !justify-end" : "flex-row !text-left !justify-start"
                                        )} 
                                        dir={dir}
                                    >
                                        {item.icon && (
                                            <item.icon className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2" : "mr-2")} />
                                        )}
                                        <span className={cn(
                                            "w-full text-base",
                                            isRTL ? '!text-right' : '!text-left'
                                        )} dir={dir}>
                                            {item.title}
                                        </span>
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                {/* Content Area - On left in RTL mode */}
                <div className={cn(
                    "flex-1",
                    isRTL ? 'lg:order-1 !text-right' : 'lg:order-2 !text-left',
                    isRTL ? '' : 'md:max-w-2xl'
                )} dir={dir}>
                    <section className={cn(
                        "space-y-12",
                        isRTL ? '!text-right' : '!text-left max-w-xl'
                    )} dir={dir}>
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}

