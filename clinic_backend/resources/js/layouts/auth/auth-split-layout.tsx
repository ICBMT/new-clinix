import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    useRTLInit();
    const { isRTL } = useRTL();
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className={cn("relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r", isRTL && "lg:border-l lg:border-r-0")}>
                <div className="absolute inset-0 bg-zinc-900" />
                <Link
                    href={home()}
                    className={cn("relative z-20 flex items-center text-lg font-medium", isRTL && "flex-row-reverse")}
                >
                    <AppLogoIcon className={cn("size-8 fill-current text-white", isRTL ? "ml-2" : "mr-2")} />
                    {name}
                </Link>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className={cn("space-y-2", isRTL && "text-right")}>
                            <p className={cn("text-lg", isRTL && "text-right")}>
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className={cn("text-sm text-neutral-300", isRTL && "text-right")}>
                                {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <AppLogoIcon className="h-10 fill-current text-black sm:h-12" />
                    </Link>
                    <div className={cn("flex flex-col gap-2", isRTL ? "items-end text-right sm:items-end sm:text-right" : "items-start text-left sm:items-center sm:text-center")}>
                        <h1 className={cn("text-xl font-medium", isRTL && "text-right")}>{title}</h1>
                        <p className={cn("text-sm text-balance text-muted-foreground", isRTL && "text-right")}>
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
