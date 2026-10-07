<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct(
        private readonly \App\Contracts\UserRepositoryInterface $userRepository,
        private readonly \App\Contracts\ClinicRepositoryInterface $clinicRepository,
        private readonly \App\Contracts\BookingRepositoryInterface $bookingRepository,
        private readonly \App\Contracts\TransactionRepositoryInterface $transactionRepository,
        private readonly \App\Contracts\ClinicEarningRepositoryInterface $clinicEarningRepository
    ) {}
    /**
     * Show the dashboard page.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('dashboard.view');
        
        $user = Auth::user();
        
        // Get stats based on user role (only if user has permission)
        $stats = Gate::allows('dashboard.highlights') ? $this->getDashboardStats($user) : [];
        
        // Get charts data (only if user has permission)
        $charts = [];
        if (Gate::allows('dashboard.user-activity') || Gate::allows('dashboard.bookings-overview')) {
            $charts = $this->getDashboardCharts($user);
        }
        
        // Get recent activities (only if user has permission)
        $activities = Gate::allows('dashboard.recent-activities') ? $this->getRecentActivities($user) : [];
        
        // Get system performance (only if user has permission)
        $systemPerformance = Gate::allows('dashboard.system-performance') ? $this->getSystemPerformance() : null;
        
        // Determine if user is clinic manager/admin (not super-admin)
        /** @var \App\Models\User $user */
        $isClinicUser = ($user->hasRole(['clinic_manager', 'clinic']) && !$user->hasRole('super-admin'));
        
        return Inertia::render('dashboard/index', [
            'stats' => $stats,
            'charts' => $charts,
            'activities' => $activities,
            'systemPerformance' => $systemPerformance,
            'isClinicUser' => $isClinicUser,
        ]);
    }

    /**
     * Get dashboard statistics based on user role
     * 
     * - Super Admin: Calculates stats for ALL clinics and bookings (platform-wide)
     * - Clinic Owner/Manager/Sub Admin: Calculates stats for their OWN clinic(s) only
     */
    protected function getDashboardStats($user): array
    {
        // For super admins, show platform-wide stats (all clinics and bookings)
        if ($user->hasRole('super-admin')) {
            return $this->getAdminStats();
        }
        
        // For clinic owners, managers, show clinic-specific stats
        if ($user->hasRole(['clinic_manager', 'clinic'])) {
            return $this->getClinicStats($user);
        }
        
        // For other roles with dashboard.highlights permission (and not clinic roles), show platform-wide stats
        if ($user->hasPermissionTo('dashboard.highlights') && !$user->hasRole(['clinic_manager', 'clinic'])) {
            return $this->getAdminStats();
        }
        
        // Default: return admin stats (fallback for other roles with permissions)
        return $this->getAdminStats();
    }

    /**
     * Get clinic-specific statistics
     * 
     * Calculates stats only for clinics owned or managed by this user
     */
    protected function getClinicStats($user): array
    {
        try {
            // Get clinics owned or managed by this user using User model method
            $clinicIds = collect($this->getUserAccessibleClinicIds($user));
        } catch (\Exception $e) {
            // Log error and return empty stats
            Log::error('Error getting clinic stats for user', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            $clinicIds = collect([]);
        }
        
        // If no clinics found, return empty stats
        if ($clinicIds->isEmpty()) {
            return [
                'total_bookings' => 0,
                'booking_change' => 0,
                'booking_change_type' => 'neutral',
                'pending_bookings' => 0,
                'total_treatments' => 0,
                'treatment_change' => 0,
                'treatment_change_type' => 'neutral',
                'total_revenue' => 0,
                'revenue_change' => 0,
                'revenue_change_type' => 'neutral',
                'active_treatments' => 0,
            ];
        }
        
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();
        $thisMonth = $now->copy()->startOfMonth();
        
        // Total bookings
        $totalBookings = \App\Models\Booking::whereIn('clinic_id', $clinicIds)->count();
        $lastMonthBookings = \App\Models\Booking::whereIn('clinic_id', $clinicIds)
            ->where('created_at', '>=', $lastMonth->startOfMonth())
            ->where('created_at', '<', $thisMonth)
            ->count();
        $bookingChange = $lastMonthBookings > 0 
            ? round((($totalBookings - $lastMonthBookings) / $lastMonthBookings) * 100, 1)
            : 0;
        
        // Pending bookings
        $pendingBookings = \App\Models\Booking::whereIn('clinic_id', $clinicIds)
            ->where('status', 'pending')
            ->count();
        
        // Total treatments
        $totalTreatments = \App\Models\Treatment::whereIn('clinic_id', $clinicIds)->count();
        $lastMonthTreatments = \App\Models\Treatment::whereIn('clinic_id', $clinicIds)
            ->where('created_at', '>=', $lastMonth->startOfMonth())
            ->where('created_at', '<', $thisMonth)
            ->count();
        $treatmentChange = $lastMonthTreatments > 0 
            ? round((($totalTreatments - $lastMonthTreatments) / $lastMonthTreatments) * 100, 1)
            : 0;
        
        // Total revenue from bookings - Use join for better performance
        $totalRevenue = \App\Models\Transaction::join('bookings', 'transactions.transactionable_id', '=', 'bookings.id')
            ->where('transactions.transactionable_type', \App\Models\Booking::class)
            ->whereIn('bookings.clinic_id', $clinicIds)
            ->where('transactions.status', 'completed')
            ->sum('transactions.amount');
        $lastMonthRevenue = \App\Models\Transaction::join('bookings', 'transactions.transactionable_id', '=', 'bookings.id')
            ->where('transactions.transactionable_type', \App\Models\Booking::class)
            ->whereIn('bookings.clinic_id', $clinicIds)
            ->where('transactions.status', 'completed')
            ->where('transactions.created_at', '>=', $lastMonth->startOfMonth())
            ->where('transactions.created_at', '<', $thisMonth)
            ->sum('transactions.amount');
        $revenueChange = $lastMonthRevenue > 0 
            ? round((($totalRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : 0;
        
        // Active treatments
        $activeTreatments = \App\Models\Treatment::whereIn('clinic_id', $clinicIds)
            ->where('status', 'approved')
            ->count();
        
        // Total users (users who have bookings with this clinic)
        $totalUsers = \App\Models\User::whereHas('userBookings', function ($query) use ($clinicIds) {
            $query->whereIn('clinic_id', $clinicIds);
        })->distinct()->count();
        $lastMonthUsers = \App\Models\User::whereHas('userBookings', function ($query) use ($clinicIds, $lastMonth, $thisMonth) {
            $query->whereIn('clinic_id', $clinicIds)
                ->where('created_at', '>=', $lastMonth->startOfMonth())
                ->where('created_at', '<', $thisMonth);
        })->distinct()->count();
        $userChange = $lastMonthUsers > 0 
            ? round((($totalUsers - $lastMonthUsers) / $lastMonthUsers) * 100, 1)
            : 0;
        
        // Total earnings (from ClinicEarning model)
        $totalEarnings = \App\Models\ClinicEarning::whereIn('clinic_id', $clinicIds)
            ->sum('net_amount');
        $lastMonthEarnings = \App\Models\ClinicEarning::whereIn('clinic_id', $clinicIds)
            ->where('created_at', '>=', $lastMonth->startOfMonth())
            ->where('created_at', '<', $thisMonth)
            ->sum('net_amount');
        $earningsChange = $lastMonthEarnings > 0 
            ? round((($totalEarnings - $lastMonthEarnings) / $lastMonthEarnings) * 100, 1)
            : 0;
        
        return [
            'total_users' => $totalUsers,
            'user_change' => $userChange,
            'user_change_type' => $userChange >= 0 ? 'increase' : 'decrease',
            
            'total_bookings' => $totalBookings,
            'booking_change' => $bookingChange,
            'booking_change_type' => $bookingChange >= 0 ? 'increase' : 'decrease',
            
            'pending_bookings' => $pendingBookings,
            'pending_bookings_change' => 0, // Can be calculated if needed
            
            'total_treatments' => $totalTreatments,
            'treatment_change' => $treatmentChange,
            'treatment_change_type' => $treatmentChange >= 0 ? 'increase' : 'decrease',
            
            'total_revenue' => $totalRevenue,
            'revenue_change' => $revenueChange,
            'revenue_change_type' => $revenueChange >= 0 ? 'increase' : 'decrease',
            
            'total_earnings' => $totalEarnings,
            'earnings_change' => $earningsChange,
            'earnings_change_type' => $earningsChange >= 0 ? 'increase' : 'decrease',
            
            'active_treatments' => $activeTreatments,
        ];
    }

    /**
     * Get admin-specific statistics
     * 
     * Calculates stats for ALL clinics and bookings across the platform
     */
    protected function getAdminStats(): array
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();
        $thisMonth = $now->copy()->startOfMonth();
        
        // Total users - using User model relationship for role filtering
        $userStats = $this->getPeriodStatistics(
            fn() => \App\Models\User::role('user'),
            fn() => \App\Models\User::role('user')
                ->where('created_at', '>=', $lastMonth->startOfMonth())
                ->where('created_at', '<', $thisMonth)
        );
        
        // Total clinics - using Clinic model with status filter
        $clinicStats = $this->getPeriodStatistics(
            fn() => \App\Models\Clinic::where('status', 'approved'),
            fn() => \App\Models\Clinic::where('status', 'approved')
                ->where('approved_at', '>=', $lastMonth->startOfMonth())
                ->where('approved_at', '<', $thisMonth)
        );
        
        // Total bookings
        $bookingStats = $this->getPeriodStatistics(
            fn() => \App\Models\Booking::query(),
            fn() => \App\Models\Booking::where('created_at', '>=', $lastMonth->startOfMonth())
                ->where('created_at', '<', $thisMonth)
        );
        
        // Total revenue - using Transaction model
        $revenueStats = $this->getPeriodStatistics(
            fn() => \App\Models\Transaction::where('status', 'completed'),
            fn() => \App\Models\Transaction::where('status', 'completed')
                ->where('created_at', '>=', $lastMonth->startOfMonth())
                ->where('created_at', '<', $thisMonth),
            'sum',
            'amount'
        );
        
        // Total earnings - using ClinicEarning model
        $earningsStats = $this->getPeriodStatistics(
            fn() => \App\Models\ClinicEarning::query(),
            fn() => \App\Models\ClinicEarning::where('created_at', '>=', $lastMonth->startOfMonth())
                ->where('created_at', '<', $thisMonth),
            'sum',
            'net_amount'
        );
        
        // Pending clinics - using Clinic model
        $pendingClinics = \App\Models\Clinic::where('status', 'pending')->count();
        
        // Today registrations - using User model
        $todayRegistrations = \App\Models\User::whereDate('created_at', today())->count();
        
        return [
            'total_users' => $userStats['current'],
            'user_change' => $userStats['change'],
            'user_change_type' => $userStats['change_type'],
            
            'total_clinics' => $clinicStats['current'],
            'clinic_change' => $clinicStats['change'],
            'clinic_change_type' => $clinicStats['change_type'],
            
            'total_bookings' => $bookingStats['current'],
            'booking_change' => $bookingStats['change'],
            'booking_change_type' => $bookingStats['change_type'],
            
            'total_revenue' => $revenueStats['current'],
            'revenue_change' => $revenueStats['change'],
            'revenue_change_type' => $revenueStats['change_type'],
            
            'total_earnings' => $earningsStats['current'],
            'earnings_change' => $earningsStats['change'],
            'earnings_change_type' => $earningsStats['change_type'],
            
            'pending_clinics' => $pendingClinics,
            'today_registrations' => $todayRegistrations,
        ];
    }

    /**
     * Get dashboard charts data based on user role
     * 
     * - Super Admin: Shows user_activity and booking_statistics (all platform data)
     * - Clinic Owner/Manager/Sub Admin: Shows booking_statistics and revenue_statistics (their clinic data only)
     */
    protected function getDashboardCharts($user): array
    {
        // For super admins, show platform-wide charts
        if ($user->hasRole('super-admin')) {
            return $this->getAdminCharts();
        }
        
        // For clinic owners, managers, show clinic-specific charts
        if ($user->hasRole(['clinic_manager', 'clinic'])) {
            return $this->getClinicCharts($user);
        }
        
        // For other roles with dashboard.user-activity permission, show platform-wide charts
        if ($user->hasPermissionTo('dashboard.user-activity')) {
            return $this->getAdminCharts();
        }
        
        // Default: return admin charts (fallback for other roles with permissions)
        return $this->getAdminCharts();
    }

    /**
     * Get clinic chart data
     * 
     * Returns booking_statistics (projection) and revenue_statistics (historical) for clinics owned/managed by this user
     * Does NOT include user_activity chart (only for super admin)
     */
    protected function getClinicCharts($user): array
    {
        try {
            // Get clinics owned or managed by this user using User model method
            $clinicIds = collect($this->getUserAccessibleClinicIds($user));
        } catch (\Exception $e) {
            // Log error and return empty charts
            Log::error('Error getting clinic charts for user', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            $clinicIds = collect([]);
        }
        
        // If no clinics found, return empty charts
        if ($clinicIds->isEmpty()) {
            return [
                'booking_statistics' => [
                    'labels' => [],
                    'data' => [],
                ],
                'revenue_statistics' => [
                    'labels' => [],
                    'data' => [],
                ],
                'earnings_statistics' => [
                    'labels' => [],
                    'data' => [],
                ],
            ];
        }
        
        $months = 6;
        
        // 1. Booking Statistics (Projection: Current Month + Next 5 Months)
        $bookingLabels = [];
        $bookingsData = [];
        
        for ($i = 0; $i < $months; $i++) {
            $date = Carbon::now()->addMonths($i);
            $bookingLabels[] = $date->format('M');
            
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();
            
            // Bookings count based on SESSION DATE (slot_date)
            try {
                $bookingsCount = \App\Models\Booking::whereIn('clinic_id', $clinicIds)
                    ->whereHas('sessions', function($q) use ($startOfMonth, $endOfMonth) {
                        $q->whereBetween('slot_date', [$startOfMonth, $endOfMonth]);
                    })
                    ->count();
            } catch (\Exception $e) {
                Log::error('Error counting bookings for clinic chart', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $bookingsCount = 0;
            }
            $bookingsData[] = (int) $bookingsCount;
        }

        // 2. Financial Statistics (Historical: Last 6 Months)
        $financialLabels = [];
        $revenueData = [];
        $earningsData = [];
        
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $financialLabels[] = $date->format('M');
            
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();
            
            // Revenue - Use join instead of subquery for better performance and accuracy
            try {
                $revenue = \App\Models\Transaction::join('bookings', 'transactions.transactionable_id', '=', 'bookings.id')
                    ->where('transactions.transactionable_type', \App\Models\Booking::class)
                    ->whereIn('bookings.clinic_id', $clinicIds)
                    ->where('transactions.status', 'completed')
                    ->whereBetween('transactions.created_at', [$startOfMonth, $endOfMonth])
                    ->sum('transactions.amount');
                $revenueData[] = (float) ($revenue ?? 0);
            } catch (\Exception $e) {
                Log::error('Error calculating revenue for clinic chart', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $revenueData[] = 0.0;
            }
            
            // Earnings - from ClinicEarning model
            try {
                $earnings = \App\Models\ClinicEarning::whereIn('clinic_id', $clinicIds)
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('net_amount');
                $earningsData[] = (float) ($earnings ?? 0);
            } catch (\Exception $e) {
                Log::error('Error calculating earnings for clinic chart', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $earningsData[] = 0.0;
            }
        }
        
        // For clinic users, include booking_statistics and revenue_statistics (earnings)
        return [
            'booking_statistics' => [
                'labels' => $bookingLabels,
                'data' => $bookingsData,
            ],
            'revenue_statistics' => [
                'labels' => $financialLabels,
                'data' => $revenueData,
            ],
            'earnings_statistics' => [
                'labels' => $financialLabels,
                'data' => $earningsData,
            ],
        ];
    }

    /**
     * Get admin chart data
     * 
     * Returns user_activity (historical), booking_statistics (projection) for ALL platform data
     */
    protected function getAdminCharts(): array
    {
        $months = 6;
        
        // 1. Historical Data (User Activity, Revenue, Earnings)
        $historicalLabels = [];
        $usersData = [];
        $revenueData = [];
        $earningsData = [];
        
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $historicalLabels[] = $date->format('M');
            
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();
            
            // New users
            try {
                $usersCount = \App\Models\User::role('user')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->count();
            } catch (\Exception $e) {
                $usersCount = 0;
            }
            $usersData[] = (int) $usersCount;
            
            // Revenue
            try {
                $revenue = \App\Models\Transaction::join('bookings', 'transactions.transactionable_id', '=', 'bookings.id')
                    ->where('transactions.transactionable_type', \App\Models\Booking::class)
                    ->where('transactions.status', 'completed')
                    ->whereBetween('transactions.created_at', [$startOfMonth, $endOfMonth])
                    ->sum('transactions.amount');
                $revenueData[] = (float) ($revenue ?? 0);
            } catch (\Exception $e) {
                $revenueData[] = 0.0;
            }
            
            // Earnings
            try {
                $earnings = \App\Models\ClinicEarning::whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('net_amount');
                $earningsData[] = (float) ($earnings ?? 0);
            } catch (\Exception $e) {
                $earningsData[] = 0.0;
            }
        }
        
        // 2. Booking Statistics (Projection: Current Month + Next 5 Months)
        $bookingLabels = [];
        $bookingsData = [];
        
        for ($i = 0; $i < $months; $i++) {
            $date = Carbon::now()->addMonths($i);
            $bookingLabels[] = $date->format('M');
            
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();
            
            // Bookings count based on SESSION DATE
            try {
                $bookingsCount = \App\Models\Booking::whereHas('sessions', function($q) use ($startOfMonth, $endOfMonth) {
                        $q->whereBetween('slot_date', [$startOfMonth, $endOfMonth]);
                    })
                    ->count();
            } catch (\Exception $e) {
                $bookingsCount = 0;
            }
            $bookingsData[] = (int) $bookingsCount;
        }
        
        return [
            'user_activity' => [
                'labels' => $historicalLabels,
                'data' => $usersData,
            ],
            'booking_statistics' => [
                'labels' => $bookingLabels,
                'data' => $bookingsData,
            ],
            'revenue_statistics' => [
                'labels' => $historicalLabels,
                'data' => $revenueData,
            ],
            'earnings_statistics' => [
                'labels' => $historicalLabels,
                'data' => $earningsData,
            ],
        ];
    }

    /**
     * Get recent activities based on user role
     * 
     * - Super Admin: Shows all activity logs
     * - Clinic Owner/Manager/Sub Admin: Shows only activities related to their clinic(s)
     */
    protected function getRecentActivities($user): array
    {
        try {
            $query = \Spatie\Activitylog\Models\Activity::query()
                ->with(['causer', 'subject']);

            // Apply role-based scoping
            $query = $this->scopeActivityLogsByRole($query, $user);

            $activities = $query->latest()
                ->limit(10)
                ->get();
        } catch (\Exception $e) {
            // Log error and return empty activities
            Log::error('Error getting recent activities for user', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            $activities = collect([]);
        }
        
        return $activities->map(function ($activity) {
            $causer = $activity->causer;
            $subject = $activity->subject;
            
            // Determine activity type
            $type = 'system';
            if ($subject instanceof \App\Models\Booking) {
                $type = 'booking';
            } elseif ($subject instanceof \App\Models\Clinic) {
                $type = 'clinic';
            } elseif ($subject instanceof \App\Models\User) {
                $type = $subject->hasRole(['clinic_manager']) ? 'clinic_manager' : 'user';
            }
            
            // Determine status based on event
            $status = 'info';
            if ($activity->event === 'created') {
                $status = 'success';
            } elseif ($activity->event === 'deleted') {
                $status = 'error';
            } elseif ($activity->event === 'updated') {
                $status = 'warning';
            }
            
            return [
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'event' => $activity->event,
                'type' => $type,
                'title' => $activity->description ?? $activity->event,
                'description' => $activity->description ?? '',
                'created_at' => $activity->created_at->toIso8601String(),
                'timestamp' => $activity->created_at->diffForHumans(),
                'causer' => $causer ? [
                    'id' => $causer->id,
                    'name' => $causer->name,
                    'email' => $causer->email ?? null,
                ] : null,
                'subject' => $subject ? [
                    'id' => $subject->id,
                    'name' => $subject->name ?? $subject->title ?? null,
                    'email' => $subject->email ?? null,
                    'title' => $subject->title ?? null,
                ] : null,
                'user' => $causer ? $causer->name : 'System',
                'status' => $status,
            ];
        })->toArray();
    }

    /**
     * Get system performance metrics
     */
    protected function getSystemPerformance(): array
    {
        // Get active sessions (handle gracefully if sessions table doesn't exist)
        $activeSessions = 0;
        try {
            if (DB::getSchemaBuilder()->hasTable('sessions')) {
                $activeSessions = DB::table('sessions')
                    ->where('last_activity', '>', now()->subMinutes(30)->timestamp)
                    ->count();
            }
        } catch (\Exception $e) {
            // Sessions table might not exist, use logged in users count as fallback
            $activeSessions = \App\Models\User::where('last_activity_at', '>', now()->subMinutes(30))
                ->count();
        }
        
        // Get disk usage (storage directory)
        $storagePath = storage_path();
        $diskTotal = disk_total_space($storagePath);
        $diskFree = disk_free_space($storagePath);
        $diskUsed = $diskTotal - $diskFree;
        $diskUsagePercent = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;
        
        // Get memory usage
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = $this->parseMemoryLimit(ini_get('memory_limit'));
        $memoryUsagePercent = $memoryLimit > 0 ? round(($memoryUsage / $memoryLimit) * 100, 1) : 0;
        
        // Get database query count from activity log (recent activities)
        $queryCount = 0;
        try {
            $queryCount = \Spatie\Activitylog\Models\Activity::where('created_at', '>=', now()->subHour())
                ->count();
        } catch (\Exception $e) {
            // Fallback: use 0 if activity log table doesn't exist
            $queryCount = 0;
        }
        
        // Normalize query count to a percentage (assuming 100 activities/hour = 100%)
        $normalizedQueryCount = min(100, $queryCount);
        
        // Calculate response time (microseconds to milliseconds)
        $startTime = defined('LARAVEL_START') ? LARAVEL_START : microtime(true);
        $responseTime = round((microtime(true) - $startTime) * 1000, 2);
        
        // Determine status based on usage
        $getStatus = function($percent) {
            if ($percent >= 90) return 'critical';
            if ($percent >= 70) return 'warning';
            return 'good';
        };
        
        $cpuUsage = $this->getCpuUsage();
        
        return [
            'cpu_usage' => [
                'value' => $cpuUsage,
                'max' => 100,
                'unit' => '%',
                'status' => $getStatus($cpuUsage),
            ],
            'memory_usage' => [
                'value' => $memoryUsagePercent,
                'max' => 100,
                'unit' => '%',
                'status' => $getStatus($memoryUsagePercent),
                'raw_value' => $this->formatBytes($memoryUsage),
                'raw_max' => $this->formatBytes($memoryLimit),
            ],
            'disk_usage' => [
                'value' => $diskUsagePercent,
                'max' => 100,
                'unit' => '%',
                'status' => $getStatus($diskUsagePercent),
                'raw_value' => $this->formatBytes($diskUsed),
                'raw_max' => $this->formatBytes($diskTotal),
            ],
            'active_sessions' => [
                'value' => $activeSessions,
                'max' => 1000,
                'unit' => '',
                'status' => $activeSessions > 800 ? 'warning' : 'good',
            ],
            'response_time' => [
                'value' => $responseTime,
                'max' => 1000,
                'unit' => 'ms',
                'status' => $responseTime > 500 ? 'warning' : ($responseTime > 1000 ? 'critical' : 'good'),
            ],
            'database_queries' => [
                'value' => $normalizedQueryCount,
                'max' => 100,
                'unit' => '',
                'status' => $normalizedQueryCount > 80 ? 'warning' : 'good',
                'raw_value' => $queryCount, // Store actual count for tooltip
            ],
            'system_status' => $this->getOverallSystemStatus([
                $diskUsagePercent,
                $memoryUsagePercent,
                $cpuUsage,
            ]),
            'last_updated' => now()->toIso8601String(),
        ];
    }

    /**
     * Get CPU usage percentage
     */
    protected function getCpuUsage(): float
    {
        // Try to get system load average (Linux/Unix)
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            if ($load && isset($load[0])) {
                // Convert load average to percentage (simplified)
                // Load average of 1.0 = 100% for single core, adjust for multi-core
                $cpuCount = $this->getCpuCount();
                $loadPercent = min(100, ($load[0] / max(1, $cpuCount)) * 100);
                return round($loadPercent, 1);
            }
        }
        
        // Try to get CPU usage via exec (if available)
        if (function_exists('exec') && !in_array('exec', explode(',', ini_get('disable_functions')))) {
            $output = [];
            $result = exec('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk \'{print 100 - $1}\'', $output);
            if (!empty($output) && is_numeric($output[0])) {
                return round((float) $output[0], 1);
            }
        }
        
        // Fallback: estimate based on memory usage (rough correlation)
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = $this->parseMemoryLimit(ini_get('memory_limit'));
        $memoryPercent = $memoryLimit > 0 ? ($memoryUsage / $memoryLimit) * 100 : 50;
        
        // Use a conservative estimate (lower than memory usage)
        return round(min(80, $memoryPercent * 0.6), 1);
    }

    /**
     * Get CPU core count
     */
    protected function getCpuCount(): int
    {
        if (function_exists('exec') && !in_array('exec', explode(',', ini_get('disable_functions')))) {
            $output = [];
            exec('nproc', $output);
            if (!empty($output) && is_numeric($output[0])) {
                return (int) $output[0];
            }
            
            // Try alternative method
            exec('sysctl -n hw.ncpu', $output);
            if (!empty($output) && is_numeric($output[0])) {
                return (int) $output[0];
            }
        }
        
        // Fallback: assume 4 cores
        return 4;
    }

    /**
     * Get overall system status
     */
    protected function getOverallSystemStatus(array $percentages): string
    {
        $maxPercent = max($percentages);
        
        if ($maxPercent >= 90) return 'critical';
        if ($maxPercent >= 70) return 'warning';
        return 'healthy';
    }

    /**
     * Parse memory limit string to bytes
     */
    protected function parseMemoryLimit(string $limit): int
    {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit) - 1]);
        $value = (int) $limit;
        
        switch ($last) {
            case 'g':
                $value *= 1024 * 1024 * 1024;
                break;
            case 'm':
                $value *= 1024 * 1024;
                break;
            case 'k':
                $value *= 1024;
                break;
        }
        
        return $value;
    }

    /**
     * Format bytes to human readable format
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Scope activity logs based on user role
     */
    protected function scopeActivityLogsByRole($query, $user)
    {
        // Super Admin: Show all activity logs
        if ($user->hasRole('super-admin')) {
            return $query;
        }

        // Clinic Owner, Clinic Manager, or Clinic Sub Admin: Show clinic-related activity logs
        if ($user->hasRole(['clinic', 'clinic_manager'])) {
            // Get all clinic IDs this user has access to using User model method
            $clinicIds = collect($this->getUserAccessibleClinicIds($user));
            
            // Get all clinic manager user IDs from clinics this user has access to using user relationship
            $clinicManagerIds = collect();
            if ($clinicIds->isNotEmpty()) {
                // Use user relationship to get clinic managers
                $clinicManagerIds = \App\Models\User::role(['clinic_manager'])
                    ->whereHas('clinics', function ($q) use ($clinicIds) {
                        $q->whereIn('clinics.id', $clinicIds);
                    })
                    ->pluck('id');
            }

            return $query->where(function ($q) use ($user, $clinicIds, $clinicManagerIds) {
                // Activities where causer is the user themselves
                $q->where(function ($subQ) use ($user) {
                    $subQ->where('causer_type', \App\Models\User::class)
                        ->where('causer_id', $user->id);
                })
                // Activities where subject is a Clinic the user has access to
                ->orWhere(function ($subQ) use ($clinicIds) {
                    if ($clinicIds->isNotEmpty()) {
                        $subQ->where('subject_type', \App\Models\Clinic::class)
                            ->whereIn('subject_id', $clinicIds);
                    } else {
                        $subQ->whereRaw('1 = 0');
                    }
                })
                // Activities where subject is a Booking for clinics the user has access to
                ->orWhere(function ($subQ) use ($clinicIds) {
                    if ($clinicIds->isNotEmpty()) {
                        $subQ->where('subject_type', \App\Models\Booking::class)
                            ->whereIn('subject_id', function ($bookingQuery) use ($clinicIds) {
                                $bookingQuery->select('id')
                                    ->from('bookings')
                                    ->whereIn('clinic_id', $clinicIds);
                            });
                    } else {
                        $subQ->whereRaw('1 = 0');
                    }
                })
                // Activities where causer is a clinic manager from clinics the user has access to
                ->orWhere(function ($subQ) use ($clinicManagerIds) {
                    if ($clinicManagerIds->isNotEmpty()) {
                        $subQ->where('causer_type', \App\Models\User::class)
                            ->whereIn('causer_id', $clinicManagerIds);
                    } else {
                        $subQ->whereRaw('1 = 0'); // No clinic managers, no results
                    }
                });
            });
        }

        // Other roles: No activity logs access
        return $query->whereRaw('1 = 0');
    }
}

