import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone } from 'lucide-react';
import { useRTL } from '@/hooks/use-rtl';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';

interface UserCardProps {
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
        email_verified_at?: string | null;
        phone_verified_at?: string | null;
        roles?: Array<{ id: number; name: string }>;
    };
    showVerificationBadges?: boolean;
    variant?: 'default' | 'card' | 'compact';
    className?: string;
}

export function UserCard({ 
    user, 
    showVerificationBadges = false, 
    variant = 'default',
    className = '' 
}: UserCardProps) {
    // Get RTL utilities
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const { flexDirection, textAlign, iconMargin } = useRTL();
    const textAlignClass = isRTL ? '!text-right' : '!text-left';
    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate avatar URL (you can replace this with actual avatar logic)
    const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;

    // Card variant - matches the image description
    if (variant === 'card') {
        const avatarElement = (
            <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-red-500 text-white font-semibold text-lg">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
        );

        const userInfoElement = (
            <div className={cn("flex flex-col gap-1 flex-1 min-w-0", textAlignClass)}>
                {/* Name */}
                <div className={cn("font-semibold text-base text-foreground", textAlignClass)}>
                    {user.name}
                </div>

                {/* Email */}
                {user.email ? (
                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                        <Mail className={cn("h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400")} />
                        <span className="truncate">{user.email}</span>
                        {showVerificationBadges && user.email_verified_at && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                                ✓
                            </Badge>
                        )}
                    </div>
                ) : (
                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                        <span className="truncate">N/A</span>
                    </div>
                )}

                {/* Phone */}
                {user.phone && (
                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", flexDirection)}>
                        <Phone className={cn("h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400")} />
                        <span className="truncate font-mono">{user.phone}</span>
                        {showVerificationBadges && user.phone_verified_at && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                                ✓
                            </Badge>
                        )}
                    </div>
                )}

                {/* Roles */}
                {user.roles && user.roles.length > 0 && (
                    <div className={cn("flex gap-1 mt-1", flexDirection)}>
                        {user.roles.map((role) => (
                            <Badge key={role.id} variant="outline" className={cn("text-xs", textAlignClass)}>
                                {role.name}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        );

        return (
            <div className={cn("bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700", className)} dir={dir}>
                <div className={cn("flex items-center gap-4", isRTL ? 'flex-row-reverse' : '')}>
                    {avatarElement}
                    {userInfoElement}
                </div>
            </div>
        );
    }

    // Compact variant
    if (variant === 'compact') {
        const avatarElement = (
            <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
        );

        const userInfoElement = (
            <div className={cn("flex flex-col min-w-0", textAlignClass)}>
                <div className={cn("font-medium text-sm text-foreground truncate", textAlignClass)}>
                    {user.name}
                </div>
                <div className={cn("text-xs text-muted-foreground truncate", textAlignClass)}>
                    {user.email}
                </div>
            </div>
        );

        return (
            <div className={cn("flex items-center gap-2", isRTL ? 'flex-row-reverse' : '', className)} dir={dir}>
                {avatarElement}
                {userInfoElement}
            </div>
        );
    }

    // Default variant (original)
    const avatarElement = (
        <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(user.name)}
            </AvatarFallback>
        </Avatar>
    );

    const userInfoElement = (
        <div className={cn("flex flex-col min-w-0", textAlignClass)}>
            {/* Name */}
            <div className={cn("font-medium text-foreground truncate", textAlignClass)}>
                {user.name}
            </div>

            {/* Email */}
            {user.email ? (
                <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", flexDirection)}>
                    <Mail className={cn("h-3.5 w-3.5 flex-shrink-0")} />
                    <span className="truncate">{user.email}</span>
                    {showVerificationBadges && user.email_verified_at && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                            ✓
                        </Badge>
                    )}
                </div>
            ) : (
                <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", flexDirection)}>
                    <span className="truncate">N/A</span>
                </div>
            )}

            {/* Phone */}
            {user.phone && (
                <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", flexDirection)}>
                    <Phone className={cn("h-3.5 w-3.5 flex-shrink-0")} />
                    <span className="truncate font-mono">{user.phone}</span>
                    {showVerificationBadges && user.phone_verified_at && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                            ✓
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className={cn("flex items-center gap-3", isRTL ? 'flex-row-reverse' : '', className)} dir={dir}>
            {avatarElement}
            {userInfoElement}
        </div>
    );
}

