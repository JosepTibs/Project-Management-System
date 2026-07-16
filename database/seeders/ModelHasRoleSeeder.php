<?php

namespace Database\Seeders;

use App\Models\model_has_roles;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModelHasRoleSeeder extends Seeder
{
    public function run(): void
    {
        // Admin gets role_id = 1 (Admin)
        $admin = User::where('email', 'admin@example.com')->first();
        model_has_roles::create([
            'role_id' => 1,
            'model_type' => User::class,
            'model_id' => $admin->id,
        ]);

        // Manager gets role_id = 2 (Project Manager)
        $manager = User::where('email', 'manager@example.com')->first();
        model_has_roles::create([
            'role_id' => 2,
            'model_type' => User::class,
            'model_id' => $manager->id,
        ]);

        // Users 1-4 get role_id = 2 (Project Manager)
        for ($i = 1; $i <= 4; $i++) {
            $user = User::where('email', "user{$i}@example.com")->first();
            model_has_roles::create([
                'role_id' => 2,
                'model_type' => User::class,
                'model_id' => $user->id,
            ]);
        }

        // Users 5-8 get role_id = 3 (Member)
        for ($i = 5; $i <= 8; $i++) {
            $user = User::where('email', "user{$i}@example.com")->first();
            model_has_roles::create([
                'role_id' => 3,
                'model_type' => User::class,
                'model_id' => $user->id,
            ]);
        }
    }
}