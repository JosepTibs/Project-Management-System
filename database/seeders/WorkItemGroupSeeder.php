<?php

namespace Database\Seeders;

use App\Models\milestones;
use App\Models\projects;
use App\Models\work_item_groups;
use Illuminate\Database\Seeder;

class WorkItemGroupSeeder extends Seeder
{
    public function run(): void
    {
        $projects = projects::all();

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

        foreach ($projects as $project) {
            $milestones = milestones::where('project_id', $project->id)->orderBy('order')->get();

            if ($milestones->isEmpty()) {
                continue;
            }

            // Pre-compute which groups belong to which milestone
            $groupsByMilestone = [];
            foreach ($groupData as $index => $group) {
                $milestoneIndex = $index % $milestones->count();
                $groupsByMilestone[$milestoneIndex][] = $index;
            }

            foreach ($groupData as $index => $group) {
                $milestoneIndex = $index % $milestones->count();
                $milestone = $milestones->get($milestoneIndex);

                $milestoneStart = $milestone->start_date
                    ? $milestone->start_date->copy()->startOfDay()
                    : now()->startOfDay();
                $milestoneEnd = $milestone->target_date
                    ? $milestone->target_date->copy()->startOfDay()
                    : now()->addMonths(3)->startOfDay();
                $milestoneDuration = max(1, $milestoneStart->diffInDays($milestoneEnd));

                $groupCount = count($groupsByMilestone[$milestoneIndex]);
                $groupDuration = (int) ceil($milestoneDuration / $groupCount);

                $positionInMilestone = array_search($index, $groupsByMilestone[$milestoneIndex]);

                $startDate = $milestoneStart->copy()->addDays($positionInMilestone * $groupDuration);
                $endDate = $startDate->copy()->addDays($groupDuration - 1);

                // Clamp to milestone end date — never exceed milestone target_date
                if ($endDate->greaterThan($milestoneEnd)) {
                    $endDate = $milestoneEnd->copy();
                }

                work_item_groups::create([
                    'project_id' => $project->id,
                    'milestone_id' => $milestone?->id,
                    'name' => $group['name'],
                    'description' => $group['description'],
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                ]);
            }
        }
    }
}
