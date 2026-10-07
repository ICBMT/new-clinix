<?php

namespace App\Console\Commands;

use App\Models\Broadcast;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class ProcessScheduledBroadcasts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'broadcasts:process-scheduled 
                            {--dry-run : Run without actually sending broadcasts}
                            {--limit=50 : Maximum number of broadcasts to process}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process and send scheduled broadcasts that are due';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService): int
    {
        $this->info('🚀 Starting scheduled broadcasts processing...');
        
        $dryRun = $this->option('dry-run');
        $limit = (int) $this->option('limit');
        
        if ($dryRun) {
            $this->warn('⚠️  DRY RUN MODE - No broadcasts will be sent');
        }

        try {
            // Get app timezone
            $appTimezone = config('app.timezone', 'UTC');
            $now = Carbon::now($appTimezone);
            
            $this->info("🕐 Using timezone: {$appTimezone}");
            $this->info("🕐 Current time: {$now->toDateTimeString()}");
            
            // Get scheduled broadcasts that are due
            $scheduledBroadcasts = Broadcast::where('status', 'scheduled')
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '<=', $now)
                ->limit($limit)
                ->get();

            if ($scheduledBroadcasts->isEmpty()) {
                $this->info('✅ No scheduled broadcasts found that are due to be sent.');
                Log::info('ProcessScheduledBroadcasts: No scheduled broadcasts found');
                return Command::SUCCESS;
            }

            $this->info("📋 Found {$scheduledBroadcasts->count()} scheduled broadcast(s) to process");

            $processed = 0;
            $failed = 0;
            $errors = [];

            foreach ($scheduledBroadcasts as $broadcast) {
                try {
                    $scheduledAt = $broadcast->scheduled_at 
                        ? Carbon::parse($broadcast->scheduled_at)->setTimezone($appTimezone)
                        : null;
                    
                    $this->line("Processing broadcast ID: {$broadcast->id} - '{$broadcast->title_en}'");
                    $this->line("  Scheduled for: " . ($scheduledAt ? $scheduledAt->toDateTimeString() . " ({$appTimezone})" : 'N/A'));
                    $this->line("  Target roles: " . json_encode($broadcast->target_roles ?? []));
                    
                    if ($dryRun) {
                        $this->warn("  [DRY RUN] Would send this broadcast");
                        $processed++;
                        continue;
                    }

                    // Send the broadcast
                    $result = $notificationService->createAndSendBroadcast($broadcast);
                    
                    if ($result['success']) {
                        // Update broadcast status to sent
                        $broadcast->update([
                            'status' => 'sent',
                            'sent_at' => $now,
                        ]);
                        
                        $processed++;
                        $this->info("  ✅ Broadcast sent successfully");
                        
                        Log::info("Scheduled broadcast processed and sent", [
                            'broadcast_id' => $broadcast->id,
                            'title_en' => $broadcast->title_en,
                            'scheduled_at' => $broadcast->scheduled_at,
                            'sent_at' => $now->toDateTimeString(),
                            'timezone' => $appTimezone,
                        ]);
                    } else {
                        $failed++;
                        $errorMsg = $result['message'] ?? 'Unknown error';
                        $errors[] = "Broadcast {$broadcast->id}: {$errorMsg}";
                        $this->error("  ❌ Failed to send: {$errorMsg}");
                        
                        Log::error("Failed to process scheduled broadcast", [
                            'broadcast_id' => $broadcast->id,
                            'error' => $errorMsg,
                        ]);
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $errorMsg = $e->getMessage();
                    $errors[] = "Broadcast {$broadcast->id}: {$errorMsg}";
                    $this->error("  ❌ Error: {$errorMsg}");
                    
                    Log::error("Exception processing scheduled broadcast", [
                        'broadcast_id' => $broadcast->id,
                        'error' => $errorMsg,
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }

            // Summary
            $this->newLine();
            $this->info('📊 Processing Summary:');
            $this->line("  Total found: {$scheduledBroadcasts->count()}");
            $this->line("  ✅ Processed: {$processed}");
            $this->line("  ❌ Failed: {$failed}");
            
            if (!empty($errors)) {
                $this->newLine();
                $this->warn('Errors:');
                foreach ($errors as $error) {
                    $this->line("  - {$error}");
                }
            }

            Log::info("ProcessScheduledBroadcasts completed", [
                'total_found' => $scheduledBroadcasts->count(),
                'processed' => $processed,
                'failed' => $failed,
                'dry_run' => $dryRun,
                'timezone' => $appTimezone,
                'current_time' => $now->toDateTimeString(),
            ]);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Fatal error: " . $e->getMessage());
            Log::error("Fatal error in ProcessScheduledBroadcasts", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Command::FAILURE;
        }
    }
}

