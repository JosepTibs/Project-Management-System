<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create or update 1 admin user
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'username' => 'admin',
                'fname' => 'Admin',
                'lname' => 'User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create or update 1 manager user
        User::updateOrCreate(
            ['email' => 'manager@example.com'],
            [
                'username' => 'manager',
                'fname' => 'Manager',
                'lname' => 'User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create or update 8 regular users
        for ($i = 1; $i <= 8; $i++) {
            User::updateOrCreate(
                ['email' => "user{$i}@example.com"],
                [
                    'username' => "user{$i}",
                    'fname' => "User",
                    'lname' => "{$i}",
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}