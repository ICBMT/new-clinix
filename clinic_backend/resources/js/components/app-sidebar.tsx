import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { useTranslation } from '@/hooks/use-translation';
import { usePermissions } from '@/hooks/use-permissions';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import dashboard from '@/routes/dashboard';
import { type NavItem, type NavGroup, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users, Building2, Shield, UserCog, FileText, Bell, Megaphone, Settings, Store, Mail, ShieldCheck, MessageSquare, CreditCard, Phone, Tag, MapPin, Package, Calendar, Flag, Receipt, MessageCircle, Cpu, HelpCircle, Clock, Flame } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useTranslation();
    const { can, isSuperAdmin, isClinic, isClinicManager } = usePermissions();
    const page = usePage<SharedData>();
    const { rtl } = page.props;
    const sidebarContentRef = useRef<HTMLDivElement>(null);
    const SCROLL_STORAGE_KEY = 'sidebar_scroll_position';
    
    // Client-side mount check to prevent hydration mismatches
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    const mainNavItems: NavItem[] = [];
    
    // Only create groups with icons after mount to prevent hydration mismatch
    // Tab group Platform
    const platformGroup: NavGroup = !isMounted ? { title: t('platform'), items: [] } : {
        title: t('platform'),
        items: [
            ...(can('dashboard.view') ? [{
                title: t('dashboard'),
                href: dashboard.index.url(),
                icon: LayoutGrid,
            }] : []),
        ].filter(Boolean),
    };

    // Tab group Clinic
    const clinicManagementGroup: NavGroup = !isMounted ? { title: t('clinic'), items: [] } : {
        title: t('clinics'),
        items: [
            // Clinics - Super Admin sees all, Clinic role sees their own, Clinic Manager sees assigned
            ...(can('clinics.view') ? [{
                title: t('clinics'),
                href: '/dashboard/clinics',
                icon: Building2,
            }] : []),
            // Staff - For Clinic role, Clinic Managers, and Super Admin
            ...(can('clinics-staff.view') ? [{
                title: t('clinics_staff'),
                href: '/dashboard/clinics-staff',
                icon: UserCog,
            }] : []),
            // Bookings - Super Admin sees all, Clinic role sees their own, Clinic Manager sees assigned clinics
            ...(can('clinics-bookings.view') || can('bookings.view') ? [{
                title: t('bookings'),
                href: '/dashboard/bookings',
                icon: Calendar,
            }] : []),
            // Earnings - Super Admin, roles with permission, clinic and clinic_manager (view only)
            ...(isSuperAdmin || can('earnings.view') ? [{
                title: t('earnings'),
                href: '/dashboard/earnings',
                icon: Receipt,
            }] : []),
            
            // Categories - All roles with permission
            ...(can('categories.view') ? [{
                title: t('categories'),
                href: '/dashboard/categories',
                icon: Tag,
            }] : []),

            // Machines - All roles with permission
            ...(can('machines.view') ? [{
                title: t('machines'),
                href: '/dashboard/machines',
                icon: Cpu,
            }] : []),
            // Treatments - All roles with permission
            ...(can('treatments.view') ? [{
                title: t('treatments'),
                href: '/dashboard/treatments',
                icon: Package,
            }] : []),
            // Treatment Weekly Hours - All roles with permission
            ...(can('treatment-slots.view') ? [{
                title: t('treatment_weekly_hours'),
                href: '/dashboard/treatment-weekly-hours',
                icon: Clock,
            }] : []),
            // Reviews - All roles with permission
            ...(can('reviews.view') ? [{
                title: t('reviews'),
                href: '/dashboard/reviews',
                icon: MessageCircle,
            }] : []),
            // Clinic Subscriptions - Hidden/Commented out
            // ...(can('clinics-subscriptions.view') ? [{
            //     title: t('clinic_subscriptions'),
            //     href: '/dashboard/clinics-subscriptions',
            //     icon: Receipt,
            // }] : []),
        ].filter(Boolean),
    };

    // Tab group User
    const userManagementGroup: NavGroup = !isMounted ? { title: t('user'), items: [] } : {
        title: t('user'),
        items: [
            ...(can('users.view') ? [{
                title: t('users'),
                href: '/dashboard/users',
                icon: Users,
            }] : []),
            ...(can('roles.view') ? [{
                title: t('role'),
                href: '/dashboard/roles',
                icon: Shield,
            }] : []),
            ...(can('admins.view') ? [{
                title: t('admin'),
                href: '/dashboard/admins',
                icon: UserCog,
            }] : []),
            ...(can('activity-logs.view') ? [{
                title: t('activity_logs'),
                href: '/dashboard/activity-logs',
                icon: FileText,
            }] : []),
        ].filter(Boolean),
    };

    // Tab group Location
    const locationManagementGroup: NavGroup = !isMounted ? { title: t('location'), items: [] } : {
        title: t('location'),
        items: [
            ...(can('governorates.view') ? [{
                title: t('governorates'),
                href: '/dashboard/governorates',
                icon: MapPin,
            }] : []),
            ...(can('areas.view') ? [{
                title: t('areas'),
                href: '/dashboard/areas',
                icon: Package,
            }] : []),
        ].filter(Boolean),
    };

    // Tab group Promotion
    const promotionManagementGroup: NavGroup = !isMounted ? { title: t('promotion'), items: [] } : {
        title: t('promotion'),
        items: [
            ...(can('banners.view') ? [{
                title: t('banners'),
                href: '/dashboard/banners',
                icon: Flag,
            }] : []),
        ].filter(Boolean),
    };

    // Tab group Support & Contact
    const supportContactManagementGroup: NavGroup = !isMounted ? { title: t('support_contact'), items: [] } : {
        title: t('support_contact'),
        items: [
            ...(can('faqs.view') ? [{
                title: t('faq'),
                href: '/dashboard/faqs',
                icon: HelpCircle,
            }] : []),
        ].filter(Boolean),
    };

    // Tab group Finance
    const financeManagementGroup: NavGroup = !isMounted ? { title: t('finance'), items: [] } : {
        title: t('finance'),
        items: [
            ...(can('payment-methods.view') ? [{
                title: t('payment_methods'),
                href: '/dashboard/payment-methods',
                icon: CreditCard,
            }] : []),
            // ...(can('subscription-packages.view') ? [{
            //     title: t('subscription_packages'),
            //     href: '/dashboard/subscription-packages',
            //     icon: Package,
            // }] : []),
        ].filter(Boolean),
    };

    // Tab group Notifications & Broadcast
    const notificationsBroadcastGroup: NavGroup = !isMounted ? { title: t('notifications_broadcast'), items: [] } : {
        title: t('notifications_broadcast'),
        items: [
            ...(can('notifications.view') ? [{
                title: t('notifications'),
                href: '/dashboard/notifications',
                icon: Bell,
            }] : []),
            ...(can('broadcasts.view') ? [{
                title: t('broadcast'),
                href: '/dashboard/broadcasts',
                icon: Megaphone,
            }] : []),
        ].filter(Boolean),
    };

    // Tab group Site Settings
    const siteSettingsGroup: NavGroup = !isMounted ? { title: t('site_settings'), items: [] } : {
        title: t('site_settings'),
        items: [
            ...(can('site-settings.general.view') ? [{
                title: t('general_settings'),
                href: '/dashboard/site-settings/general',
                icon: Settings,
            }] : []),
            ...(can('site-settings.booking.view') ? [{
                title: t('booking_settings'),
                href: '/dashboard/site-settings/booking',
                icon: Calendar,
            }] : []),
            ...(can('site-settings.vendor.view') ? [{
                title: t('vendor_settings'),
                href: '/dashboard/site-settings/vendor',
                icon: Store,
            }] : []),
            ...(can('site-settings.contact.view') ? [{
                title: t('contact_us_settings'),
                href: '/dashboard/site-settings/contact',
                icon: Mail,
            }] : []),
            ...(can('site-settings.terms.view') ? [{
                title: t('terms_conditions'),
                href: '/dashboard/site-settings/terms',
                icon: FileText,
            }] : []),
            ...(can('site-settings.privacy.view') ? [{
                title: t('privacy_policy'),
                href: '/dashboard/site-settings/privacy',
                icon: ShieldCheck,
            }] : []),
            ...(can('site-settings.communication.view') ? [{
                title: t('communication_settings'),
                href: '/dashboard/site-settings/communication',
                icon: MessageSquare,
            }] : []),
            ...(can('site-settings.myfatoorah.view') ? [{
                title: t('myfatoorah_payment_settings'),
                href: '/dashboard/site-settings/myfatoorah',
                icon: CreditCard,
            }] : []),
            ...(can('site-settings.support.view') ? [{
                title: t('contact_support_settings'),
                href: '/dashboard/site-settings/support',
                icon: Phone,
            }] : []),
            ...(can('site-settings.firebase.view') ? [{
                title: t('firebase_settings'),
                href: '/dashboard/site-settings/firebase',
                icon: Flame,
            }] : []),
        ].filter(Boolean),
    };

    const footerNavItems: NavItem[] = [];
    // const footerNavItems: NavItem[] = [
    //     {
    //         title: t('repository'),
    //         href: 'https://github.com/laravel/react-starter-kit',
    //         icon: Folder,
    //     },
    //     {
    //         title: t('documentation'),
    //         href: 'https://laravel.com/docs/starter-kits#react',
    //         icon: BookOpen,
    //     },
    // ];

    // Save sidebar scroll position before navigation
    useEffect(() => {
        const saveScrollPosition = () => {
            if (sidebarContentRef.current) {
                const scrollTop = sidebarContentRef.current.scrollTop;
                sessionStorage.setItem(SCROLL_STORAGE_KEY, scrollTop.toString());
            }
        };

        // Save scroll position on scroll (debounced)
        let scrollTimeout: NodeJS.Timeout;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                saveScrollPosition();
            }, 150);
        };

        // Listen to Inertia navigation start event to save scroll position
        const handleBeforeVisit = () => {
            saveScrollPosition();
        };

        const sidebarContent = sidebarContentRef.current;
        if (sidebarContent) {
            sidebarContent.addEventListener('scroll', handleScroll, { passive: true });
            document.addEventListener('inertia:start', handleBeforeVisit);
        }

        return () => {
            if (sidebarContent) {
                sidebarContent.removeEventListener('scroll', handleScroll);
            }
            document.removeEventListener('inertia:start', handleBeforeVisit);
            clearTimeout(scrollTimeout);
        };
    }, []);

    // Restore sidebar scroll position after navigation
    useEffect(() => {
        const restoreScrollPosition = () => {
            const savedScrollTop = sessionStorage.getItem(SCROLL_STORAGE_KEY);
            if (savedScrollTop && sidebarContentRef.current) {
                // Use multiple animation frames to ensure DOM is fully rendered
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (sidebarContentRef.current) {
                            const scrollTop = parseInt(savedScrollTop, 10);
                            sidebarContentRef.current.scrollTop = scrollTop;
                        }
                    });
                });
            }
        };

        // Restore scroll position after page loads with a slight delay
        const timeoutId = setTimeout(restoreScrollPosition, 50);

        return () => clearTimeout(timeoutId);
    }, [page.url]); // Re-run when URL changes (after navigation)

    // Don't render navigation items until mounted to prevent hydration mismatch
    if (!isMounted) {
        return (
            <Sidebar collapsible="icon" variant="inset" side={rtl ? "right" : "left"} className={`${rtl ? 'border-l' : 'border-r'} border-primary/10 dark:border-slate-700/50 w-64 max-w-[90vw]`}>
                <SidebarHeader className="bg-primary-gradient/5 dark:bg-slate-800/50 border-b border-primary/10 dark:border-slate-700/50 px-2 py-1.5">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                size="lg" 
                                asChild 
                                className="hover:bg-primary-gradient/10 dark:hover:bg-slate-700/50 p-1.5"
                            >
                                <Link href={dashboard.index.url()} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent ref={sidebarContentRef} className="px-1 py-0.5">
                    <div className="h-full" />
                </SidebarContent>
                <SidebarFooter className="px-1 py-0.5 border-t border-primary/10 dark:border-slate-700/50">
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset" side={rtl ? "right" : "left"} className={`${rtl ? 'border-l' : 'border-r'} border-primary/10 dark:border-slate-700/50 w-64 max-w-[90vw]`}>
            <SidebarHeader className="bg-primary-gradient/5 dark:bg-slate-800/50 border-b border-primary/10 dark:border-slate-700/50 px-2 py-1.5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                            size="lg" 
                            asChild 
                            className="hover:bg-primary-gradient/10 dark:hover:bg-slate-700/50 p-1.5"
                        >
                            <Link href={dashboard.index.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent ref={sidebarContentRef} className="px-1 py-0.5">
                {isMounted ? (
                    <NavMain 
                        items={mainNavItems} 
                        groups={[
                            platformGroup,
                            clinicManagementGroup,
                            userManagementGroup,
                            locationManagementGroup,
                            promotionManagementGroup,
                            supportContactManagementGroup,
                            financeManagementGroup,
                            notificationsBroadcastGroup,
                            siteSettingsGroup,
                        ].filter(group => group.items.length > 0)} 
                    />
                ) : (
                    <div className="h-full" />
                )}
            </SidebarContent>

            <SidebarFooter className="px-1 py-0.5 border-t border-primary/10 dark:border-slate-700/50">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
