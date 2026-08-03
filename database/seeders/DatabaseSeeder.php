<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            RoleHasPermissionSeeder::class,
            UserSeeder::class,
            ModelHasRoleSeeder::class,
            ProjectSeeder::class,
            ProjectMemberSeeder::class,
            WorkItemStatusSeeder::class,
            MilestoneSeeder::class,
            WorkItemGroupSeeder::class,
            WorkItemSeeder::class,
            ActivityLogSeeder::class,
            LoginActivitySeeder::class,
        ]);
    }
}
