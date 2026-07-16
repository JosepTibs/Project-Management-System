<?php

namespace Database\Seeders;

use App\Models\permissions;
use App\Models\role_has_permissions;
use App\Models\roles;
use Illuminate\Database\Seeder;

class RoleHasPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Give all permissions to Admin (role_id = 1)
        $adminRole = roles::where('name', 'Admin')->first();
        $allPermissionIds = permissions::pluck('id')->toArray();
        foreach ($allPermissionIds as $permId) {
            role_has_permissions::create([
                'role_id' => $adminRole->id,
                'permission_id' => $permId,
            ]);
        }

        // Project Manager gets most permissions except delete
        $pmRole = roles::where('name', 'Project Manager')->first();
        $pmPermissions = permissions::whereNotIn('name', ['delete projects', 'delete work items'])->pluck('id')->toArray();
        foreach ($pmPermissions as $permId) {
            role_has_permissions::create([
                'role_id' => $pmRole->id,
                'permission_id' => $permId,
            ]);
        }

        // Member gets view-only + create work items
        $memberRole = roles::where('name', 'Member')->first();
        $memberPermissions = permissions::whereIn('name', [
            'view projects',
            'view work items',
            'create work items',
            'edit work items',
        ])->pluck('id')->toArray();
        foreach ($memberPermissions as $permId) {
            role_has_permissions::create([
                'role_id' => $memberRole->id,
                'permission_id' => $permId,
            ]);
        }
    }
}