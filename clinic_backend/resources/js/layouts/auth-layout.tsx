import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { BaseLayout } from './base-layout';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <BaseLayout>
            <AuthLayoutTemplate title={title} description={description} {...props}>
                {children}
            </AuthLayoutTemplate>
        </BaseLayout>
    );
}
