import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { XCircle } from 'lucide-react';

interface RejectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    title?: string;
    description?: string;
}

export function RejectionDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
}: RejectionDialogProps) {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
            setReason('');
            onOpenChange(false);
        }
    };

    const handleCancel = () => {
        setReason('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border-red-200">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-xl">
                            {title || t('reject_vendor')}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-base pt-2">
                        {description || t('rejection_dialog_description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">{t('rejection_reason')}</Label>
                        <Textarea
                            id="reason"
                            placeholder={t('enter_rejection_reason')}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {t('reject')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
