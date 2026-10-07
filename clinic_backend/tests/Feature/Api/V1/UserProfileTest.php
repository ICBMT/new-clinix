<?php

namespace Tests\Feature\Api\V1;

use App\Models\Role;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserProfileTest extends TestCase
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
     * Test get user profile
     */
    public function test_get_user_profile(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("{$this->baseUrl}/user/profile");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'name', 'email', 'phone']
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);

        // Verify user data
        $userData = $response->json('data.user');
        $this->assertEquals($this->user->id, $userData['id']);
        $this->assertEquals($this->user->name, $userData['name']);
    }

    /**
     * Test update user profile
     */
    public function test_update_user_profile(): void
    {
        $newName = 'Updated Name';
        $newEmail = 'updated' . uniqid() . '@example.com';

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("{$this->baseUrl}/user/profile", [
                'name' => $newName,
                'email' => $newEmail,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'name', 'email']
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);

        // Verify user was updated
        $this->user->refresh();
        $this->assertEquals($newName, $this->user->name);
        $this->assertEquals($newEmail, $this->user->email);
    }

    /**
     * Test upload avatar
     */
    public function test_upload_avatar(): void
    {
        // Create a fake image file
        $file = \Illuminate\Http\UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->post("{$this->baseUrl}/user/avatar", [
                'avatar' => $file,
            ], [
                'Accept' => 'application/json',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id'],
                    'avatar_url'
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test delete user account
     */
    public function test_delete_user_account(): void
    {
        $userId = $this->user->id;

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("{$this->baseUrl}/user/account", [
                'password' => 'password123',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message'
            ])
            ->assertJson([
                'success' => true,
            ]);

        // Verify user is soft deleted
        $this->assertSoftDeleted('users', ['id' => $userId]);
    }
}

