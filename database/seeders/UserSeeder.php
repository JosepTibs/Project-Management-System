<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create 1 admin user
        User::create([
            'username' => 'admin',
            'fname' => 'Admin',
            'lname' => 'User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        // Create 1 manager user
        User::create([
            'username' => 'manager',
            'fname' => 'Manager',
            'lname' => 'User',
            'email' => 'manager@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        // Create 8 regular users
        for ($i = 1; $i <= 8; $i++) {
            User::create([
                'username' => "user{$i}",
                'fname' => "User",
                'lname' => "{$i}",
                'email' => "user{$i}@example.com",
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]);
        }
    }
}