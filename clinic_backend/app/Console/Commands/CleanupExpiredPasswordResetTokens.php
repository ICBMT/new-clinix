<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PasswordResetToken;

class CleanupExpiredPasswordResetTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auth:cleanup-password-reset-tokens';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired password reset tokens from the database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting cleanup of expired password reset tokens...');
        
        $deletedCount = PasswordResetToken::cleanupExpired();
        
        if ($deletedCount > 0) {
            $this->info("Successfully cleaned up {$deletedCount} expired password reset tokens.");
        } else {
            $this->info('No expired password reset tokens found.');
        }
        
        return Command::SUCCESS;
    }
}
