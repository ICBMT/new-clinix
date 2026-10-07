<?php

namespace App\Services;

use App\Models\User;
use App\Models\DeviceToken;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging;
use Kreait\Firebase\Exception\MessagingException;

class FirebaseTopicService
{
    protected $messaging;
    
    /**
     * Available topics configuration
     * Add new topics here for future use
     */
    protected array $availableTopics = [
        'role_admin' => 'Admin notifications',
        'role_vendor' => 'Vendor notifications', 
        'role_user' => 'User notifications',
        'role_super-admin' => 'Super admin notifications',
        'role_guest' => 'Guest notifications',
        'system_maintenance' => 'System maintenance alerts',
        'promotions' => 'Promotional notifications',
        'order_updates' => 'Order status updates',
        'security_alerts' => 'Security notifications',
        'feature_updates' => 'New feature announcements',
        'general_announcements' => 'General announcements',
    ];

    public function __construct(Messaging $messaging)
    {
        $this->messaging = $messaging;
    }

    /**
     * Get all available topics
     */
    public function getAvailableTopics(): array
    {
        return $this->availableTopics;
    }

    /**
     * Get topics for a specific user based on their roles and preferences
     */
    public function getUserTopics(User $user): array
    {
        $topics = [];
        $roles = $user->getRoleNames();
        
        // Add role-based topics
        foreach ($roles as $role) {
            $roleTopic = "role_{$role}";
            if (isset($this->availableTopics[$roleTopic])) {
                $topics[$roleTopic] = $this->availableTopics[$roleTopic];
            }
        }
        
        // Add general topics that all users should receive
        $generalTopics = [
            'general_announcements'
        ];
        
        foreach ($generalTopics as $topic) {
            if (isset($this->availableTopics[$topic])) {
                $topics[$topic] = $this->availableTopics[$topic];
            }
        }
        
        return $topics;
    }

    /**
     * Get role-based topics for a user
     */
    public function getUserRoleTopics(User $user): array
    {
        $topics = [];
        $roles = $user->getRoleNames();
        
        foreach ($roles as $role) {
            $roleTopic = "role_{$role}";
            if (isset($this->availableTopics[$roleTopic])) {
                $topics[$roleTopic] = $this->availableTopics[$roleTopic];
            }
        }
        
        return $topics;
    }

    /**
     * Add a new topic to the available topics
     */
    public function addTopic(string $topicName, string $description): void
    {
        $this->availableTopics[$topicName] = $description;
    }

    /**
     * Remove a topic from available topics
     */
    public function removeTopic(string $topicName): void
    {
        unset($this->availableTopics[$topicName]);
    }

    /**
     * Check if a topic exists in available topics
     */
    public function topicExists(string $topicName): bool
    {
        return isset($this->availableTopics[$topicName]);
    }

