<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity as SpatieLogsActivity;
use Spatie\Activitylog\Models\Activity;

trait LogsActivity
{
    use SpatieLogsActivity;

    /**
     * Get the options for logging the activity.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly($this->getFillableAttributes())
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName($this->getLogName())
            ->setDescriptionForEvent(function (string $eventName) {
                return $this->getDescriptionForEvent($eventName);
            })
            ->dontLogIfAttributesChangedOnly(['updated_at']);
    }

    /**
     * Get the description for the event.
     */
    protected function getDescriptionForEvent(string $eventName): string
    {
        $modelName = Str::title($this->getLogName());
        $causer = Auth::user();
        $causerName = $causer ? $causer->name : 'System';
        $affectedName = $this->getAffectedModelName($this);

        $entityDescription = $affectedName ? " <b>({$affectedName})</b>" : "";

        switch ($eventName) {
            case 'created':
                return "{$causerName} created {$modelName}{$entityDescription}";

            case 'updated':
                $changes = $this->getDirty();
                $changedAttributes = $this->formatChangedAttributes($changes);

                if (empty($changedAttributes)) {
                    return "{$causerName} updated {$modelName}{$entityDescription}";
                }

                return "{$causerName} updated {$modelName}{$entityDescription} - Changed: " . implode(', ', $changedAttributes);

            case 'deleted':
                return "{$causerName} deleted {$modelName}{$entityDescription}";

            default:
                return "{$causerName} performed {$eventName} on {$modelName}{$entityDescription}";
        }
    }

    /**
     * Get the affected model name for display.
     */
    protected function getAffectedModelName($model)
    {
        if (!$model) {
            return null;
        }

        // Try to get a meaningful name for the model
        if (method_exists($model, 'getNameAttribute')) {
            return $model->name;
        }

        if (isset($model->name)) {
            return $model->name;
        }

        if (isset($model->title)) {
            return $model->title;
        }

        if (isset($model->email)) {
            return $model->email;
        }

        if (isset($model->first_name) && isset($model->last_name)) {
            return $model->first_name . ' ' . $model->last_name;
        }

        return null;
    }

    /**
     * Format changed attributes for display.
     */
    protected function formatChangedAttributes(array $changes): array
    {
        $formattedChanges = [];

        foreach ($changes as $attribute => $newValue) {
            $oldValue = $this->getOriginal($attribute);
            $attributeName = Str::title(str_replace('_', ' ', $attribute));
            
            // Get the cast type for this attribute
            $cast = $this->getCasts()[$attribute] ?? null;
            
            $formattedChanges[] = $this->formatAttributeChange($attribute, $attributeName, $oldValue, $newValue, $cast);
        }

        return $formattedChanges;
    }

    /**
     * Format individual attribute change.
     */
    protected function formatAttributeChange(string $attribute, string $attributeName, $oldValue, $newValue, ?string $cast = null): string
    {
        if ($cast === 'boolean' || $attribute === 'status') {
            $oldValue = $this->formatBooleanValue($oldValue);
            $newValue = $this->formatBooleanValue($newValue);
        } elseif ($cast === 'datetime' || $cast === 'date') {
            $oldValue = $this->formatDateValue($oldValue);
            $newValue = $this->formatDateValue($newValue);
        } elseif ($cast === 'array' || $cast === 'json') {
            $oldValue = $this->formatArrayValue($oldValue);
            $newValue = $this->formatArrayValue($newValue);
        } elseif ($cast === 'integer' || $cast === 'float') {
            $oldValue = (string) $oldValue;
            $newValue = (string) $newValue;
        }

        return "{$attributeName} from '{$oldValue}' to '{$newValue}'";
    }

    /**
     * Format boolean values for display.
     */
    protected function formatBooleanValue($value): string
    {
        if (is_bool($value)) {
            return $value ? 'Active' : 'Inactive';
        }

        if (is_numeric($value)) {
            return $value == 1 ? 'Active' : 'Inactive';
        }

        return (string) $value;
    }

