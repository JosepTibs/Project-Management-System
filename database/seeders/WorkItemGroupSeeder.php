<?php

namespace Database\Seeders;

use App\Models\projects;
use App\Models\work_item_groups;
use Illuminate\Database\Seeder;

class WorkItemGroupSeeder extends Seeder
{
    public function run(): void
    {
        $projects = projects::all();

        $groupData = [
            ['name' => 'Sprint 1', 'description' => 'Initial development sprint focusing on core features.'],
            ['name' => 'Sprint 2', 'description' => 'Second sprint for additional features and refinements.'],
        ];

        $startDate = now()->subWeeks(4);

        foreach ($projects as $project) {
            $milestones = \App\Models\milestones::where('project_id', $project->id)->get();

            foreach ($groupData as $index => $group) {
                $milestone = $milestones->get($index % $milestones->count());

                work_item_groups::create([
                    'project_id' => $project->id,
                    'milestone_id' => $milestone?->id,
                    'name' => $group['name'],
                    'description' => $group['description'],
                    'start_date' => $startDate->copy()->addWeeks($index * 3),
                    'end_date' => $startDate->copy()->addWeeks($index * 3 + 2),
                ]);
            }
        }
    }
}