import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ViewLayout, ViewDetailsSection, ViewFieldWithIcon } from '@/components/view';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import { index as dashboard } from '@/routes/dashboard';
import { Link } from '@inertiajs/react';
import { Calendar, Heart, User, Tag } from 'lucide-react';
import { formatHumanDate } from '@/utils/date-utils';

interface Favorite {
    id: number;
    user_id: number;
    favoritable_type: string;
    favoritable_id: number;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    favoritable?: {
        id: number;
        name?: string;
        name_en?: string;
        name_ar?: string;
        title?: string;
    };
}

interface ShowFavoriteProps {
    favorite: Favorite;
}

export default function ShowFavorite({ favorite }: ShowFavoriteProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard'),
            href: dashboard.url(),
        },
        {
            title: t('favorites'),
            href: '/dashboard/favorites',
        },
        {
            title: t('favorite_details'),
            href: '#',
        },
    ];

    const getFavoritableName = () => {
        if (!favorite.favoritable) return `#${favorite.favoritable_id}`;
        const item = favorite.favoritable;
        if (item.name) return item.name;
        if (item.name_en || item.name_ar) {
            return isRTL ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar);
        }
        if (item.title) return item.title;
        return `#${favorite.favoritable_id}`;
    };

    const getTypeName = () => {
        const type = favorite.favoritable_type;
        return type.split('\\').pop() || type;
    };

    return (
        <ViewLayout
            breadcrumbs={breadcrumbs}
            title={t('favorite_details')}
            description={`#${favorite.id}`}
            backUrl="/dashboard/favorites"
            headTitle={`${t('favorite_details')} - #${favorite.id}`}
        >
            <ViewDetailsSection title={t('basic_information')} icon={Heart}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ViewFieldWithIcon
                        label={t('user')}
                        value={
                            favorite.user ? (
                                <Link 
                                    href={`/dashboard/users/${favorite.user.id}`}
                                    className="text-primary hover:underline"
                                >
                                    {favorite.user.name}
                                </Link>
                            ) : (
                                '—'
                            )
                        }
                        icon={User}
                    />
                    <ViewFieldWithIcon
                        label={t('type')}
                        value={<Badge variant="secondary">{getTypeName()}</Badge>}
                        icon={Tag}
                    />
                    <ViewFieldWithIcon
                        label={t('favorited_item')}
                        value={getFavoritableName()}
                        icon={Heart}
                        spanCols={2}
                    />
                    <ViewFieldWithIcon
                        label={t('created_at')}
                        value={formatHumanDate(favorite.created_at, t)}
                        icon={Calendar}
                    />
                    <ViewFieldWithIcon
                        label={t('updated_at')}
                        value={formatHumanDate(favorite.updated_at, t)}
                        icon={Calendar}
                    />
                </div>
            </ViewDetailsSection>
        </ViewLayout>
    );
}

