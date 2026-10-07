<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class MediaService
{
    /**
     * Create a new media record
     *
     * @param array $data
     * @return Media
     */
    public function createMedia(array $data): Media
    {
        // Set default values
        $data['disk'] = $data['disk'] ?? 'public';
        
        // Map collection to collection_name if needed
        if (isset($data['collection']) && !isset($data['collection_name'])) {
            $data['collection_name'] = $data['collection'];
            unset($data['collection']);
        }
        
        // Generate URL if file_path is provided
        if (isset($data['file_path']) && !isset($data['file_name'])) {
            // For public disk, use asset() to generate full URL
            $disk = $data['disk'] ?? 'public';
            if ($disk === 'public') {
                $url = asset('storage/' . $data['file_path']);
            } else {
                // For other disks, construct URL manually
                $url = url('storage/' . $data['file_path']);
            }
            $data['file_name'] = $url; // Store full URL in database
        }

        return Media::create($data);
    }

    /**
     * Upload file and create media record
     *
     * @param UploadedFile $file
     * @param string $path
     * @param array $options
     * @return Media
     */
    public function uploadAndCreateMedia(UploadedFile $file, string $path = 'media', array $options = []): Media
    {
        // Store the file
        $filePath = $file->store($path, $options['disk'] ?? 'public');
        $disk = $options['disk'] ?? 'public';

        // Get the URL - ensure it's a full URL with domain
        // For public disk, use asset() to generate full URL
        if ($disk === 'public') {
            $url = asset('storage/' . $filePath);
        } else {
            // For other disks, construct URL manually
            $url = url('storage/' . $filePath);
        }

        // Create media record with full URL stored in file_name
        return $this->createMedia([
            'file_path' => $filePath,
            'file_name' => $url, // Store full URL in database
            'file_type' => $this->getFileType($file->getMimeType()),
            'collection' => $options['collection'] ?? 'default',
            'disk' => $disk,
            'size' => $file->getSize(),
            'mediable_type' => $options['mediable_type'] ?? null,
            'mediable_id' => $options['mediable_id'] ?? null,
        ]);
    }

    /**
     * Delete media record and file
     *
     * @param Media $media
     * @return bool
     */
    public function deleteMedia(Media $media): bool
    {
        // Delete file from storage
        if ($media->file_path && Storage::disk($media->disk)->exists($media->file_path)) {
            Storage::disk($media->disk)->delete($media->file_path);
        }

        // Delete media record
        return $media->delete();
    }

    /**
     * Get file type based on MIME type
     *
     * @param string $mimeType
     * @return string
     */
    private function getFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }

        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }

        if (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        }

        if (str_starts_with($mimeType, 'application/pdf')) {
            return 'document';
        }

        return 'file';
    }

    /**
     * Get media by ID
     *
     * @param int $id
     * @return Media|null
     */
    public function getMedia(int $id): ?Media
    {
        return Media::find($id);
    }

    /**
     * Get media for a specific model
     *
     * @param string $mediableType
     * @param int $mediableId
     * @param string|null $collection
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getMediaForModel(string $mediableType, int $mediableId, ?string $collection = null)
    {
        $query = Media::where('mediable_type', $mediableType)
            ->where('mediable_id', $mediableId);

        if ($collection) {
            $query->where('collection', $collection);
        }

        return $query->orderBy('sort_order')->get();
    }

    /**
     * Set primary media for a model
     *
     * @param string $mediableType
     * @param int $mediableId
     * @param int $mediaId
     * @return bool
     */
    public function setPrimaryMedia(string $mediableType, int $mediableId, int $mediaId): bool
    {
        // Remove primary flag from all media for this model
        Media::where('mediable_type', $mediableType)
            ->where('mediable_id', $mediableId)
            ->update(['is_primary' => false]);

        // Set the specified media as primary
        return Media::where('id', $mediaId)
            ->where('mediable_type', $mediableType)
            ->where('mediable_id', $mediableId)
            ->update(['is_primary' => true]) > 0;
    }
}







