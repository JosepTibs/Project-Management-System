<?php

namespace Database\Seeders;

use App\Models\milestones;
use App\Models\projects;
use Illuminate\Database\Seeder;

class MilestoneSeeder extends Seeder
{
    public function run(): void
    {
        $projects = projects::all();

        $milestoneData = [
            [
                'name' => 'Planning Phase',
                'description' => 'Complete project planning, requirements gathering, and initial design.',
                'start_date' => '2026-01-01',
                'target_date' => '2026-01-15',
                'completed_at' => null,
                'order' => 1,
            ],
            [
                'name' => 'Development Phase',
                'description' => 'Core development and implementation of main features.',
                'start_date' => '2026-01-16',
                'target_date' => '2026-02-28',
                'completed_at' => null,
                'order' => 2,
            ],
            [
                'name' => 'Testing Phase',
                'description' => 'Quality assurance, bug fixes, and user acceptance testing.',
                'start_date' => '2026-03-01',
                'target_date' => '2026-03-15',
                'completed_at' => null,
                'order' => 3,
            ],
            [
                'name' => 'Launch',
                'description' => 'Production deployment and launch preparation.',
                'start_date' => '2026-03-16',
                'target_date' => '2026-03-31',
                'completed_at' => null,
                'order' => 4,
            ],
        ];

        foreach ($projects as $project) {
            foreach ($milestoneData as $milestone) {
                milestones::create([
                    'project_id' => $project->id,
                    'name' => $milestone['name'],
                    'description' => $milestone['description'],
                    'start_date' => $milestone['start_date'],
                    'target_date' => $milestone['target_date'],
                    'completed_at' => $milestone['completed_at'],
                    'order' => $milestone['order'],
                ]);
            }
        }
    }
}