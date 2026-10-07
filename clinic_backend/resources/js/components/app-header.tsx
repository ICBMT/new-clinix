import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationIcon } from '@/components/notification-icon';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { index as dashboard } from '@/routes/dashboard';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage, router } from '@inertiajs/react';
import { Globe, LayoutGrid, Menu, Search } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';

const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth, rtl, locale } = page.props;
    const getInitials = useInitials();
    const { t } = useTranslation();
    
    const mainNavItems: NavItem[] = [
        {
            title: t('dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    const rightNavItems: NavItem[] = [];
    // const rightNavItems: NavItem[] = [
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

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ar', name: 'العربية', flag: '🇰🇼' },
    ];

    const switchLanguage = (locale: string) => {
        router.post(`/language/${locale}`);
    };
    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Left side: Mobile Menu and Language Switcher */}
                    <div className={`flex items-center ${rtl ? 'flex-row-reverse' : ''} space-x-2 ${rtl ? 'space-x-reverse' : ''}`}>
                        {/* Mobile Menu */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-[34px] w-[34px] ${rtl ? 'ml-2' : 'mr-2'}`}
                                    >
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    {t('navigation_menu')}
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <Icon
                                                            iconNode={item.icon}
                                                            className="h-5 w-5"
                                                        />
                                                    )}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="flex flex-col space-y-4">
                                            <div className="flex items-center space-x-2 font-medium">
                                                <Globe className="h-5 w-5" />
                                                <span>{t('language')}</span>
                                            </div>
                                            {languages.map((language) => (
                                                <button
                                                    key={language.code}
                                                    onClick={() => switchLanguage(language.code)}
                                                    className={`flex items-center space-x-2 font-medium text-left w-full p-2 rounded-md hover:bg-accent ${
                                                        locale === language.code ? 'bg-accent' : ''
                                                    }`}
                                                >
                                                    <span className="text-lg">{language.flag}</span>
                                                    <span>{language.name}</span>
                                                    {locale === language.code && (
                                                        <span className="text-xs text-muted-foreground ml-auto">✓</span>
                                                    )}
                                                </button>
                                            ))}
                                            {rightNavItems.map((item) => (
                                                <a
                                                    key={item.title}
                                                    href={
                                                        typeof item.href ===
                                                        'string'
                                                            ? item.href
                                                            : item.href.url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <Icon
                                                            iconNode={item.icon}
                                                            className="h-5 w-5"
                                                        />
                                                    )}
                                                    <span>{item.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                        </div>
                        
                        {/* Language Switcher - Next to sidebar, opposite to sidebar */}
                        <LanguageSwitcher />
                        
                        {/* Notification Icon - Next to language switcher */}
                        <NotificationIcon />
                    </div>

                    <div className={`${rtl ? 'ml-auto' : 'mr-auto'} flex items-center space-x-2 ${rtl ? 'space-x-reverse' : ''}`}>
                        <Link
                            href={dashboard()}
                            prefetch
                            className="flex items-center space-x-2"
                        >
                            <AppLogo />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className={`${rtl ? 'mr-6' : 'ml-6'} hidden h-full items-center space-x-6 lg:flex ${rtl ? 'space-x-reverse' : ''}`}>
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem
                                        key={index}
                                        className="relative flex h-full items-center"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                page.url ===
                                                    (typeof item.href ===
                                                    'string'
                                                        ? item.href
                                                        : item.href.url) &&
                                                    activeItemStyles,
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            {item.icon && (
                                                <Icon
                                                    iconNode={item.icon}
                                                    className="mr-2 h-4 w-4"
                                                />
                                            )}
                                            {item.title}
                                        </Link>
                                        {page.url === item.href && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                        </div>
                    </div>

                    <div className={`${rtl ? 'ml-auto' : 'mr-auto'} flex items-center space-x-2 ${rtl ? 'space-x-reverse' : ''}`}>
                        <div className="relative flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="group h-9 w-9 cursor-pointer"
                            >
                                <Search className="!size-5 opacity-80 group-hover:opacity-100" />
                            </Button>
                            <div className="hidden lg:flex">
                                {rightNavItems.map((item) => (
                                    <TooltipProvider
                                        key={item.title}
                                        delayDuration={0}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <a
                                                    href={
                                                        typeof item.href ===
                                                        'string'
                                                            ? item.href
                                                            : item.href.url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium text-accent-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <span className="sr-only">
                                                        {item.title}
                                                    </span>
                                                    {item.icon && (
                                                        <Icon
                                                            iconNode={item.icon}
                                                            className="size-5 opacity-80 group-hover:opacity-100"
                                                        />
                                                    )}
                                                </a>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{item.title}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-full p-1"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className={`mx-auto flex h-12 w-full items-center ${rtl ? 'flex-row-reverse justify-end' : 'justify-start'} px-4 text-neutral-500 md:max-w-7xl`}>
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
