<?php

namespace Database\Seeders;

use App\Models\roles;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin', 'guard_name' => 'web'],
            ['name' => 'Project Manager', 'guard_name' => 'web'],
            ['name' => 'Member', 'guard_name' => 'web'],
        ];

        foreach ($roles as $role) {
            roles::create($role);
        }
    }
}