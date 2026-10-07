<?php

namespace App\Console\Commands;

use App\Services\FirebaseTopicService;
use Illuminate\Console\Command;

class SubscribeAllUsersToGeneralAnnouncements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'broadcasts:subscribe-all-users 
                            {--dry-run : Run without actually subscribing users}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Subscribe all users with device tokens to general_announcements topic';

    /**
     * Execute the console command.
     */
    public function handle(FirebaseTopicService $topicService): int
    {
        $this->info('🚀 Starting bulk subscription of all users to general_announcements topic...');
        
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->warn('⚠️  DRY RUN MODE - No subscriptions will be made');
        }

        try {
            if ($dryRun) {
                $this->info('Would subscribe all users to general_announcements topic');
                return Command::SUCCESS;
            }

            $results = $topicService->subscribeAllUsersToGeneralAnnouncements();

            // Display results
            $this->newLine();
            $this->info('📊 Subscription Summary:');
            $this->line("  Total users: {$results['total_users']}");
            $this->line("  ✅ Successful: {$results['successful']}");
            $this->line("  ❌ Failed: {$results['failed']}");
            
            if ($results['total_users'] > 0) {
                $successRate = round(($results['successful'] / $results['total_users']) * 100, 2);
                $this->line("  Success rate: {$successRate}%");
            }
            
            if (!empty($results['errors'])) {
                $this->newLine();
                $this->warn('Errors (showing first 10):');
                foreach (array_slice($results['errors'], 0, 10) as $error) {
                    $this->line("  - {$error}");
                }
                if (count($results['errors']) > 10) {
                    $this->line("  ... and " . (count($results['errors']) - 10) . " more errors");
                }
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Fatal error: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}

