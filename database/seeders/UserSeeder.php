<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create 4 admin users
        $admins = [
            ['fname' => 'John', 'lname' => 'Administrator', 'username' => 'john.administrator'],
            ['fname' => 'Emma', 'lname' => 'Administrator', 'username' => 'emma.administrator'],
            ['fname' => 'Michael', 'lname' => 'Administrator', 'username' => 'michael.administrator'],
            ['fname' => 'Sarah', 'lname' => 'Administrator', 'username' => 'sarah.administrator'],
        ];

        foreach ($admins as $index => $admin) {
            $fullName = "{$admin['fname']} {$admin['lname']}";
            User::updateOrCreate(
                ['email' => 'admin'.($index + 1).'@example.com'],
                [
                    'username' => $admin['username'],
                    'fname' => $admin['fname'],
                    'lname' => $admin['lname'],
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]
            );
        }

        // Create 6 manager users
        $managers = [
            ['fname' => 'Manager', 'lname' => 'User', 'username' => 'manager.user'],
            ['fname' => 'Jessica', 'lname' => 'Manager', 'username' => 'jessica.manager'],
            ['fname' => 'David', 'lname' => 'Manager', 'username' => 'david.manager'],
            ['fname' => 'Jennifer', 'lname' => 'Manager', 'username' => 'jennifer.manager'],
            ['fname' => 'Robert', 'lname' => 'Manager', 'username' => 'robert.manager'],
            ['fname' => 'Amanda', 'lname' => 'Manager', 'username' => 'amanda.manager'],
        ];

        foreach ($managers as $index => $manager) {
            $fullName = "{$manager['fname']} {$manager['lname']}";
            User::updateOrCreate(
                ['email' => 'manager'.($index + 1).'@example.com'],
                [
                    'username' => $manager['username'],
                    'fname' => $manager['fname'],
                    'lname' => $manager['lname'],
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]
            );
        }

        // Create 20 regular users with human names
        $users = [
            ['fname' => 'James', 'lname' => 'Johnson', 'username' => 'james.johnson'],
            ['fname' => 'Emily', 'lname' => 'Williams', 'username' => 'emily.williams'],
            ['fname' => 'Christopher', 'lname' => 'Brown', 'username' => 'christopher.brown'],
            ['fname' => 'Ashley', 'lname' => 'Davis', 'username' => 'ashley.davis'],
            ['fname' => 'Matthew', 'lname' => 'Miller', 'username' => 'matthew.miller'],
            ['fname' => 'Amanda', 'lname' => 'Wilson', 'username' => 'amanda.wilson'],
            ['fname' => 'Andrew', 'lname' => 'Moore', 'username' => 'andrew.moore'],
            ['fname' => 'Stephanie', 'lname' => 'Taylor', 'username' => 'stephanie.taylor'],
            ['fname' => 'Daniel', 'lname' => 'Anderson', 'username' => 'daniel.anderson'],
            ['fname' => 'Nicole', 'lname' => 'Thomas', 'username' => 'nicole.thomas'],
            ['fname' => 'Ryan', 'lname' => 'Jackson', 'username' => 'ryan.jackson'],
            ['fname' => 'Lauren', 'lname' => 'White', 'username' => 'lauren.white'],
            ['fname' => 'William', 'lname' => 'Harris', 'username' => 'william.harris'],
            ['fname' => 'Michelle', 'lname' => 'Martin', 'username' => 'michelle.martin'],
            ['fname' => 'Kevin', 'lname' => 'Thompson', 'username' => 'kevin.thompson'],
            ['fname' => 'Elizabeth', 'lname' => 'Garcia', 'username' => 'elizabeth.garcia'],
            ['fname' => 'Ryan', 'lname' => 'Martinez', 'username' => 'ryan.martinez'],
            ['fname' => 'Rachel', 'lname' => 'Robinson', 'username' => 'rachel.robinson'],
            ['fname' => 'Brandon', 'lname' => 'Clark', 'username' => 'brandon.clark'],
            ['fname' => 'Samantha', 'lname' => 'Rodriguez', 'username' => 'samantha.rodriguez'],
        ];

        foreach ($users as $index => $user) {
            $fullName = "{$user['fname']} {$user['lname']}";
            User::updateOrCreate(
                ['email' => 'user'.($index + 1).'@example.com'],
                [
                    'username' => $user['username'],
                    'fname' => $user['fname'],
                    'lname' => $user['lname'],
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
