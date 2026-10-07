<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// * * * * * cd /var/www/html/directory && php artisan schedule:run >> /var/www/html/directory/storage/logs/cron.log 2>&1

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Schedule password reset token cleanup daily
Schedule::command('auth:cleanup-password-reset-tokens')->dailyAt('00:00');

// Schedule maintenance tasks
Schedule::command('cache:clear')->dailyAt('01:00');
Schedule::command('config:clear')->dailyAt('01:00');
Schedule::command('view:clear')->dailyAt('01:00');
Schedule::command('route:clear')->dailyAt('01:00');

// Schedule database maintenance
// Note: db:backup automatically creates storage/app/backups directory if it doesn't exist
// Schedule::command('db:backup')->dailyAt('02:00');
Schedule::command('queue:restart')->dailyAt('03:00');

// Schedule session cleanup
Schedule::command('session:gc')->dailyAt('04:00');

// Schedule model pruning
Schedule::command('model:prune')->yearlyOn(1, 1);

// Schedule activity log cleanup twice a year (January 1st and July 1st)
Schedule::command('activitylog:clean')->yearlyOn(1, 1);
Schedule::command('activitylog:clean')->yearlyOn(7, 1);

// Schedule optimization (production only)
Schedule::command('optimize:clear')->dailyAt('05:00');

// Schedule broadcast processing - run every 5 minutes to check for scheduled broadcasts
Schedule::command('broadcasts:process-scheduled')->everyFiveMinutes();

// Schedule queue processing - run every minute to process push notifications and other queued jobs
Schedule::command('queue:process --max-jobs=50 --max-time=60')->everyMinute()->withoutOverlapping();

