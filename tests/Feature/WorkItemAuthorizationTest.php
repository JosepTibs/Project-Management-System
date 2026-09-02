<?php

namespace Tests\Feature;

use App\Models\project_members;
use App\Models\projects;
use App\Models\roles;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_statuses;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Authorization rules for work items:
 *  - Admins may do anything; superadmins bypass all gates.
 *  - Managers may fully manage only projects they own (created_by); inside
 *    other visible projects they fall back to member-level rules.
 *  - Assignees/collaborators may ONLY update progress and status of their own
 *    items — never any other field.
 *  - Project restructuring (PUT setup) is admin/owner-manager only.
 */
class WorkItemAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function makeRole(string $name): roles
    {
        return roles::create(['name' => $name, 'guard_name' => 'web']);
    }

    private function makeUserWithRole(?string $roleName): User
    {
        $user = User::factory()->create();

        if ($roleName) {
            $user->roles()->attach($this->makeRole($roleName));
        }

        return $user;
    }

    private function makeProject(User $owner): projects
    {
        return projects::create([
            'name' => 'Auth Test Project',
            'created_by' => $owner->id,
            'item_prefix' => 'AUT',
            'description' => 'Test project',
        ]);
    }

    private function makeStatus(projects $project, string $name = 'To Do'): work_item_statuses
    {
        return work_item_statuses::create([
            'project_id' => $project->id,
            'name' => $name,
            'order' => 1,
            'color' => '#6b7280',
        ]);
    }

    private function makeItem(projects $project, ?int $assigneeId, array $overrides = []): work_item
    {
        $status = $this->makeStatus($project);

        return work_item::create(array_merge([
            'project_id' => $project->id,
            'status_id' => $status->id,
            'group_id' => null,
            'title' => 'My task',
            'description' => '',
            'assignee_id' => $assigneeId,
            'priority' => 'medium',
            'progress' => 10,
            'due_date' => now()->addWeek()->toDateString(),
        ], $overrides));
    }

    public function test_assignee_cannot_full_edit_own_item(): void
    {
        $member = $this->makeUserWithRole(null);
        $item = $this->makeItem($this->makeProject($this->makeUserWithRole('manager')), $member->id);

        $response = $this->actingAs($member)->patch(
            "/projects/{$item->project_id}/work-items/{$item->id}",
            ['title' => 'Hijacked title', 'due_date' => now()->addWeek()->toDateString()]
        );

        $response->assertForbidden();
        $this->assertDatabaseHas('work_items', ['id' => $item->id, 'title' => 'My task']);
    }

    public function test_assignee_can_update_progress_of_own_item(): void
    {
        $member = $this->makeUserWithRole(null);
        $project = $this->makeProject($this->makeUserWithRole('manager'));
        $item = $this->makeItem($project, $member->id);
        project_members::create(['project_id' => $project->id, 'user_id' => $member->id]);

        $response = $this->actingAs($member)->patch(
            "/projects/{$project->id}/work-items/{$item->id}/progress",
            ['progress' => 55]
        );

        $response->assertRedirect();
        $item->refresh();
        $this->assertSame(55, $item->progress);
    }

    public function test_assignee_can_update_status_of_own_item(): void
    {
        $member = $this->makeUserWithRole(null);
        $project = $this->makeProject($this->makeUserWithRole('manager'));
        $item = $this->makeItem($project, $member->id);
        $done = $this->makeStatus($project, 'Done');
        project_members::create(['project_id' => $project->id, 'user_id' => $member->id]);

        $response = $this->actingAs($member)->patch("/work-items/{$item->id}/status", [
            'status_id' => $done->id,
        ]);

        $response->assertRedirect();
        $item->refresh();
        $this->assertSame($done->id, $item->status_id);
    }

    public function test_non_assigned_member_cannot_update_status_of_others_item(): void
    {
        $stranger = $this->makeUserWithRole(null);
        $project = $this->makeProject($this->makeUserWithRole('manager'));
        $item = $this->makeItem($project, null);
        $done = $this->makeStatus($project, 'Done');
        project_members::create(['project_id' => $project->id, 'user_id' => $stranger->id]);

        $response = $this->actingAs($stranger)->patch("/work-items/{$item->id}/status", [
            'status_id' => $done->id,
        ]);

        $response->assertForbidden();
        $item->refresh();
        $this->assertNotSame($done->id, $item->status_id);
    }

    public function test_collaborator_can_update_status_of_shared_item(): void
    {
        $collaborator = $this->makeUserWithRole(null);
        $project = $this->makeProject($this->makeUserWithRole('manager'));
        $item = $this->makeItem($project, null);
        $inProgress = $this->makeStatus($project, 'In Progress');
        project_members::create(['project_id' => $project->id, 'user_id' => $collaborator->id]);
        $item->collaborators()->attach($collaborator->id);

        $response = $this->actingAs($collaborator)->patch("/work-items/{$item->id}/status", [
            'status_id' => $inProgress->id,
        ]);

        $response->assertRedirect();
        $item->refresh();
        $this->assertSame($inProgress->id, $item->status_id);
    }

    public function test_manager_can_full_edit_items_in_owned_project(): void
    {
        $manager = $this->makeUserWithRole('manager');
        $project = $this->makeProject($manager);
        $item = $this->makeItem($project, null);

        $response = $this->actingAs($manager)->patch(
            "/projects/{$project->id}/work-items/{$item->id}",
            [
                'title' => 'Renamed by manager',
                'status_id' => $item->status_id,
                'priority' => 'medium',
                'due_date' => now()->addWeek()->toDateString(),
                'progress' => 40,
            ]
        );

        $response->assertRedirect();
        $item->refresh();
        $this->assertSame('Renamed by manager', $item->title);
    }

    public function test_manager_cannot_full_edit_items_in_another_managers_project(): void
    {
        $owner = $this->makeUserWithRole('manager');
        $otherManager = $this->makeUserWithRole('manager');
        $project = $this->makeProject($owner);
        $item = $this->makeItem($project, null);

        $response = $this->actingAs($otherManager)->patch(
            "/projects/{$project->id}/work-items/{$item->id}",
            ['title' => 'Hijacked by other manager']
        );

        $response->assertForbidden();
        $item->refresh();
        $this->assertSame('My task', $item->title);
    }

    public function test_manager_can_update_progress_of_item_assigned_to_them_in_foreign_project(): void
    {
        $owner = $this->makeUserWithRole('manager');
        $manager = $this->makeUserWithRole('manager');
        $project = $this->makeProject($owner);
        $item = $this->makeItem($project, $manager->id);
        project_members::create(['project_id' => $project->id, 'user_id' => $manager->id]);

        $response = $this->actingAs($manager)->patch(
            "/projects/{$project->id}/work-items/{$item->id}/progress",
            ['progress' => 75]
        );

        $response->assertRedirect();
        $item->refresh();
        $this->assertSame(75, $item->progress);
    }

    public function test_admin_can_full_edit_items_in_any_project(): void
    {
        $admin = $this->makeUserWithRole('admin');
        $owner = $this->makeUserWithRole('manager');
        $project = $this->makeProject($owner);
        $item = $this->makeItem($project, null);

        $response = $this->actingAs($admin)->patch(
            "/projects/{$project->id}/work-items/{$item->id}",
            [
                'title' => 'Renamed by admin',
                'status_id' => $item->status_id,
                'priority' => 'medium',
                'due_date' => now()->addWeek()->toDateString(),
            ]
        );

        $response->assertRedirect();
        $item->refresh();
        $this->assertSame('Renamed by admin', $item->title);
    }

    public function test_member_cannot_restructure_project_setup(): void
    {
        $member = $this->makeUserWithRole(null);
        $project = $this->makeProject($member);
        project_members::create(['project_id' => $project->id, 'user_id' => $member->id]);

        $response = $this->actingAs($member)->put("/projects/{$project->id}/setup", [
            'name' => 'Renamed by member',
        ]);

        $response->assertForbidden();
        $project->refresh();
        $this->assertSame('Auth Test Project', $project->name);
    }

    public function test_manager_can_restructure_project_setup(): void
    {
        $manager = $this->makeUserWithRole('manager');
        $project = $this->makeProject($manager);
        project_members::create(['project_id' => $project->id, 'user_id' => $manager->id]);

        $response = $this->actingAs($manager)->put("/projects/{$project->id}/setup", [
            'name' => 'Renamed by manager',
        ]);

        $response->assertRedirect();
        $project->refresh();
        $this->assertSame('Renamed by manager', $project->name);
    }
}