    /**
     * Subscribe a user to topics based on their roles
     */
    public function subscribeUserToTopics(User $user): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized');
            return false;
        }

        try {
            $deviceTokens = $user->deviceTokens()->pluck('token')->filter()->unique()->toArray();
            
            if (empty($deviceTokens)) {
                Log::info("No device tokens found for user: {$user->id}");
                return false;
            }

            $userTopics = $this->getUserTopics($user);
            $successCount = 0;
            $totalTopics = count($userTopics);
            
            foreach ($userTopics as $topicName => $description) {
                try {
                    $this->messaging->subscribeToTopic($topicName, $deviceTokens);
                    $successCount++;
                    
                    Log::info("✅ User {$user->id} successfully subscribed to topic: {$topicName}", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'topic' => $topicName,
                        'description' => $description,
                        'device_tokens_count' => count($deviceTokens),
                        'device_tokens' => array_map(function($token) {
                            return substr($token, 0, 20) . '...';
                        }, $deviceTokens),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                } catch (MessagingException $e) {
                    Log::error("❌ Failed to subscribe user {$user->id} to topic {$topicName}", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'topic' => $topicName,
                        'description' => $description,
                        'error_message' => $e->getMessage(),
                        'error_code' => $e->getCode(),
                        'device_tokens_count' => count($deviceTokens),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                } catch (\Exception $e) {
                    Log::error("❌ Unexpected error subscribing user {$user->id} to topic {$topicName}", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'topic' => $topicName,
                        'error_message' => $e->getMessage(),
                        'error_trace' => $e->getTraceAsString(),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                }
            }

            Log::info("📊 User {$user->id} topic subscription summary", [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'success_count' => $successCount,
                'total_topics' => $totalTopics,
                'failed_count' => $totalTopics - $successCount,
                'success_rate' => $totalTopics > 0 ? round(($successCount / $totalTopics) * 100, 2) . '%' : '0%',
                'subscribed_topics' => array_keys(array_slice($userTopics, 0, $successCount)),
                'timestamp' => now()->toDateTimeString(),
            ]);
            return $successCount > 0;
        } catch (\Exception $e) {
            Log::error("Error subscribing user {$user->id} to topics: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Unsubscribe a user from topics based on their roles
     */
    public function unsubscribeUserFromTopics(User $user): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized');
            return false;
        }

        try {
            $deviceTokens = $user->deviceTokens()->pluck('token')->filter()->unique()->toArray();
            
            if (empty($deviceTokens)) {
                return true;
            }

            $userTopics = $this->getUserTopics($user);
            $successCount = 0;
            $totalTopics = count($userTopics);
            
            foreach ($userTopics as $topicName => $description) {
                try {
                    $this->messaging->unsubscribeFromTopic($topicName, $deviceTokens);
                    $successCount++;
                    
                    Log::info("✅ User {$user->id} successfully unsubscribed from topic: {$topicName}", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'topic' => $topicName,
                        'description' => $description,
                        'device_tokens_count' => count($deviceTokens),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                } catch (MessagingException $e) {
                    Log::error("❌ Failed to unsubscribe user {$user->id} from topic {$topicName}", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'topic' => $topicName,
                        'error_message' => $e->getMessage(),
                        'error_code' => $e->getCode(),
                        'device_tokens_count' => count($deviceTokens),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                } catch (\Exception $e) {
                    Log::error("❌ Unexpected error unsubscribing user {$user->id} from topic {$topicName}", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'topic' => $topicName,
                        'error_message' => $e->getMessage(),
                        'error_trace' => $e->getTraceAsString(),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                }
            }

            Log::info("📊 User {$user->id} topic unsubscription summary", [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'success_count' => $successCount,
                'total_topics' => $totalTopics,
                'failed_count' => $totalTopics - $successCount,
                'success_rate' => $totalTopics > 0 ? round(($successCount / $totalTopics) * 100, 2) . '%' : '0%',
                'unsubscribed_topics' => array_keys(array_slice($userTopics, 0, $successCount)),
                'timestamp' => now()->toDateTimeString(),
            ]);
            return $successCount > 0;
        } catch (\Exception $e) {
            Log::error("Error unsubscribing user {$user->id} from topics: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Subscribe a device token to a specific topic
     */
    public function subscribeTokenToTopic(string $token, string $topicName): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized');
            return false;
        }

        if (!$this->topicExists($topicName)) {
            Log::warning("Attempted to subscribe to non-existent topic: {$topicName}");
            return false;
        }

        try {
            $this->messaging->subscribeToTopic($topicName, [$token]);
            
            Log::info("Device token subscribed to topic: {$topicName}", [
                'token' => substr($token, 0, 20) . '...',
                'topic' => $topicName,
                'description' => $this->availableTopics[$topicName] ?? 'Unknown topic',
            ]);
            
            return true;
        } catch (MessagingException $e) {
            Log::error("Failed to subscribe token to topic {$topicName}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Unsubscribe a device token from a specific topic
     */
    public function unsubscribeTokenFromTopic(string $token, string $topicName): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized');
            return false;
        }

        if (!$this->topicExists($topicName)) {
            Log::warning("Attempted to unsubscribe from non-existent topic: {$topicName}");
            return false;
        }

        try {
            $this->messaging->unsubscribeFromTopic($topicName, [$token]);
            
            Log::info("Device token unsubscribed from topic: {$topicName}", [
                'token' => substr($token, 0, 20) . '...',
                'topic' => $topicName,
                'description' => $this->availableTopics[$topicName] ?? 'Unknown topic',
            ]);
            
            return true;
        } catch (MessagingException $e) {
            Log::error("Failed to unsubscribe token from topic {$topicName}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Handle topic subscription after user login
     * This method ensures users are subscribed to topics when they log in
     */
    public function handleUserLogin(User $user): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized for user login');
            return false;
        }

        try {
            Log::info("Handling topic subscription for user login: {$user->id}");
            
            // Get user's device tokens
            $deviceTokens = $user->deviceTokens()->pluck('token')->filter()->unique()->toArray();
            
            if (empty($deviceTokens)) {
                Log::info("No device tokens found for user: {$user->id} during login");
                return false;
            }

            // Get user's topics
            $userTopics = $this->getUserTopics($user);
            
            if (empty($userTopics)) {
                Log::warning("User {$user->id} has no topics assigned during login");
                return false;
            }

            $successCount = 0;
            $totalTopics = count($userTopics);

            foreach ($userTopics as $topicName => $description) {
                try {
                    $this->messaging->subscribeToTopic($topicName, $deviceTokens);
                    $successCount++;
                    
                    Log::info("User {$user->id} subscribed to topic during login: {$topicName}", [
                        'user_id' => $user->id,
                        'topic' => $topicName,
                        'description' => $description,
                        'device_tokens_count' => count($deviceTokens),
                    ]);
                } catch (MessagingException $e) {
                    Log::error("Failed to subscribe user {$user->id} to topic {$topicName} during login: " . $e->getMessage());
                }
            }

            Log::info("Topic subscription completed for user {$user->id}: {$successCount}/{$totalTopics} topics subscribed");
            return $successCount > 0;
            
        } catch (\Exception $e) {
            Log::error("Error handling topic subscription for user {$user->id} during login: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Handle topic unsubscription after user logout
     * This method ensures users are unsubscribed from topics when they log out
     */
    public function handleUserLogout(User $user): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized for user logout');
            return false;
        }

        try {
            Log::info("Handling topic unsubscription for user logout: {$user->id}");
            
            // Get user's device tokens
            $deviceTokens = $user->deviceTokens()->pluck('token')->filter()->unique()->toArray();
            
            if (empty($deviceTokens)) {
                Log::info("No device tokens found for user: {$user->id} during logout");
                return true;
            }

            // Get user's topics
            $userTopics = $this->getUserTopics($user);
            
            if (empty($userTopics)) {
                Log::info("User {$user->id} has no topics assigned during logout");
                return true;
            }

            $successCount = 0;
            $totalTopics = count($userTopics);

            foreach ($userTopics as $topicName => $description) {
                try {
                    $this->messaging->unsubscribeFromTopic($topicName, $deviceTokens);
                    $successCount++;
                    
                    Log::info("User {$user->id} unsubscribed from topic during logout: {$topicName}", [
                        'user_id' => $user->id,
                        'topic' => $topicName,
                        'description' => $description,
                        'device_tokens_count' => count($deviceTokens),
                    ]);
                } catch (MessagingException $e) {
                    Log::error("Failed to unsubscribe user {$user->id} from topic {$topicName} during logout: " . $e->getMessage());
                }
            }

            Log::info("Topic unsubscription completed for user {$user->id}: {$successCount}/{$totalTopics} topics unsubscribed");
            return $successCount > 0;
            
        } catch (\Exception $e) {
            Log::error("Error handling topic unsubscription for user {$user->id} during logout: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Subscribe a user to specific topics
     */
    public function subscribeUserToSpecificTopics(User $user, array $topicNames): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized');
            return false;
        }

        try {
            $deviceTokens = $user->deviceTokens()->pluck('token')->filter()->unique()->toArray();
            
            if (empty($deviceTokens)) {
                Log::info("No device tokens found for user: {$user->id}");
                return false;
            }

            $successCount = 0;
            $totalTopics = count($topicNames);
            
            foreach ($topicNames as $topicName) {
                if (!$this->topicExists($topicName)) {
                    Log::warning("Skipping non-existent topic: {$topicName}");
                    continue;
                }
                
                try {
                    $this->messaging->subscribeToTopic($topicName, $deviceTokens);
                    $successCount++;
                    
                    Log::info("User {$user->id} subscribed to specific topic: {$topicName}", [
                        'user_id' => $user->id,
                        'topic' => $topicName,
                        'description' => $this->availableTopics[$topicName],
                        'device_tokens_count' => count($deviceTokens),
                    ]);
                } catch (MessagingException $e) {
                    Log::error("Failed to subscribe user {$user->id} to specific topic {$topicName}: " . $e->getMessage());
                }
            }

            Log::info("User {$user->id} specific topic subscription completed: {$successCount}/{$totalTopics} topics subscribed");
            return $successCount > 0;
        } catch (\Exception $e) {
            Log::error("Error subscribing user {$user->id} to specific topics: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Unsubscribe a user from specific topics
     */
    public function unsubscribeUserFromSpecificTopics(User $user, array $topicNames): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized');
            return false;
        }

        try {
            $deviceTokens = $user->deviceTokens()->pluck('token')->filter()->unique()->toArray();
            
            if (empty($deviceTokens)) {
                return true;
            }

            $successCount = 0;
            $totalTopics = count($topicNames);
            
            foreach ($topicNames as $topicName) {
                if (!$this->topicExists($topicName)) {
                    Log::warning("Skipping non-existent topic: {$topicName}");
                    continue;
                }
                
                try {
                    $this->messaging->unsubscribeFromTopic($topicName, $deviceTokens);
                    $successCount++;
                    
                    Log::info("User {$user->id} unsubscribed from specific topic: {$topicName}", [
                        'user_id' => $user->id,
                        'topic' => $topicName,
                        'description' => $this->availableTopics[$topicName],
                        'device_tokens_count' => count($deviceTokens),
                    ]);
                } catch (MessagingException $e) {
                    Log::error("Failed to unsubscribe user {$user->id} from specific topic {$topicName}: " . $e->getMessage());
                }
            }

            Log::info("User {$user->id} specific topic unsubscription completed: {$successCount}/{$totalTopics} topics unsubscribed");
            return $successCount > 0;
        } catch (\Exception $e) {
            Log::error("Error unsubscribing user {$user->id} from specific topics: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get topic statistics
     */
    public function getTopicStats(): array
    {
        return [
            'total_topics' => count($this->availableTopics),
            'role_topics' => count(array_filter($this->availableTopics, function($key) {
                return str_starts_with($key, 'role_');
            }, ARRAY_FILTER_USE_KEY)),
            'general_topics' => count(array_filter($this->availableTopics, function($key) {
                return !str_starts_with($key, 'role_');
            }, ARRAY_FILTER_USE_KEY)),
            'topics' => $this->availableTopics,
        ];
    }

    /**
     * Sync all users to their appropriate topics
     * This is useful for bulk operations or system maintenance
     */
    public function syncAllUsersToTopics(): array
    {
        try {
            Log::info("Starting bulk sync of all users to Firebase topics");
            
            $users = User::with('roles', 'deviceTokens')->get();
            $results = [
                'total_users' => $users->count(),
                'successful' => 0,
                'failed' => 0,
                'errors' => []
            ];

            foreach ($users as $user) {
                try {
                    if ($this->subscribeUserToTopics($user)) {
                        $results['successful']++;
                    } else {
                        $results['failed']++;
                        $results['errors'][] = "User {$user->id}: No device tokens or subscription failed";
                    }
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "User {$user->id}: " . $e->getMessage();
                }
            }

            Log::info("Bulk sync completed", $results);
            return $results;
            
        } catch (\Exception $e) {
            Log::error("Error during bulk sync: " . $e->getMessage());
            return [
                'total_users' => 0,
                'successful' => 0,
                'failed' => 0,
                'errors' => [$e->getMessage()]
            ];
        }
    }

    /**
     * Subscribe all users to general_announcements topic
     * This ensures all users receive broadcast notifications
     */
    public function subscribeAllUsersToGeneralAnnouncements(): array
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized');
            return [
                'total_users' => 0,
                'successful' => 0,
                'failed' => 0,
                'errors' => ['Firebase messaging not initialized']
            ];
        }

        try {
            Log::info("🚀 Starting bulk subscription of all users to general_announcements topic");
            
            $users = User::with('deviceTokens')->get();
            $topicName = 'general_announcements';
            $results = [
                'total_users' => $users->count(),
                'successful' => 0,
                'failed' => 0,
                'errors' => []
            ];

            foreach ($users as $user) {
                try {
                    $deviceTokens = $user->deviceTokens()->pluck('token')->filter()->unique()->toArray();
                    
                    if (empty($deviceTokens)) {
                        Log::info("⏭️  Skipping user {$user->id} - no device tokens", [
                            'user_id' => $user->id,
                            'user_name' => $user->name,
                        ]);
                        continue;
                    }

                    $this->messaging->subscribeToTopic($topicName, $deviceTokens);
                    $results['successful']++;
                    
                    Log::info("✅ User {$user->id} subscribed to general_announcements", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'user_email' => $user->email,
                        'topic' => $topicName,
                        'device_tokens_count' => count($deviceTokens),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                } catch (MessagingException $e) {
                    $results['failed']++;
                    $results['errors'][] = "User {$user->id}: " . $e->getMessage();
                    Log::error("❌ Failed to subscribe user {$user->id} to general_announcements", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'error' => $e->getMessage(),
                        'error_code' => $e->getCode(),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "User {$user->id}: " . $e->getMessage();
                    Log::error("❌ Unexpected error subscribing user {$user->id} to general_announcements", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'error' => $e->getMessage(),
                        'timestamp' => now()->toDateTimeString(),
                    ]);
                }
            }

            Log::info("📊 Bulk subscription to general_announcements completed", [
                'total_users' => $results['total_users'],
                'successful' => $results['successful'],
                'failed' => $results['failed'],
                'success_rate' => $results['total_users'] > 0 
                    ? round(($results['successful'] / $results['total_users']) * 100, 2) . '%' 
                    : '0%',
                'timestamp' => now()->toDateTimeString(),
            ]);
            
            return $results;
            
        } catch (\Exception $e) {
            Log::error("❌ Error during bulk subscription to general_announcements: " . $e->getMessage());
            return [
                'total_users' => 0,
                'successful' => 0,
                'failed' => 0,
                'errors' => [$e->getMessage()]
            ];
        }
    }
}