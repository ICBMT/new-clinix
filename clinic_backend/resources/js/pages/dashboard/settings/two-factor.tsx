import HeadingSmall from '@/components/heading-small';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useTranslation } from '@/hooks/use-translation';
import { useRTL } from '@/hooks/use-rtl';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/dashboard/settings-layout';
import { disable, enable } from '@/routes/two-factor';
import { show } from '@/routes/dashboard/two-factor';
import { type BreadcrumbItem } from '@/types';
import { Form, Head } from '@inertiajs/react';
import { ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TwoFactorProps {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
}

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: TwoFactorProps) {
    useRTLInit();
    const { t, locale } = useTranslation();
    const { isRTL, dir, textAlign, flexDirection, iconMargin } = useRTL();
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('two_factor_authentication'),
            href: show.url(),
        },
    ];
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('two_factor_authentication')} />
            <SettingsLayout>
                <div className={cn("space-y-6", textAlign)} dir={dir}>
                    <HeadingSmall
                        title={t('two_factor_authentication')}
                        description={t('two_factor_description')}
                    />
                    {twoFactorEnabled ? (
                        <div className={cn("flex flex-col items-start justify-start space-y-4", textAlign)}>
                            <Badge variant="default" className={textAlign}>{t('enabled')}</Badge>
                            <p className={cn("text-muted-foreground", textAlign)} dir={dir}>
                                {t('two_factor_enabled_description')}
                            </p>

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={recoveryCodesList}
                                fetchRecoveryCodes={fetchRecoveryCodes}
                                errors={errors}
                            />

                            <div className="relative inline">
                                <Form {...disable.form()}>
                                    {({ processing }) => (
                                        <Button
                                            variant="destructive"
                                            type="submit"
                                            disabled={processing}
                                            className={flexDirection}
                                        >
                                            <ShieldBan className={cn("h-4 w-4", iconMargin('md'))} />
                                            {t('disable_2fa')}
                                        </Button>
                                    )}
                                </Form>
                            </div>
                        </div>
                    ) : (
                        <div className={cn("flex flex-col items-start justify-start space-y-4", textAlign)}>
                            <Badge variant="destructive" className={textAlign}>{t('disabled')}</Badge>
                            <p className={cn("text-muted-foreground", textAlign)} dir={dir}>
                                {t('two_factor_disabled_description')}
                            </p>

                            <div>
                                {hasSetupData ? (
                                    <Button
                                        onClick={() => setShowSetupModal(true)}
                                        className={flexDirection}
                                    >
                                        <ShieldCheck className={cn("h-4 w-4", iconMargin('md'))} />
                                        {t('continue_setup')}
                                    </Button>
                                ) : (
                                    <Form
                                        {...enable.form()}
                                        onSuccess={() =>
                                            setShowSetupModal(true)
                                        }
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className={flexDirection}
                                            >
                                                <ShieldCheck className={cn("h-4 w-4", iconMargin('md'))} />
                                                {t('enable_2fa')}
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </div>
                        </div>
                    )}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
