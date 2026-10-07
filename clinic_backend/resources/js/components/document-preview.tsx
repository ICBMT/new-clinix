import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download, File as FileIcon, FileText, Image as ImageIcon, X, LoaderCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface DocumentPreviewProps {
    file?: {
        id?: number;
        file_name: string;
        file_url?: string;
        file_type?: string;
        mime_type?: string;
        collection_name?: string;
        size?: number;
        created_at?: string;
    } | File | null;
    collectionName?: string;
    onRemove?: () => void;
    showRemove?: boolean;
    className?: string;
}

export function DocumentPreview({ 
    file, 
    collectionName, 
    onRemove, 
    showRemove = false,
    className = '' 
}: DocumentPreviewProps) {
    const { t } = useTranslation();
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    if (!file) return null;

    // Determine if file is a File object or a document object
    const isFileObject = file instanceof File;
    const fileName = isFileObject ? file.name : (file.file_name || 'document');
    
    // Create blob URL for File objects only once
    useEffect(() => {
        if (isFileObject && file instanceof File) {
            const url = URL.createObjectURL(file);
            setBlobUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setBlobUrl(null);
        }
    }, [isFileObject, file]);
    
    const fileUrl = isFileObject ? (blobUrl || '') : (file.file_url || '');
    const fileType = isFileObject 
        ? (file.type?.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'other')
        : (file.file_type || (file.mime_type?.startsWith('image/') ? 'image' : file.mime_type === 'application/pdf' ? 'pdf' : 'other'));
    
    // Check if it's an image by extension or type
    const isImage = fileType === 'image' || 
        /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName) ||
        (isFileObject && file.type?.startsWith('image/'));
    
    const isPdf = fileType === 'pdf' || 
        /\.pdf$/i.test(fileName) ||
        (isFileObject && file.type === 'application/pdf');

    const displayName = fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
    const fileSize = isFileObject ? file.size : (file.size || 0);
    const formattedSize = fileSize > 0 ? (fileSize / 1024).toFixed(1) + ' KB' : '';

    return (
        <div className={`group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all ${className}`}>
            {/* Preview Section - Compact */}
            {isImage && fileUrl ? (
                <div className="relative w-full h-32 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                    <img 
                        src={fileUrl} 
                        alt={displayName}
                        className={`w-full h-full object-cover transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => setImageLoading(false)}
                        onError={(e) => {
                            setImageError(true);
                            setImageLoading(false);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                        }}
                    />
                    {imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <ImageIcon className="h-8 w-8 text-slate-400" />
                        </div>
                    )}
                </div>
            ) : isPdf ? (
                <div className="w-full h-32 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex flex-col items-center justify-center relative">
                    <FileText className="h-10 w-10 text-red-400 dark:text-red-500 mb-1" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">PDF</span>
                </div>
            ) : (
                <div className="w-full h-32 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 flex flex-col items-center justify-center">
                    <FileIcon className="h-10 w-10 text-purple-400 dark:text-purple-500 mb-1" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('document') || 'Document'}</span>
                </div>
            )}

            {/* Document Info - Compact */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" title={fileName}>
                            {displayName}
                        </p>
                        {collectionName && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {t(collectionName) || collectionName
                                    .replace(/_/g, ' ')
                                    .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(' ')}
                            </p>
                        )}
                        {formattedSize && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formattedSize}
                            </p>
                        )}
                    </div>
                    {showRemove && onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                            title={t('remove') || 'Remove'}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
                
                {/* Action Buttons - Compact */}
                <div className="flex items-center gap-1.5">
                    {fileUrl && (
                        <>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                                className="flex-1 text-xs h-7 px-2"
                            >
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" />
                                    {t('view') || 'View'}
                                </a>
                            </Button>
                            <Button 
                                variant="default" 
                                size="sm" 
                                asChild
                                className="flex-1 text-xs h-7 px-2"
                            >
                                <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-3 w-3 mr-1" />
                                    {t('download') || 'Download'}
                                </a>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

