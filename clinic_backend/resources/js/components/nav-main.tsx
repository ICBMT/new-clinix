import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import { type NavItem, type NavGroup, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';

interface NavMainProps {
    items?: NavItem[];
    groups?: NavGroup[];
}

export function NavMain({ items = [], groups = [] }: NavMainProps) {
    const page = usePage<SharedData>();
    const { t } = useTranslation();
    const { rtl } = page.props;
    
    // Normalize URL by removing query parameters and trailing slashes
    const normalizeUrl = (url: string): string => {
        try {
            const urlObj = new URL(url, window.location.origin);
            return urlObj.pathname.replace(/\/$/, '');
        } catch {
            // If URL parsing fails, just remove query string and trailing slash
            return url.split('?')[0].split('#')[0].replace(/\/$/, '');
        }
    };
    
    // Find which group contains the current active page
    const findActiveGroup = useCallback((url: string, groupsList: NavGroup[]) => {
        const normalizedUrl = normalizeUrl(url);
        
        for (const group of groupsList) {
            for (const item of group.items) {
                const itemUrl = typeof item.href === 'string' ? item.href : item.href.url;
                const normalizedItemUrl = normalizeUrl(itemUrl);
                
                // Check if URL matches exactly or starts with the item URL
                if (normalizedUrl === normalizedItemUrl || normalizedUrl.startsWith(normalizedItemUrl + '/')) {
                    return group.title;
                }
            }
        }
        return null;
    }, []);
    
    // Initialize with all groups open by default
    const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
        // Open all groups that have items by default
        const allGroups = new Set<string>();
        groups.forEach(group => {
            if (group.items.length > 0) {
                allGroups.add(group.title);
            }
        });
        return allGroups;
    });
    
    // Memoize the active group to avoid recalculating on every render
    const activeGroup = useMemo(() => {
        return findActiveGroup(page.url, groups);
    }, [page.url, groups, findActiveGroup]);
    
    // Ensure the active group is always open when URL changes
    useEffect(() => {
        if (activeGroup) {
            setOpenGroups(prev => {
                const newSet = new Set(prev);
                newSet.add(activeGroup);
                return newSet;
            });
        }
    }, [activeGroup]);
    
    const toggleGroup = (groupTitle: string) => {
        setOpenGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupTitle)) {
                newSet.delete(groupTitle);
            } else {
                newSet.add(groupTitle);
            }
            return newSet;
        });
    };
    
    return (
        <>
            {/* Main items */}
            {items.length > 0 && (
                <SidebarGroup className="px-0 py-0 mb-0.5">
                    <SidebarGroupLabel className="font-medium text-xs text-primary dark:text-primary/80 px-1.5 py-0.5 mb-0">{t('platform')}</SidebarGroupLabel>
                    <SidebarMenu className="space-y-0">
                        {items.map((item) => {
                            const itemUrl = typeof item.href === 'string' ? item.href : item.href.url;
                            const normalizedUrl = normalizeUrl(page.url);
                            const normalizedItemUrl = normalizeUrl(itemUrl);
                            // For dashboard, only match exact URL, not sub-paths
                            const isDashboard = normalizedItemUrl === '/dashboard' || normalizedItemUrl.endsWith('/dashboard');
                            const isActive = isDashboard 
                                ? normalizedUrl === normalizedItemUrl 
                                : normalizedUrl === normalizedItemUrl || normalizedUrl.startsWith(normalizedItemUrl + '/');
                            
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        className="font-normal hover:font-medium data-[active=true]:font-medium data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-slate-700/50 dark:hover:text-primary transition-all duration-200 h-7 px-1.5 text-slate-800 dark:text-slate-200 dark:data-[active=true]:!bg-primary-gradient dark:data-[active=true]:!text-white dark:[&[data-active=true]_*]:!text-white"
                                    >
                                        <Link href={item.href} prefetch={false}>
                                            {item.icon && <item.icon className={`h-3.5 w-3.5 ${rtl ? "ml-1" : "mr-1"}`} />}
                                            <span className="text-xs">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            )}
            
            {/* Groups */}
            {groups.map((group, groupIndex) => {
                const hasItems = group.items.length > 0;
                
                // Check if any item in this group is active
                const hasActiveItem = group.items.some((item) => {
                    const itemUrl = typeof item.href === 'string' ? item.href : item.href.url;
                    const normalizedUrl = normalizeUrl(page.url);
                    const normalizedItemUrl = normalizeUrl(itemUrl);
                    // For dashboard, only match exact URL, not sub-paths
                    const isDashboard = normalizedItemUrl === '/dashboard' || normalizedItemUrl.endsWith('/dashboard');
                    return isDashboard 
                        ? normalizedUrl === normalizedItemUrl 
                        : normalizedUrl === normalizedItemUrl || normalizedUrl.startsWith(normalizedItemUrl + '/');
                });
                
                // All groups are open by default, but can be toggled
                const isOpen = openGroups.has(group.title);
                
                return (
                    <SidebarGroup key={`${group.title}-${groupIndex}`} className="px-0 py-0 mb-0.5" suppressHydrationWarning>
                        <SidebarGroupLabel 
                            className={`cursor-pointer hover:bg-primary/10 dark:hover:bg-slate-700/50 hover:text-primary dark:hover:text-primary rounded-md px-1.5 py-0.5 transition-colors font-medium text-xs ${
                                hasActiveItem 
                                    ? 'bg-primary/10 text-primary dark:bg-primary-gradient/20 dark:text-primary' 
                                    : 'text-primary dark:text-primary/90'
                            }`}
                            onClick={() => hasItems && toggleGroup(group.title)}
                        >
                            <div className={`flex items-center justify-between w-full ${rtl ? 'flex-row-reverse' : ''}`}>
                                <span>{group.title}</span>
                                {hasItems && (
                                    <ChevronRight 
                                        className={`h-3 w-3 transition-transform duration-200 ${
                                            isOpen ? 'rotate-90' : ''
                                        } ${rtl ? 'rotate-180' : ''}`} 
                                    />
                                )}
                            </div>
                        </SidebarGroupLabel>
                        {hasItems && isOpen && (
                            <SidebarGroupContent className="mt-1">
                                <SidebarMenu className="space-y-0">
                                    {group.items.map((item, itemIndex) => {
                                        const itemUrl = typeof item.href === 'string' ? item.href : item.href.url;
                                        const normalizedUrl = normalizeUrl(page.url);
                                        const normalizedItemUrl = normalizeUrl(itemUrl);
                                        // For dashboard, only match exact URL, not sub-paths
                                        const isDashboard = normalizedItemUrl === '/dashboard' || normalizedItemUrl.endsWith('/dashboard');
                                        const isActive = isDashboard 
                                            ? normalizedUrl === normalizedItemUrl 
                                            : normalizedUrl === normalizedItemUrl || normalizedUrl.startsWith(normalizedItemUrl + '/');
                                        
                                        const IconComponent = item.icon;
                                        return (
                                            <SidebarMenuItem key={`${item.title}-${itemIndex}`}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    className="font-normal hover:font-medium data-[active=true]:font-medium data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-slate-700/50 dark:hover:text-primary transition-all duration-200 h-7 px-1.5 text-slate-800 dark:text-slate-200 dark:data-[active=true]:!bg-primary-gradient dark:data-[active=true]:!text-white dark:[&[data-active=true]_*]:!text-white"
                                                    suppressHydrationWarning
                                                >
                                                    <Link href={item.href} prefetch={false}>
                                                        {IconComponent && <IconComponent className={`h-3.5 w-3.5 ${rtl ? "ml-1" : "mr-1"}`} />}
                                                        <span className="text-xs">{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>
                );
            })}
        </>
    );
}
