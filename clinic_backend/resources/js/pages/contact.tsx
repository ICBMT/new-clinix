import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRTLInit } from '@/hooks/use-rtl-init';
import { useRTL } from '@/hooks/use-rtl';
import { useTranslation } from '@/hooks/use-translation';
import FrontendLayout from '@/layouts/frontend-layout';
import { type SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Contact() {
    useRTLInit();
    const { t, locale } = useTranslation();
    const page = usePage<SharedData>();
    const { locale: pageLocale } = page.props;
    
    // Force RTL detection from page props
    const isRTL = pageLocale === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
    
    const { 
        iconMargin, 
        getFieldDir, 
        getInputTextAlign 
    } = useRTL();
    
    const { siteSettings } = page.props;

    // Get contact info from site settings - prioritize contact_* keys, fallback to support_* keys
    const contactEmail =
        siteSettings?.contact_email ||
        siteSettings?.support_email ||
        t('default_contact_email');
    const contactPhone =
        siteSettings?.contact_phone ||
        siteSettings?.support_phone ||
        t('default_contact_phone');

    // Get address with proper locale fallback
    const contactAddress =
        siteSettings?.[`contact_address_${locale}`] ||
        siteSettings?.[`support_address_${locale}`] ||
        (isRTL
            ? siteSettings?.contact_address_ar ||
              siteSettings?.support_address_ar
            : siteSettings?.contact_address_en ||
              siteSettings?.support_address_en) ||
        t('default_contact_address');

    // Contact form
    const { data, setData, post, processing, errors, reset } = useForm({
        full_name: '',
        email: '',
        phone: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/contact', {
            onSuccess: () => {
                toast.success(t('message_sent_successfully'), {
                    description: t('we_will_get_back_to_you_soon'),
                });
                reset();
            },
            onError: () => {
                toast.error(t('failed_to_send_message'), {
                    description: t('please_try_again_later'),
                });
            },
        });
    };

    return (
        <FrontendLayout title={t('contact_us')}>
            <div className="flex flex-1 items-center justify-center p-6 pt-24 pb-32" dir={dir}>
                <div className="mx-auto w-full max-w-6xl">
                    {/* Main Heading - Keep centered */}
                    <h1 className="mb-8 text-center text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {t('contact_us')}
                    </h1>

                    {/* Two Column Layout - Reverses in RTL */}
                    <div className={cn("grid grid-cols-1 gap-8 lg:flex", flexDirection)} dir={dir}>
                        {/* Contact Information Section */}
                        <div className={cn("space-y-6 w-full lg:w-1/2", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                            <h2 className={cn("mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                {t('get_in_touch')}
                            </h2>

                            <div className="space-y-4">
                                {/* Email Card */}
                                <Card className={cn("bg-white/80 backdrop-blur-sm dark:bg-slate-800/80", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                    <CardHeader className={isRTL ? "!text-right" : "!text-left"}>
                                        <CardTitle className={cn("flex items-center gap-2 text-slate-900 dark:text-slate-100", flexDirection, isRTL ? "!text-right" : "!text-left")}>
                                            <Mail className="h-5 w-5" />
                                            {t('email')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className={isRTL ? "!text-right" : "!text-left"}>
                                        <p className="text-slate-900 dark:text-slate-100" dir="ltr">
                                            {contactEmail}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Phone Card */}
                                <Card className={cn("bg-white/80 backdrop-blur-sm dark:bg-slate-800/80", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                    <CardHeader className={isRTL ? "!text-right" : "!text-left"}>
                                        <CardTitle className={cn("flex items-center gap-2 text-slate-900 dark:text-slate-100", flexDirection, isRTL ? "!text-right" : "!text-left")}>
                                            <Phone className="h-5 w-5" />
                                            {t('phone')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className={isRTL ? "!text-right" : "!text-left"}>
                                        <p className="text-slate-900 dark:text-slate-100" dir="ltr">
                                            {contactPhone}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Address Card */}
                                <Card className={cn("bg-white/80 backdrop-blur-sm dark:bg-slate-800/80", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                    <CardHeader className={isRTL ? "!text-right" : "!text-left"}>
                                        <CardTitle className={cn("flex items-center gap-2 text-slate-900 dark:text-slate-100", flexDirection, isRTL ? "!text-right" : "!text-left")}>
                                            <MapPin className="h-5 w-5" />
                                            {t('address')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className={isRTL ? "!text-right" : "!text-left"}>
                                        <p className={cn("text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                            {contactAddress}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Contact Form Section */}
                        <div className={cn("w-full lg:w-1/2", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                            <Card className={cn("border border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/80", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                <CardHeader className={isRTL ? "!text-right" : "!text-left"}>
                                    <CardTitle className={cn("text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                        {t('send_us_message')}
                                    </CardTitle>
                                    <CardDescription className={cn("text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}>
                                        {t('contact_form_description')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className={isRTL ? "!text-right" : "!text-left"}>
                                    <form
                                        onSubmit={handleSubmit}
                                        className={cn("space-y-4", isRTL ? "!text-right" : "!text-left")}
                                        dir={dir}
                                    >
                                        {/* Full Name Field */}
                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label
                                                htmlFor="full_name"
                                                className={cn("block text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}
                                            >
                                                {t('full_name')}
                                            </Label>
                                            <Input
                                                id="full_name"
                                                type="text"
                                                value={data.full_name}
                                                onChange={(e) => setData('full_name', e.target.value)}
                                                placeholder={t('enter_full_name')}
                                                required
                                                maxLength={30}
                                                dir={getFieldDir('text')}
                                                className={cn(
                                                    "!border-2 !border-slate-300 focus-visible:!border-primary dark:!border-slate-600",
                                                    getInputTextAlign('text')
                                                )}
                                            />
                                            {errors.full_name && (
                                                <p className={cn("text-sm text-red-500 dark:text-red-400", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                                    {errors.full_name}
                                                </p>
                                            )}
                                            {data.full_name.length >= 30 && (
                                                <p className={cn("text-sm text-red-500 dark:text-red-400", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                                    {t('name_max_length').replace(':max', '30')}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email Field */}
                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label
                                                htmlFor="email"
                                                className={cn("block text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}
                                            >
                                                {t('email_address')}
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder={t('email_example')}
                                                required
                                                dir={getFieldDir('email')}
                                                className={cn(
                                                    "!border-2 !border-slate-300 focus-visible:!border-primary dark:!border-slate-600",
                                                    getInputTextAlign('email')
                                                )}
                                            />
                                            {errors.email && (
                                                <p className={cn("text-sm text-red-500 dark:text-red-400", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        {/* Phone Field */}
                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label
                                                htmlFor="phone"
                                                className={cn("block text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}
                                            >
                                                {t('phone_number')}
                                            </Label>
                                            <PhoneInput
                                                id="phone"
                                                value={data.phone}
                                                onChange={(value) => setData('phone', value)}
                                                required
                                                dir={getFieldDir('phone')}
                                                className={cn(
                                                    "!border-2 !border-slate-300 focus-visible:!border-primary dark:!border-slate-600",
                                                    getInputTextAlign('phone')
                                                )}
                                            />
                                            <p className={cn("text-xs text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                                {t('phone_format_hint')}
                                            </p>
                                            {errors.phone && (
                                                <p className={cn("text-sm text-red-500 dark:text-red-400", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                                    {errors.phone}
                                                </p>
                                            )}
                                        </div>

                                        {/* Message Field */}
                                        <div className={cn("space-y-2", isRTL ? "!text-right" : "!text-left")}>
                                            <Label
                                                htmlFor="message"
                                                className={cn("block text-slate-900 dark:text-slate-100", isRTL ? "!text-right" : "!text-left")}
                                            >
                                                {t('message')}
                                            </Label>
                                            <Textarea
                                                id="message"
                                                value={data.message}
                                                onChange={(e) => setData('message', e.target.value)}
                                                placeholder={t('enter_message')}
                                                rows={4}
                                                required
                                                dir={getFieldDir('textarea')}
                                                className={cn(
                                                    "!border-2 !border-slate-300 focus-visible:!border-primary dark:!border-slate-600",
                                                    getInputTextAlign('textarea')
                                                )}
                                            />
                                            {errors.message && (
                                                <p className={cn("text-sm text-red-500 dark:text-red-400", isRTL ? "!text-right" : "!text-left")} dir={dir}>
                                                    {errors.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className={cn("bg-primary-gradient w-full hover:opacity-90", flexDirection)}
                                        >
                                            <Send className={cn("h-4 w-4", iconMargin('md'))} />
                                            {processing ? t('sending') : t('send_message')}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </FrontendLayout>
    );
}
