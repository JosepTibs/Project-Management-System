<?php

namespace Tests\Feature;

use App\Models\projects;
use App\Models\roles;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_groups;
use App\Models\work_item_statuses;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArchiveTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        $role = roles::create(['name' => 'admin', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        return $user;
    }

    private function makeProject(User $user): projects
    {
        return projects::create([
            'name' => 'Archive Example',
            'created_by' => $user->id,
            'description' => 'Test project',
            'item_prefix' => 'TST',
        ]);
    }

    private function makeWorkItem(projects $project, User $user, array $overrides = []): work_item
    {
        $status = work_item_statuses::create([
            'project_id' => $project->id,
            'name' => $overrides['status_name'] ?? 'Done',
            'order' => 1,
            'color' => '#00ff00',
        ]);

        $group = work_item_groups::create([
            'project_id' => $project->id,
            'milestone_id' => null,
            'name' => 'Group',
            'description' => '',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
        ]);

        return work_item::create(array_merge([
            'project_id' => $project->id,
            'status_id' => $status->id,
            'group_id' => $group->id,
            'title' => 'Task',
            'description' => '',
            'assignee_id' => $user->id,
            'priority' => 'high',
            'due_date' => now()->addDay()->toDateString(),
            'progress' => 100,
        ], $overrides));
    }

    public function test_work_item_completed_is_archiveable()
    {
        $user = $this->makeAdmin();
        $project = $this->makeProject($user);
        $item = $this->makeWorkItem($project, $user, ['progress' => 100]);

        $this->assertTrue($item->isArchiveable());
    }

    public function test_work_item_incomplete_is_not_archiveable()
    {
        $user = $this->makeAdmin();
        $project = $this->makeProject($user);
        $item = $this->makeWorkItem($project, $user, ['progress' => 50]);

        $this->assertTrue($item->completed_at === null);
        $this->assertFalse($item->isArchiveable());
    }

    public function test_archive_work_item_sets_archived_timestamp()
    {
        $user = $this->makeAdmin();
        $project = $this->makeProject($user);
        $item = $this->makeWorkItem($project, $user, ['progress' => 100]);

        $item->archive();

        $this->assertNotNull($item->fresh()->archived_at);
        $this->assertDatabaseMissing('work_items', ['id' => $item->id, 'archived_at' => null]);
    }

    public function test_not_archived_scope_excludes_archived_items()
    {
        $user = $this->makeAdmin();
        $project = $this->makeProject($user);
        $completed = $this->makeWorkItem($project, $user, ['progress' => 100]);
        $this->makeWorkItem($project, $user, ['title' => 'In Progress', 'progress' => 40]);

        $completed->archive();

        $this->assertSame(1, work_item::notArchived()->count());
        $this->assertSame(1, work_item::archived()->count());
    }

    public function test_project_archive_cascades_to_work_items()
    {
        $user = $this->makeAdmin();
        $project = $this->makeProject($user);
        $this->makeWorkItem($project, $user, ['progress' => 100]);

        $this->assertTrue($project->isArchiveable());

        $project->archive();

        $this->assertNotNull($project->fresh()->archived_at);
        // Cascade keeps consistency: work items are archived with the project.
        $this->assertSame(1, work_item::archived()->count());
    }

    public function test_project_with_open_work_item_is_not_archiveable()
    {
        $user = $this->makeAdmin();
        $project = $this->makeProject($user);
        $this->makeWorkItem($project, $user, ['progress' => 50]);

        $this->assertFalse($project->isArchiveable());
    }

    public function test_controller_archives_work_item_for_privileged_user()
    {
        $admin = $this->makeAdmin();
        $project = $this->makeProject($admin);
        $item = $this->makeWorkItem($project, $admin, ['progress' => 100]);

        $response = $this->actingAs($admin)->post("/work-items/{$item->id}/archive");

        $response->assertRedirect();
        $this->assertNotNull($item->fresh()->archived_at);
    }

    public function test_controller_rejects_archiving_incomplete_work_item()
    {
        $admin = $this->makeAdmin();
        $project = $this->makeProject($admin);
        $item = $this->makeWorkItem($project, $admin, ['progress' => 30]);

        $response = $this->actingAs($admin)->post("/work-items/{$item->id}/archive");

        $response->assertSessionHasErrors('archive');
        $this->assertNull($item->fresh()->archived_at);
    }

    public function test_restoring_work_item_clears_archived_timestamp()
    {
        $admin = $this->makeAdmin();
        $project = $this->makeProject($admin);
        $item = $this->makeWorkItem($project, $admin, ['progress' => 100]);
        $item->archive();

        $this->actingAs($admin)->post("/work-items/{$item->id}/restore");

        $this->assertNull($item->fresh()->archived_at);
    }

    public function test_controller_archives_project_for_privileged_user()
    {
        $admin = $this->makeAdmin();
        $project = $this->makeProject($admin);
        $this->makeWorkItem($project, $admin, ['progress' => 100]);

        $response = $this->actingAs($admin)->post("/projects/{$project->id}/archive");

        $response->assertRedirect();
        $this->assertNotNull($project->fresh()->archived_at);
    }
}