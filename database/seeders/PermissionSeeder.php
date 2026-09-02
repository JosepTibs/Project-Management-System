<?php

namespace Database\Seeders;

use App\Models\permissions;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'view projects', 'guard_name' => 'web'],
            ['name' => 'create projects', 'guard_name' => 'web'],
            ['name' => 'edit projects', 'guard_name' => 'web'],
            ['name' => 'delete projects', 'guard_name' => 'web'],
            ['name' => 'view work items', 'guard_name' => 'web'],
            ['name' => 'create work items', 'guard_name' => 'web'],
            ['name' => 'edit work items', 'guard_name' => 'web'],
            ['name' => 'delete work items', 'guard_name' => 'web'],
            ['name' => 'delete users', 'guard_name' => 'web'],
            ['name' => 'manage members', 'guard_name' => 'web'],
        ];

        foreach ($permissions as $permission) {
            permissions::create($permission);
        }
    }
}