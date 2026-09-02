<?php

namespace Tests\Feature;

use App\Models\milestones;
use App\Models\permissions;
use App\Models\project_members;
use App\Models\projects;
use App\Models\role_has_permissions;
use App\Models\roles;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_groups;
use App\Models\work_item_statuses;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkItemGroupAndDeletionTest extends TestCase
{
    use RefreshDatabase;

    private function makeRole(string $name, array $permissionNames = []): roles
    {
        $role = roles::create(['name' => $name, 'guard_name' => 'web']);

        foreach ($permissionNames as $permissionName) {
            $permission = permissions::create(['name' => $permissionName, 'guard_name' => 'web']);
            role_has_permissions::create([
                'role_id' => $role->id,
                'permission_id' => $permission->id,
            ]);
        }

        return $role;
    }

    private function makeMember(User $user, projects $project): void
    {
        project_members::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_work_item_can_be_created_without_a_group(): void
    {
        $user = User::factory()->create();
        $project = projects::create([
            'name' => 'Optional Groups',
            'created_by' => $user->id,
            'item_prefix' => 'TST',
            'description' => 'Test project',
        ]);
        $this->makeMember($user, $project);
        $status = work_item_statuses::create([
            'project_id' => $project->id,
            'name' => 'To Do',
            'order' => 1,
            'color' => '#6b7280',
        ]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/work-items", [
            'title' => 'Ungrouped task',
            'description' => 'Sits outside any work item group.',
            'status_id' => $status->id,
            'group_id' => null,
            'assignee_id' => null,
            'priority' => 'medium',
            'due_date' => now()->addDay()->toDateString(),
            'progress' => 0,
        ]);

        $response->assertRedirect();

        $item = work_item::where('title', 'Ungrouped task')->first();
        $this->assertNotNull($item);
        $this->assertNull($item->group_id);
    }

    public function test_group_progress_and_assignees_are_persisted(): void
    {
        // Project restructuring via the setup endpoint is manager/admin only,
        // so the acting user needs a privileged system role.
        $managerRole = $this->makeRole('Manager');
        $user = User::factory()->create();
        $user->roles()->attach($managerRole);
        $project = projects::create([
            'name' => 'Team Groups',
            'created_by' => $user->id,
            'item_prefix' => 'TST',
            'description' => 'Test project',
        ]);
        $this->makeMember($user, $project);

        $milestone = milestones::create([
            'project_id' => $project->id,
            'name' => 'Sprint A',
            'order' => 1,
        ]);
        $group = work_item_groups::create([
            'project_id' => $project->id,
            'milestone_id' => $milestone->id,
            'name' => 'Design Team',
            'description' => '',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'progress' => 0,
        ]);

        $response = $this->actingAs($user)->put("/projects/{$project->id}/setup", [
            'milestones' => [[
                'id' => $milestone->id,
                'name' => 'Sprint A',
                'groups' => [[
                    'id' => $group->id,
                    'name' => 'Design Team',
                    'progress' => 80,
                    'assignee_ids' => [$user->id],
                    'work_items' => [],
                ]],
            ]],
        ]);

        $response->assertRedirect();

        $group->refresh();
        $this->assertSame(80, $group->progress);
        $this->assertTrue($group->assignees->contains('id', $user->id));
    }

    public function test_superadmin_can_delete_a_user(): void
    {
        $superadminRole = $this->makeRole('Superadmin', ['delete users']);
        $superadmin = User::factory()->create();
        $superadmin->roles()->attach($superadminRole);

        $target = User::factory()->create();

        $response = $this->actingAs($superadmin)->delete("/users/{$target->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    public function test_admin_without_delete_permission_cannot_delete_a_user(): void
    {
        $adminRole = $this->makeRole('Admin', ['view projects']);
        $admin = User::factory()->create();
        $admin->roles()->attach($adminRole);

        $target = User::factory()->create();

        $response = $this->actingAs($admin)->delete("/users/{$target->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    public function test_superadmin_cannot_delete_another_superadmin(): void
    {
        $superadminRole = $this->makeRole('Superadmin', ['delete users']);
        $a = User::factory()->create();
        $b = User::factory()->create();
        $a->roles()->attach($superadminRole);
        $b->roles()->attach($superadminRole);

        $response = $this->actingAs($a)->delete("/users/{$b->id}");

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $b->id]);
    }
}