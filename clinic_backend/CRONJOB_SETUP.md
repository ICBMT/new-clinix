# Laravel Scheduler Cronjob Setup

## Cronjob Command

Add this single cron entry to your server's crontab to run Laravel's task scheduler:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## Setup Instructions

### 1. Edit Crontab
```bash
crontab -e
```

### 2. Add the Cronjob
Replace `/path-to-your-project` with your actual project path. For example:

```bash
* * * * * cd /var/www/html/clinic_backend && php artisan schedule:run >> /dev/null 2>&1
```

Or if you want to log the output:

```bash
* * * * * cd /var/www/html/clinic_backend && php artisan schedule:run >> /var/www/html/clinic_backend/storage/logs/scheduler.log 2>&1
```

### 3. Verify the Cronjob
```bash
crontab -l
```

## Currently Scheduled Tasks

Based on your `routes/console.php`, the following tasks are scheduled:

- **Password Reset Token Cleanup**: Daily at 00:00
- **Cache/Config/View/Route Clear**: Daily at 01:00
- **Database Backup**: Daily at 02:00
- **Queue Restart**: Daily at 03:00
- **Session Cleanup**: Daily at 04:00
- **Optimization Clear**: Daily at 05:00
- **Broadcast Processing**: Every 5 minutes
- **Model Pruning**: Yearly on January 1st
- **Activity Log Cleanup**: Yearly on January 1st and July 1st

## Important Notes

1. **Path**: Make sure to use the absolute path to your Laravel project
2. **PHP Path**: If `php` is not in your PATH, use the full path (e.g., `/usr/bin/php`)
3. **Permissions**: Ensure the cron user has write permissions to `storage/logs/` if logging
4. **Timezone**: Scheduled tasks use your application's timezone configured in `config/app.php`

## Example with Full PHP Path

```bash
* * * * * cd /var/www/html/clinic_backend && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

## Testing the Scheduler

You can test if the scheduler is working by running:

```bash
php artisan schedule:run
```

This will execute all scheduled tasks that are due to run.

## Troubleshooting

If tasks aren't running:

1. **Check cron logs**: 
   ```bash
   tail -f /var/log/cron.log
   ```

2. **Check Laravel logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Verify cron is running**:
   ```bash
   systemctl status cron
   # or
   service cron status
   ```

4. **Test manually**:
   ```bash
   php artisan schedule:run -v
   ```

