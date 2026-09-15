<?php

namespace Database\Seeders;

use App\Models\milestones;
use App\Models\projects;
use Database\Seeders\Concerns\ChunksDateRange;
use Illuminate\Database\Seeder;

class MilestoneSeeder extends Seeder
{
    use ChunksDateRange;

    public function run(): void
    {
        $milestoneTemplates = [
            [
                'name' => 'Planning Phase',
                'description' => 'Complete project planning, requirements gathering, and initial design.',
                'order' => 1,
            ],
            [
                'name' => 'Development Phase',
                'description' => 'Core development and implementation of main features.',
                'order' => 2,
            ],
            [
                'name' => 'Testing Phase',
                'description' => 'Quality assurance, bug fixes, and user acceptance testing.',
                'order' => 3,
            ],
            [
                'name' => 'Launch',
                'description' => 'Production deployment and launch preparation.',
                'order' => 4,
            ],
        ];

        foreach (projects::all() as $project) {
            $projectStart = $project->start_date
                ? $project->start_date->copy()->startOfDay()
                : now()->subMonthsNoOverflow(6)->startOfDay();
            $projectEnd = $project->end_date
                ? $project->end_date->copy()->startOfDay()
                : now()->addMonthsNoOverflow(6)->startOfDay();

            // Milestones exactly tile the project window: no gaps, no overhang.
            foreach ($this->dateWindows($projectStart, $projectEnd, count($milestoneTemplates)) as $index => $window) {
                milestones::create([
                    'project_id' => $project->id,
                    'name' => $milestoneTemplates[$index]['name'],
                    'description' => $milestoneTemplates[$index]['description'],
                    'start_date' => $window['start']->toDateString(),
                    'target_date' => $window['end']->toDateString(),
                    'completed_at' => null,
                    'order' => $milestoneTemplates[$index]['order'],
                ]);
            }
        }
    }
}
