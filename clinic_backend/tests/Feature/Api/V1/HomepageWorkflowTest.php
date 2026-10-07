<?php

namespace Tests\Feature\Api\V1;

use App\Models\Role;
use App\Models\SiteSetting;
use App\Models\User;
use App\Models\Category;
use App\Models\Service;
use App\Models\Coupon;
use App\Models\Banner;
use App\Models\Faq;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class HomepageWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected string $baseUrl = '/api/v1';
    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        if (!Role::where('name', 'user')->exists()) {
            Role::create(['name' => 'user', 'guard_name' => 'web']);
        }
        if (!Role::where('name', 'vendor')->exists()) {
            Role::create(['name' => 'vendor', 'guard_name' => 'web']);
        }

        // Ensure OTP test mode is enabled
        SiteSetting::firstOrCreate(
            ['key' => 'otp_test_mode'],
            ['value' => '1', 'type' => 'boolean']
        );
        SiteSetting::firstOrCreate(
            ['key' => 'otp_provider'],
            ['value' => 'smsbox', 'type' => 'select']
        );

        // Create test user
        $this->user = User::factory()->create([
            'phone' => '+96550123456',
            'email' => 'testuser' . uniqid() . '@example.com',
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);
        $this->user->assignRole('user');

        // Login to get token
        $response = $this->postJson("{$this->baseUrl}/auth/login", [
            'phone' => '+96550123456',
            'password' => 'password123',
        ]);

        if ($response->status() === 200) {
            $this->token = $response->json('data.token.access_token') ?? $response->json('data.token.token');
        } else {
            $this->token = '';
        }
    }

    /**
     * Test home page endpoint
     */
    public function test_home_page(): void
    {
        // Create test data
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        // Create banners
        Banner::factory()->count(2)->create(['status' => 'active']);

        // Create services
        Service::factory()->count(5)->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
            'is_featured' => true,
        ]);

        Service::factory()->count(3)->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
            'is_featured' => false,
        ]);

        // Create deals
        Coupon::factory()->count(2)->create([
            'status' => 'active',
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("{$this->baseUrl}/home");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user',
                    'banners' => [
                        '*' => ['id', 'title']
                    ],
                    'categories' => [
                        '*' => ['id', 'name']
                    ],
                    'latest_services' => [
                        '*' => ['id', 'name', 'base_price', 'image_url', 'formatted_date', 'date']
                    ],
                    'deals' => [
                        '*' => ['id', 'title', 'discount_type', 'image_url']
                    ],
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);

        // Verify user data is returned when authenticated
        $data = $response->json('data');
        $this->assertNotNull($data['user']);
        $this->assertEquals($this->user->id, $data['user']['id']);
        $this->assertEquals($this->user->name, $data['user']['name']);
    }

    /**
     * Test home page endpoint without authentication
     */
    public function test_home_page_unauthenticated(): void
    {
        // Create test data
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        Banner::factory()->create(['status' => 'active']);
        Service::factory()->count(2)->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
        ]);

        // Create a new test case instance without setup user
        $response = $this->getJson("{$this->baseUrl}/home");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // User should be null when not authenticated
        $data = $response->json('data');
        // Note: HomeController returns user data if authenticated, null otherwise
        // This endpoint doesn't require auth, so user can be null
        $this->assertArrayHasKey('user', $data);
    }

    /**
     * Test latest services endpoint
     */
    public function test_latest_services(): void
    {
        // Create some test services
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        Service::factory()->count(5)->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
        ]);

        $response = $this->getJson("{$this->baseUrl}/home/latest-services?limit=10");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'services' => [
                        '*' => ['id', 'name', 'base_price', 'image_url', 'date']
                    ]
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test deals endpoint
     */
    public function test_deals_endpoint(): void
    {
        // Create test deals
        Coupon::factory()->count(3)->create([
            'status' => 'active',
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
        ]);

        $response = $this->getJson("{$this->baseUrl}/home/deals?limit=10");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'deals' => [
                        '*' => ['id', 'title', 'discount_type', 'image_url']
                    ]
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test deals with category filter
     */
    public function test_deals_with_category_filter(): void
    {
        $category = Category::factory()->create(['status' => 'active']);

        Coupon::factory()->create([
            'status' => 'active',
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
            'applicable_categories' => [$category->id],
        ]);

        $response = $this->getJson("{$this->baseUrl}/home/deals?category_id={$category->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test services filter endpoint
     */
    public function test_services_filter(): void
    {
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        Service::factory()->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
            'base_price' => 50,
            'average_rating' => 4.5,
        ]);

        $response = $this->postJson("{$this->baseUrl}/services/filter", [
            'category_ids' => [$category->id],
            'sort_by' => 'price_asc',
            'min_price' => 0,
            'max_price' => 100,
            'min_rating' => 4,
            'per_page' => 15,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'services' => [
                        '*' => ['id', 'name', 'base_price', 'image_url']
                    ],
                    'pagination' => [
                        'current_page',
                        'last_page',
                        'per_page',
                        'total'
                    ]
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test services list with category filter
     */
    public function test_services_with_category(): void
    {
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        Service::factory()->count(3)->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
        ]);

        $response = $this->getJson("{$this->baseUrl}/services?category_id={$category->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'services',
                    'pagination'
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test coupons list with category filter
     */
    public function test_coupons_with_category(): void
    {
        $category = Category::factory()->create(['status' => 'active']);

        Coupon::factory()->create([
            'status' => 'active',
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
            'applicable_categories' => [$category->id],
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("{$this->baseUrl}/coupons?category_id={$category->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'coupons' => [
                        '*' => ['id', 'title', 'code']
                    ]
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test categories endpoint
     */
    public function test_categories_endpoint(): void
    {
        Category::factory()->count(5)->create(['status' => 'active']);

        $response = $this->getJson("{$this->baseUrl}/home/categories");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'categories' => [
                        '*' => ['id', 'name', 'status']
                    ]
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test search endpoint
     */
    public function test_search_endpoint(): void
    {
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        Service::factory()->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
            'name_en' => 'Test Service',
        ]);

        $response = $this->getJson("{$this->baseUrl}/home/search?query=Test");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'services',
                    'vendors',
                    'search_query',
                    'total_results'
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test FAQs endpoint
     */
    public function test_faqs_endpoint(): void
    {
        // Create test FAQs
        \App\Models\Faq::factory()->count(3)->create([
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("{$this->baseUrl}/home/faqs");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'faqs' => [
                        '*' => ['id']
                    ]
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test latest services with limit parameter
     */
    public function test_latest_services_with_limit(): void
    {
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        // Create more than the limit
        Service::factory()->count(15)->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
        ]);

        $response = $this->getJson("{$this->baseUrl}/home/latest-services?limit=5");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertLessThanOrEqual(5, count($data['services']));
    }

    /**
     * Test deals with limit parameter
     */
    public function test_deals_with_limit(): void
    {
        Coupon::factory()->count(15)->create([
            'status' => 'active',
            'valid_from' => now()->subDay(),
            'valid_until' => now()->addDays(30),
        ]);

        $response = $this->getJson("{$this->baseUrl}/home/deals?limit=5");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertLessThanOrEqual(5, count($data['deals']));
    }

    /**
     * Test search with category filter
     */
    public function test_search_with_category(): void
    {
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        Service::factory()->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
            'name_en' => 'Massage Service',
        ]);

        $response = $this->getJson("{$this->baseUrl}/home/search?query=Massage&category_id={$category->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test search with location
     */
    public function test_search_with_location(): void
    {
        $category = Category::factory()->create(['status' => 'active']);
        $vendor = User::factory()->create(['status' => 'active']);
        $vendor->assignRole('vendor');

        Service::factory()->create([
            'category_id' => $category->id,
            'vendor_id' => $vendor->id,
            'status' => 'approved',
        ]);

        $response = $this->getJson("{$this->baseUrl}/home/search?query=test&latitude=29.3759&longitude=47.9774&radius=10");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}

