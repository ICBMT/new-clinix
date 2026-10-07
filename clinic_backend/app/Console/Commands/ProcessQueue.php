<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class ProcessQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'queue:process 
                            {--timeout=60 : The number of seconds a child process can run}
                            {--tries=3 : Number of times to attempt a job before logging it failed}
                            {--max-jobs=1000 : Number of jobs to process before stopping}
                            {--max-time=3600 : Maximum number of seconds the worker should run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process queued jobs (push notifications, broadcasts, etc.)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔄 Processing queued jobs...');
        
        $timeout = (int) $this->option('timeout');
        $tries = (int) $this->option('tries');
        $maxJobs = (int) $this->option('max-jobs');
        $maxTime = (int) $this->option('max-time');
        
        try {
            // Check queue connection
            $queueConnection = config('queue.default', 'database');
            $this->info("📋 Using queue connection: {$queueConnection}");
            
            // Get pending jobs count before processing
            $pendingJobsCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
            $this->info("📊 Found {$pendingJobsCount} pending job(s) in queue");
            
            if ($pendingJobsCount === 0) {
                $this->info('✅ No pending jobs to process');
                return Command::SUCCESS;
            }
            
            // Use Laravel's queue:work command with stop-when-empty to process available jobs
            $exitCode = Artisan::call('queue:work', [
                '--connection' => $queueConnection,
                '--queue' => 'default',
                '--timeout' => $timeout,
                '--tries' => $tries,
                '--max-jobs' => $maxJobs,
                '--max-time' => $maxTime,
                '--stop-when-empty' => true, // Stop when queue is empty
            ]);
            
            $output = Artisan::output();
            if ($output) {
                $this->line($output);
            }
            
            // Get remaining jobs count after processing
            $remainingJobsCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
            $processedCount = $pendingJobsCount - $remainingJobsCount;
            
            $this->info("✅ Queue processing completed - Processed: {$processedCount}, Remaining: {$remainingJobsCount}");
            Log::info('Queue processing completed', [
                'exit_code' => $exitCode,
                'max_jobs' => $maxJobs,
                'max_time' => $maxTime,
                'pending_before' => $pendingJobsCount,
                'processed' => $processedCount,
                'remaining' => $remainingJobsCount,
            ]);
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('❌ Error processing queue: ' . $e->getMessage());
            Log::error('Error processing queue', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Command::FAILURE;
        }
    }
}
