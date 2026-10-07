<?php

namespace App\Providers;

use App\Contracts\UserRepositoryInterface;
use App\Contracts\RoleRepositoryInterface;
use App\Contracts\ActivityLogRepositoryInterface;
use App\Contracts\NotificationRepositoryInterface;
use App\Contracts\BroadcastRepositoryInterface;
use App\Contracts\TreatmentRepositoryInterface;
use App\Contracts\ClinicRepositoryInterface;
use App\Contracts\BookingRepositoryInterface;
use App\Contracts\CategoryRepositoryInterface;
use App\Contracts\BannerRepositoryInterface;
use App\Contracts\FavoriteRepositoryInterface;
use App\Contracts\AddressRepositoryInterface;
use App\Contracts\PaymentMethodRepositoryInterface;
use App\Contracts\FAQRepositoryInterface;
use App\Contracts\ReviewRepositoryInterface;
use App\Contracts\BookingReasonRepositoryInterface;
use App\Contracts\PaymentRepositoryInterface;
use App\Contracts\GovernorateRepositoryInterface;
use App\Contracts\AreaRepositoryInterface;
use App\Contracts\MachineRepositoryInterface;
use App\Contracts\TreatmentSlotRepositoryInterface;
use App\Contracts\ClinicSubscriptionRepositoryInterface;
use App\Contracts\ContactRepositoryInterface;
use App\Contracts\TransactionRepositoryInterface;
use App\Contracts\ClinicEarningRepositoryInterface;
use App\Contracts\ClinicPayoutRepositoryInterface;
use App\Contracts\ClinicOperatingHourRepositoryInterface;
use App\Contracts\BookingDocumentRepositoryInterface;
use App\Contracts\SupportRepositoryInterface;
use App\Contracts\MediaRepositoryInterface;
use App\Contracts\PaymentTransactionRepositoryInterface;
use App\Contracts\WalletRepositoryInterface;
use App\Contracts\WalletTransactionRepositoryInterface;
use App\Repositories\UserRepository;
use App\Repositories\RoleRepository;
use App\Repositories\ActivityLogRepository;
use App\Repositories\NotificationRepository;
use App\Repositories\BroadcastRepository;
use App\Repositories\TreatmentRepository;
use App\Repositories\ClinicRepository;
use App\Repositories\BookingRepository;
use App\Repositories\CategoryRepository;
use App\Repositories\BannerRepository;
use App\Repositories\BookingReasonRepository;
use App\Repositories\FavoriteRepository;
use App\Repositories\AddressRepository;
use App\Repositories\PaymentMethodRepository;
use App\Repositories\FAQRepository;
use App\Repositories\ReviewRepository;
use App\Repositories\PaymentRepository;
use App\Repositories\GovernorateRepository;
use App\Repositories\AreaRepository;
use App\Repositories\MachineRepository;
use App\Repositories\TreatmentSlotRepository;
use App\Repositories\ClinicSubscriptionRepository;
use App\Repositories\ContactRepository;
use App\Repositories\TransactionRepository;
use App\Repositories\ClinicEarningRepository;
use App\Repositories\ClinicPayoutRepository;
use App\Repositories\ClinicOperatingHourRepository;
use App\Repositories\BookingDocumentRepository;
use App\Repositories\SupportRepository;
use App\Repositories\MediaRepository;
use App\Repositories\PaymentTransactionRepository;
use App\Repositories\WalletRepository;
use App\Repositories\WalletTransactionRepository;
use App\Models\User;
use App\Models\Role;
use App\Models\Notification;
use App\Models\Broadcast;
use App\Models\Treatment;
use App\Models\Clinic;
use App\Models\Booking;
use App\Models\Category;
use App\Models\Banner;
use App\Models\BookingReason;
use App\Models\Favorite;
use App\Models\Address;
use App\Models\PaymentMethod;
use App\Models\Faq;
use App\Models\Review;
use App\Models\Transaction;
use App\Models\Contact;
use App\Models\Governorate;
use App\Models\Area;
use App\Models\Machine;
use App\Models\TreatmentSlot;
use App\Models\ClinicSubscription;
use App\Models\ClinicEarning;
use App\Models\ClinicPayout;
use App\Models\ClinicOperatingHour;
use App\Models\BookingDocument;
use App\Models\Media;
use App\Models\PaymentTransaction;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Passwords\PasswordBrokerManager;
use App\Auth\CustomPasswordBrokerManager;
use App\Services\DeviceInfoService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Override the password broker manager to use custom token repository
        $this->app->singleton('auth.password', function ($app) {
            return new CustomPasswordBrokerManager($app);
        });
        // Register User Repository
        $this->app->singleton(UserRepositoryInterface::class, function ($app) {
            return new UserRepository(new User());
        });

        // Register Role Repository
        $this->app->singleton(RoleRepositoryInterface::class, function ($app) {
            return new RoleRepository(new Role());
        });

        // Register Activity Log Repository
        $this->app->singleton(ActivityLogRepositoryInterface::class, function ($app) {
            return new ActivityLogRepository(new Activity());
        });

        // Register Notification Repository
        $this->app->singleton(NotificationRepositoryInterface::class, function ($app) {
            return new NotificationRepository(new Notification());
        });

        // Register Broadcast Repository
        $this->app->singleton(BroadcastRepositoryInterface::class, function ($app) {
            return new BroadcastRepository(new Broadcast());
        });

        // Register Treatment Repository
        $this->app->singleton(TreatmentRepositoryInterface::class, function ($app) {
            return new TreatmentRepository(new Treatment());
        });

        // Register Clinic Repository
        $this->app->singleton(ClinicRepositoryInterface::class, function ($app) {
            return new ClinicRepository(new Clinic());
        });

        // Register Booking Repository
        $this->app->singleton(BookingRepositoryInterface::class, function ($app) {
            return new BookingRepository(new Booking());
        });

        // Register Category Repository
        $this->app->singleton(CategoryRepositoryInterface::class, function ($app) {
            return new CategoryRepository(new Category());
        });

        // Register Banner Repository
        $this->app->singleton(BannerRepositoryInterface::class, function ($app) {
            return new BannerRepository(new Banner());
        });

        // Register Favorite Repository
        $this->app->singleton(FavoriteRepositoryInterface::class, function ($app) {
            return new FavoriteRepository(new Favorite());
        });

        // Register Address Repository
        $this->app->singleton(AddressRepositoryInterface::class, function ($app) {
            return new AddressRepository(new Address());
        });

        // Register Payment Method Repository
        $this->app->singleton(PaymentMethodRepositoryInterface::class, function ($app) {
            return new PaymentMethodRepository(new PaymentMethod());
        });

        // Register FAQ Repository
        $this->app->singleton(FAQRepositoryInterface::class, function ($app) {
            return new FAQRepository(new Faq());
        });

        // Register Review Repository
        $this->app->singleton(ReviewRepositoryInterface::class, function ($app) {
            return new ReviewRepository(new Review());
        });

        // Register Payment Repository
        $this->app->singleton(PaymentRepositoryInterface::class, function ($app) {
            return new PaymentRepository(new Transaction());
        });

        // Register Booking Reason Repository
        $this->app->singleton(BookingReasonRepositoryInterface::class, function ($app) {
            return new BookingReasonRepository(new BookingReason());
        });

        // Register Governorate Repository
        $this->app->singleton(GovernorateRepositoryInterface::class, function ($app) {
            return new GovernorateRepository(new Governorate());
        });

        // Register Area Repository
        $this->app->singleton(AreaRepositoryInterface::class, function ($app) {
            return new AreaRepository(new Area());
        });

        // Register Machine Repository
        $this->app->singleton(MachineRepositoryInterface::class, function ($app) {
            return new MachineRepository(new Machine());
        });

        // Register Treatment Slot Repository
        $this->app->singleton(TreatmentSlotRepositoryInterface::class, function ($app) {
            return new TreatmentSlotRepository(new TreatmentSlot());
        });

        // Register Clinic Subscription Repository
        $this->app->singleton(ClinicSubscriptionRepositoryInterface::class, function ($app) {
            return new ClinicSubscriptionRepository(new ClinicSubscription());
        });

        // Register Contact Repository
        $this->app->singleton(ContactRepositoryInterface::class, function ($app) {
            return new ContactRepository(new Contact());
        });

        // Register Transaction Repository
        $this->app->singleton(TransactionRepositoryInterface::class, function ($app) {
            return new TransactionRepository(new Transaction());
        });

        // Register Clinic Earning Repository
        $this->app->singleton(ClinicEarningRepositoryInterface::class, function ($app) {
            return new ClinicEarningRepository(new ClinicEarning());
        });

        // Register Clinic Payout Repository
        $this->app->singleton(ClinicPayoutRepositoryInterface::class, function ($app) {
            return new ClinicPayoutRepository(new ClinicPayout());
        });

        // Register Clinic Operating Hour Repository
        $this->app->singleton(ClinicOperatingHourRepositoryInterface::class, function ($app) {
            return new ClinicOperatingHourRepository(new ClinicOperatingHour());
        });

        // Register Booking Document Repository
        $this->app->singleton(BookingDocumentRepositoryInterface::class, function ($app) {
            return new BookingDocumentRepository(new BookingDocument());
        });

        // Register Support Repository
        $this->app->singleton(SupportRepositoryInterface::class, function ($app) {
            return new SupportRepository(new Contact());
        });

        // Register Media Repository
        $this->app->singleton(MediaRepositoryInterface::class, function ($app) {
            return new MediaRepository(new Media());
        });

        // Register Payment Transaction Repository
        $this->app->singleton(PaymentTransactionRepositoryInterface::class, function ($app) {
            return new PaymentTransactionRepository(new PaymentTransaction());
        });

        // Register Wallet Transaction Repository (must be registered before WalletRepository)
        $this->app->singleton(WalletTransactionRepositoryInterface::class, function ($app) {
            return new WalletTransactionRepository(new WalletTransaction());
        });

        // Register Wallet Repository
        $this->app->singleton(WalletRepositoryInterface::class, function ($app) {
            return new WalletRepository(
                new Wallet(),
                $app->make(WalletTransactionRepositoryInterface::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Add device information to all activity logs when they are created
        // Using a dedicated service with caching for better performance
        Activity::creating(function (Activity $activity) {
            $request = request();
            if (!$request) {
                return;
            }

            // Get device info from service (cached per user agent)
            $deviceProperties = DeviceInfoService::getDeviceInfo($request);

            // Merge with existing properties
            $existingProperties = $activity->properties ? $activity->properties->toArray() : [];
            $activity->properties = array_merge($existingProperties, $deviceProperties);
        });
    }
}
