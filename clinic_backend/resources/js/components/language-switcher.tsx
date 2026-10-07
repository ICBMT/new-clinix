import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { usePage } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { router } from '@inertiajs/react';
import { type PageProps } from '@/types';

export function LanguageSwitcher() {
    const page = usePage<PageProps>();
    const { locale, rtl } = page.props;
    const { t } = useTranslation();

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ar', name: 'العربية', flag: '🇰🇼' },
    ];

    const switchLanguage = (locale: string) => {
        // Store current URL and step before switching
        const currentUrl = window.location.pathname + window.location.search;
        const currentStep = sessionStorage.getItem('registerCurrentStep');
        
        router.post(`/language/${locale}`, {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Restore step if on register page
                if (currentUrl.includes('/register') && currentStep) {
                    sessionStorage.setItem('registerCurrentStep', currentStep);
                }
                // Always reload page after language switch to ensure layout is properly updated
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        });
    };

    const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

    return (
        <div className="flex items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-9 px-3 flex items-center gap-2 hover:bg-accent/50 transition-colors ${rtl ? 'flex-row-reverse' : ''}`}
                    >
                        <Globe className="h-4 w-4" />
                        <span className="text-sm font-medium">{currentLanguage.flag}</span>
                        <span className="sr-only">{t('switch_language')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-2">
                    {languages.map((language) => (
                        <DropdownMenuItem
                            key={language.code}
                            onClick={() => switchLanguage(language.code)}
                            className={`flex items-center gap-3 cursor-pointer px-4 mb-1 last:mb-0 rounded-md transition-colors hover:bg-accent/50 ${
                                locale === language.code ? 'bg-accent' : ''
                            } ${rtl ? 'flex-row-reverse' : ''}`}
                        >
                            <span className="text-lg">{language.flag}</span>
                            <span className="flex-1 text-sm">{language.name}</span>
                            {locale === language.code && (
                                <span className="text-xs text-muted-foreground">✓</span>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}