import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useTranslation } from '@/hooks/use-translation';
import { logout } from '@/routes';
import { edit } from '@/routes/dashboard/profile';
import { type User, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { resetAutoSetup } from '@/utils/auto-notification-setup';

interface UserMenuContentProps {
    user: User | null;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { rtl } = page.props;

    const handleLogout = async () => {
        cleanup();
        
        // Get device token from localStorage (current session only)
        let token: string | null = null;
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                token = localStorage.getItem('fcm_device_token');
            }
        } catch (e) {
            console.warn('Failed to get FCM token from localStorage:', e);
        }
        
        // Reset auto-setup
        resetAutoSetup();
        
        // Send logout request with device token (current session only)
        router.post(logout(), token ? { device_token: token } : {}, {
            onSuccess: () => {
                // Clear token from localStorage after logout
                try {
                    if (typeof window !== 'undefined' && window.localStorage) {
                        localStorage.removeItem('fcm_device_token');
                    }
                } catch (e) {
                    console.warn('Failed to remove FCM token from localStorage:', e);
                }
                
                router.flushAll();
                // Reload page after logout to reset layout
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        });
    };

    // Return null if user is not provided
    if (!user) {
        return null;
    }

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full"
                        href={edit()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className={rtl ? "ml-2" : "mr-2"} />
                        {t('settings')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button
                    className="flex items-center w-full cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                    }}
                    data-test="logout-button"
                >
                    <LogOut className={rtl ? "ml-2" : "mr-2"} />
                    {t('logout')}
                </button>
            </DropdownMenuItem>
        </>
    );
}
