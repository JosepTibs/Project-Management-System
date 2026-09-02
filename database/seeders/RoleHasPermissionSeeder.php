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
        // Superadmin gets every permission, including the user-deletion one.
        $superadminRole = roles::where('name', 'Superadmin')->first();
        if ($superadminRole) {
            $allPermissionIds = permissions::pluck('id')->toArray();
            foreach ($allPermissionIds as $permId) {
                role_has_permissions::create([
                    'role_id' => $superadminRole->id,
                    'permission_id' => $permId,
                ]);
            }
        }

        // Admin gets all permissions except 'delete users' (reserved for Superadmin).
        $adminRole = roles::where('name', 'Admin')->first();
        if ($adminRole) {
            $adminPermissions = permissions::whereNotIn('name', ['delete users'])->pluck('id')->toArray();
            foreach ($adminPermissions as $permId) {
                role_has_permissions::create([
                    'role_id' => $adminRole->id,
                    'permission_id' => $permId,
                ]);
            }
        }

        // Project Manager gets most permissions except delete
        $pmRole = roles::where('name', 'Project Manager')->first();
        $pmPermissions = permissions::whereNotIn('name', ['delete projects', 'delete work items', 'delete users'])->pluck('id')->toArray();
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