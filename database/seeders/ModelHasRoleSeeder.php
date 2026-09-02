<?php

namespace Database\Seeders;

use App\Models\model_has_roles;
use App\Models\roles;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModelHasRoleSeeder extends Seeder
{
    public function run(): void
    {
        $superadmin = roles::where('name', 'Superadmin')->first();
        $admin = roles::where('name', 'Admin')->first();
        $pm = roles::where('name', 'Project Manager')->first();
        $member = roles::where('name', 'Member')->first();

        // The first admin user owns Superadmin-level access (can delete users).
        $adminUser = User::where('email', 'admin1@example.com')->first();
        if ($adminUser && $superadmin) {
            model_has_roles::create([
                'role_id' => $superadmin->id,
                'model_type' => User::class,
                'model_id' => $adminUser->id,
            ]);
        }

        // Admins 2-4 get the Admin role.
        for ($i = 2; $i <= 4; $i++) {
            $user = User::where('email', "admin{$i}@example.com")->first();
            if ($user && $admin) {
                model_has_roles::create([
                    'role_id' => $admin->id,
                    'model_type' => User::class,
                    'model_id' => $user->id,
                ]);
            }
        }

        // Managers 1-6 get the Project Manager role.
        for ($i = 1; $i <= 6; $i++) {
            $user = User::where('email', "manager{$i}@example.com")->first();
            if ($user && $pm) {
                model_has_roles::create([
                    'role_id' => $pm->id,
                    'model_type' => User::class,
                    'model_id' => $user->id,
                ]);
            }
        }

        // Regular users 1-20 get the Member role.
        for ($i = 1; $i <= 20; $i++) {
            $user = User::where('email', "user{$i}@example.com")->first();
            if ($user && $member) {
                model_has_roles::create([
                    'role_id' => $member->id,
                    'model_type' => User::class,
                    'model_id' => $user->id,
                ]);
            }
        }
    }
}
