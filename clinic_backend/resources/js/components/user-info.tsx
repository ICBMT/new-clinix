import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User | null;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();
    const { rtl } = usePage<SharedData>().props;

    // Return null if user is not provided
    if (!user) {
        return null;
    }

    return (
        <>
            <Avatar className={`h-7 w-7 overflow-hidden rounded-full ${rtl ? "order-2" : ""}`}>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className={`grid flex-1 text-xs leading-tight ${rtl ? "order-1 text-right" : "text-left"}`}>
                <span className="truncate font-normal">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
