<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Media extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'file_name',
        'file_type',
        'mediable_type',
        'mediable_id',
        'collection_name',
        'disk',
        'size',
    ];

    protected $visible = [
        'id',
        'file_name',
        'file_type',
        'mediable_id',
        'mediable_type',
        'created_at',
        'collection_name',
        'disk',
        'size',
    ];

    protected $appends = [
        'name',
        'file_path',
        'mime_type',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    /**
     * Get the parent mediable model
     */
    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope for media by collection
     */
    public function scopeByCollection($query, string $collection)
    {
        return $query->where('collection_name', $collection);
    }

    /**
     * Scope for media by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('mediable_type', $type);
    }

    /**
     * Scope for ordered media
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_column', 'asc');
    }

    /**
     * Get the full URL for the media file
     * Since file_name now stores the full URL, return it directly
     */
    public function getUrlAttribute(): ?string
    {
        // file_name already contains the full URL
        return $this->file_name;
    }

    /**
     * Get name attribute (alias for file_name for frontend compatibility)
     */
    public function getNameAttribute(): ?string
    {
        return $this->file_name;
    }

    /**
     * Get file_path attribute (alias for url for frontend compatibility)
     */
    public function getFilePathAttribute(): ?string
    {
        return $this->url ?? $this->file_name;
    }

    /**
     * Get mime_type attribute (alias for file_type for frontend compatibility)
     */
    public function getMimeTypeAttribute(): ?string
    {
        return $this->file_type;
    }

    /**
     * Determine file type from file name/extension
     */
    public static function determineFileType(?string $fileName): ?string
    {
        if (!$fileName) {
            return null;
        }

        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'];
        $pdfTypes = ['pdf'];
        $documentTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'];
        $videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
        $audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];

        if (in_array($extension, $imageTypes)) {
            return 'image';
        } elseif (in_array($extension, $pdfTypes)) {
            return 'pdf';
        } elseif (in_array($extension, $documentTypes)) {
            return 'document';
        } elseif (in_array($extension, $videoTypes)) {
            return 'video';
        } elseif (in_array($extension, $audioTypes)) {
            return 'audio';
        }

        return 'other';
    }

    /**
     * Boot method to auto-set file_type when creating/updating
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($media) {
            if (!$media->file_type && $media->file_name) {
                $media->file_type = self::determineFileType($media->file_name);
            }
        });

        static::updating(function ($media) {
            if ($media->isDirty('file_name') && !$media->file_type) {
                $media->file_type = self::determineFileType($media->file_name);
            }
        });
    }
}