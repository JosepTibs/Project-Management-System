<?php

namespace Database\Seeders;

use App\Models\model_has_roles;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModelHasRoleSeeder extends Seeder
{
    public function run(): void
    {
        // Admins 1-4 get role_id = 1 (Admin)
        for ($i = 1; $i <= 4; $i++) {
            $user = User::where('email', "admin{$i}@example.com")->first();
            if ($user) {
                model_has_roles::create([
                    'role_id' => 1,
                    'model_type' => User::class,
                    'model_id' => $user->id,
                ]);
            }
        }

        // Managers 1-6 get role_id = 2 (Project Manager)
        for ($i = 1; $i <= 6; $i++) {
            $user = User::where('email', "manager{$i}@example.com")->first();
            if ($user) {
                model_has_roles::create([
                    'role_id' => 2,
                    'model_type' => User::class,
                    'model_id' => $user->id,
                ]);
            }
        }

        // Regular users 1-20 get role_id = 3 (Member)
        for ($i = 1; $i <= 20; $i++) {
            $user = User::where('email', "user{$i}@example.com")->first();
            if ($user) {
                model_has_roles::create([
                    'role_id' => 3,
                    'model_type' => User::class,
                    'model_id' => $user->id,
                ]);
            }
        }
    }
}