    /**
     * Format date values for display.
     */
    protected function formatDateValue($value): string
    {
        if (!$value) {
            return 'Not set';
        }

        try {
            return date('M d, Y H:i', strtotime($value));
        } catch (\Exception $e) {
            return (string) $value;
        }
    }

    /**
     * Format array values for display.
     */
    protected function formatArrayValue($value): string
    {
        if (is_array($value) || is_object($value)) {
            return json_encode($value);
        }

        return (string) $value;
    }

    /**
     * Get fillable attributes excluding hidden ones.
     */
    protected function getFillableAttributes(): array
    {
        $fillable = $this->fillable ?? [];
        $hidden = $this->hidden ?? [];
        return array_values(array_diff($fillable, $hidden));
    }

    /**
     * Get the log name for this model.
     */
    protected function getLogName(): string
    {
        return $this->modelName ?? class_basename($this);
    }

    /**
     * Get all activities for this model.
     */
    public function getActivities()
    {
        return Activity::forSubject($this)->latest()->get();
    }

    /**
     * Get recent activities for this model.
     */
    public function getRecentActivities(int $limit = 10)
    {
        return Activity::forSubject($this)->latest()->limit($limit)->get();
    }

    /**
     * Log a custom action with detailed information.
     */
    public function logAction(string $action, string $description, array $properties = [])
    {
        $request = request();
        $deviceInfo = \App\Services\DeviceInfoService::parseUserAgent($request ? $request->userAgent() : null);
        
        // Get current timestamp in application timezone
        $timestamp = now(config('app.timezone'))->toDateTimeString();
        $timestampIso = now(config('app.timezone'))->toIso8601String();
        $timestampUnix = now(config('app.timezone'))->timestamp;

        // Build comprehensive properties
        $commonProperties = [
            // IP Address Information
            'ip_address' => $request ? $request->ip() : null,
            'ip_address_all' => $request ? $request->ips() : [],
            
            // Device Information
            'device_name' => $deviceInfo['device_name'],
            'device_type' => $deviceInfo['device_type'],
            'os' => $deviceInfo['os'],
            'os_version' => $deviceInfo['os_version'],
            'browser' => $deviceInfo['browser'],
            'browser_version' => $deviceInfo['browser_version'],
            
            // User Agent
            'user_agent' => $request ? $request->userAgent() : null,
            'user_agent_parsed' => $deviceInfo,
            
            // Request Information
            'url' => $request ? $request->fullUrl() : null,
            'path' => $request ? $request->path() : null,
            'method' => $request ? $request->method() : null,
            'referer' => $request ? $request->header('referer') : null,
            'host' => $request ? $request->getHost() : null,
            'scheme' => $request ? $request->getScheme() : null,
            'port' => $request ? $request->getPort() : null,
            
            // Timestamp Information (in application timezone)
            'timestamp' => $timestamp,
            'timestamp_iso8601' => $timestampIso,
            'timestamp_unix' => $timestampUnix,
            'timezone' => config('app.timezone'),
            
            // Session Information
            'session_id' => ($request && $request->hasSession()) ? $request->session()->getId() : null,
            'csrf_token' => $request ? ($request->header('X-CSRF-TOKEN') ?? $request->input('_token')) : null,
        ];

        $user = Auth::user();
        if ($user) {
            $commonProperties['user_id'] = $user->id;
            $commonProperties['user_email'] = $user->email;
            $commonProperties['user_name'] = $user->name;
        }

        $allProperties = array_merge($commonProperties, $properties);

        $activity = activity($this->getLogName())
            ->performedOn($this)
            ->event($action)
            ->withProperties($allProperties);

        if ($user && $user instanceof \Illuminate\Database\Eloquent\Model) {
            $activity->causedBy($user);
        }

        $activity->log($description);
    }


    /**
     * Get activity statistics for this model.
     */
    public function getActivityStats()
    {
        $activities = Activity::forSubject($this);

        return [
            'total_activities' => $activities->count(),
            'created_count' => $activities->where('event', 'created')->count(),
            'updated_count' => $activities->where('event', 'updated')->count(),
            'deleted_count' => $activities->where('event', 'deleted')->count(),
            'last_activity' => $activities->latest()->first()?->created_at,
        ];
    }
}
