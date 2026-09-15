<?php

namespace Database\Seeders;

use App\Models\milestones;
use App\Models\projects;
use App\Models\work_item_groups;
use Database\Seeders\Concerns\ChunksDateRange;
use Illuminate\Database\Seeder;

class WorkItemGroupSeeder extends Seeder
{
    use ChunksDateRange;

    public function run(): void
    {
        $groupData = [
            ['name' => 'Sprint 1', 'description' => 'Initial development sprint focusing on core features and setup.'],
            ['name' => 'Sprint 2', 'description' => 'Second sprint for additional features and refinements.'],
            ['name' => 'Sprint 3', 'description' => 'Third sprint for advanced features and integrations.'],
            ['name' => 'Sprint 4', 'description' => 'Fourth sprint for performance optimization.'],
            ['name' => 'Sprint 5', 'description' => 'Fifth sprint for bug fixes and stability improvements.'],
            ['name' => 'Sprint 6', 'description' => 'Sixth sprint for user interface enhancements.'],
            ['name' => 'Sprint 7', 'description' => 'Seventh sprint for security and compliance updates.'],
            ['name' => 'Sprint 8', 'description' => 'Final sprint for launch preparation and documentation.'],
        ];

        foreach (projects::all() as $project) {
            $milestones = milestones::where('project_id', $project->id)->orderBy('order')->get();

            if ($milestones->isEmpty()) {
                continue;
            }

            // Which milestone each group index belongs to (round-robin)
            $groupsByMilestone = [];
            foreach ($groupData as $index => $group) {
                $groupsByMilestone[$index % $milestones->count()][] = $index;
            }

            foreach ($groupData as $index => $group) {
                $milestoneIndex = $index % $milestones->count();
                $milestone = $milestones->get($milestoneIndex);
                $siblings = $groupsByMilestone[$milestoneIndex];

                $milestoneStart = $milestone->start_date
                    ? $milestone->start_date->copy()->startOfDay()
                    : now()->startOfDay();
                $milestoneEnd = $milestone->target_date
                    ? $milestone->target_date->copy()->startOfDay()
                    : now()->addMonthsNoOverflow(3)->startOfDay();

                // Tile THIS milestone's window across only its own groups.
                // Windows are contiguous and never leave the milestone range.
                $windows = $this->dateWindows($milestoneStart, $milestoneEnd, count($siblings));
                $window = $windows[array_search($index, $siblings)];

                work_item_groups::create([
                    'project_id' => $project->id,
                    'milestone_id' => $milestone->id,
                    'name' => $group['name'],
                    'description' => $group['description'],
                    'start_date' => $window['start']->toDateString(),
                    'end_date' => $window['end']->toDateString(),
                ]);
            }
        }
    }
}
