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
        $today = now()->startOfDay();
        $threeMonths = now()->addMonths(3);

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
            $milestones = milestones::where('project_id', $project->id)->get();
            $totalDuration = $today->diffInDays($threeMonths);
            $groupDuration = (int) ceil($totalDuration / 8);

            foreach ($groupData as $index => $group) {
                $milestone = $milestones->get($index % $milestones->count());
                $startDate = $today->copy()->addDays($index * $groupDuration);
                $endDate = $startDate->copy()->addDays($groupDuration - 1);

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
