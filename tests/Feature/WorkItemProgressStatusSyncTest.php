<?php

namespace Tests\Feature;

use App\Models\projects;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_statuses;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Progress and the project Done status stay in lockstep on work_item.
 */
class WorkItemProgressStatusSyncTest extends TestCase
{
    use RefreshDatabase;

    private function makeItem(int $progress, string $statusName = 'To Do'): array
    {
        $user = User::factory()->create();
        $project = projects::create(['name' => 'Status Sync','created_by' => $user->id,'item_prefix' => 'SYN','description' => 'Test project',]);
        $statuses = [];
        foreach (['To Do', 'In Progress', 'Done'] as $i => $name) {
            $statuses[$name] = work_item_statuses::create(['project_id' => $project->id,'name' => $name,'order' => $i + 1,'color' => '#6b7280',]);
        }
        $item = work_item::create(['project_id' => $project->id,'status_id' => $statuses[$statusName]->id,'group_id' => null,'title' => 'Sync task','description' => '','assignee_id' => $user->id,'priority' => 'medium','progress' => $progress,'due_date' => now()->addWeek()->toDateString(),]);
        return [$item, $statuses];
    }

    public function test_progress_100_moves_item_to_done(): void
    {
        [$item, $statuses] = $this->makeItem(90);
        $item->update(['progress' => 100]);
        $item->refresh();
        $this->assertSame($statuses['Done']->id, $item->status_id);
        $this->assertNotNull($item->completed_at);
    }

    public function test_done_status_pushes_progress_to_100(): void
    {
        [$item, $statuses] = $this->makeItem(40, 'In Progress');
        $item->update(['status_id' => $statuses['Done']->id]);
        $item->refresh();
        $this->assertSame(100, $item->progress);
        $this->assertNotNull($item->completed_at);
    }

    public function test_dropping_below_100_leaves_done(): void
    {
        [$item, $statuses] = $this->makeItem(100, 'Done');
        $item->update(['progress' => 60]);
        $item->refresh();
        $this->assertSame($statuses['In Progress']->id, $item->status_id);
        $this->assertNull($item->completed_at);
    }

    public function test_unrelated_save_keeps_status_and_progress(): void
    {
        [$item, $statuses] = $this->makeItem(40, 'In Progress');
        $item->update(['title' => 'Renamed']);
        $item->refresh();
        $this->assertSame($statuses['In Progress']->id, $item->status_id);
        $this->assertSame(40, $item->progress);
    }
}
