<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseBackupCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:backup {--disk=local} {--keep=14}';

    /**
     * The console command description.
     */
    protected $description = 'Backup the database to storage (defaults twice daily via scheduler).';

    public function handle(): int
    {
        $connection = config('database.default');
        $config = config("database.connections.$connection");

        if ($config['driver'] !== 'mysql') {
            $this->error('Only MySQL is supported in this simple backup command.');
            return self::FAILURE;
        }

        $db = $config['database'];
        $user = $config['username'];
        $pass = $config['password'];
        $host = $config['host'];
        $port = $config['port'] ?? 3306;

        $timestamp = now()->format('Ymd_His');
        $file = "backups/{$db}_{$timestamp}.sql";

        // Use the same directory as Storage::disk('local') (e.g. storage/app/private/backups)
        Storage::disk('local')->makeDirectory('backups');
        $fullPath = Storage::disk('local')->path($file);

        // Run mysqldump
        $cmd = sprintf(
            'mysqldump -h%s -P%s -u%s -p%s %s --single-transaction --quick --lock-tables=false > %s',
            escapeshellarg($host),
            escapeshellarg((string) $port),
            escapeshellarg($user),
            escapeshellarg($pass),
            escapeshellarg($db),
            escapeshellarg($fullPath)
        );

        $this->info('Running backup...');
        $exitCode = 0;
        if (strncasecmp(PHP_OS, 'WIN', 3) === 0) {
            $exitCode = system($cmd) === false ? 1 : 0;
        } else {
            $exitCode = pcntl_exec('/bin/sh', ['-c', $cmd]) ?? 0; // fallback will not run here; using exec below
        }

        // Fallback portable exec
        if ($exitCode !== 0) {
            exec($cmd, $out, $exitCode);
        }

        if ($exitCode !== 0) {
            $this->error('Backup failed. Ensure mysqldump is installed and accessible.');
            return self::FAILURE;
        }

        $this->info('Backup saved: ' . $fullPath);

        // Optional offsite copy if disk provided and configured
        $disk = $this->option('disk');
        if ($disk && $disk !== 'local') {
            $contents = Storage::disk('local')->get($file);
            Storage::disk($disk)->put($file, $contents);
            $this->info("Backup copied to '{$disk}': {$file}");
        }

        // Delete old backups: keep only the newest $keep, remove the rest
        $keep = (int) $this->option('keep');
        $deleted = $this->rotateBackups('local', $keep);
        if ($deleted > 0) {
            $this->info("Deleted {$deleted} old backup(s) from local disk.");
        }
        if ($disk && $disk !== 'local') {
            $deletedRemote = $this->rotateBackups($disk, $keep);
            if ($deletedRemote > 0) {
                $this->info("Deleted {$deletedRemote} old backup(s) from '{$disk}' disk.");
            }
        }

        return self::SUCCESS;
    }

    /**
     * Keep only the newest $keep backup files; delete the rest.
     */
    private function rotateBackups(string $diskName, int $keep): int
    {
        $files = collect(Storage::disk($diskName)->files('backups'))
            ->filter(fn (string $f) => Str::endsWith($f, '.sql'))
            ->sortDesc()
            ->values();

        // Keep first $keep (newest), delete the rest
        $toDelete = $files->slice($keep);
        $toDelete->each(fn (string $f) => Storage::disk($diskName)->delete($f));

        return $toDelete->count();
    }
}


