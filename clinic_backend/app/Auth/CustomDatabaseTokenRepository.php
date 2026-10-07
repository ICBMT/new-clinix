<?php

namespace App\Auth;

use Illuminate\Auth\Passwords\DatabaseTokenRepository as BaseDatabaseTokenRepository;
use Illuminate\Support\Carbon;

class CustomDatabaseTokenRepository extends BaseDatabaseTokenRepository
{
    /**
     * Build the record payload for the table.
     *
     * @param  string  $email
     * @param  string  $token
     * @return array
     */
    protected function getPayload($email, #[\SensitiveParameter] $token)
    {
        // Generate a unique ID for the token
        $id = uniqid('email_', true);
        
        return [
            'id' => $id,
            'email' => $email,
            'token' => $this->hasher->make($token),
            'created_at' => new Carbon,
        ];
    }
}

