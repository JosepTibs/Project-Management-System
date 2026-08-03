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
        $today = now()->startOfDay();
        $threeMonths = now()->addMonths(3);

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

        foreach ($projects as $project) {
            $projectDuration = $today->diffInDays($threeMonths);
            $milestoneDuration = (int) ceil($projectDuration / 4);

            foreach ($milestoneTemplates as $index => $template) {
                $startDate = $today->copy()->addDays($index * $milestoneDuration);
                $targetDate = $startDate->copy()->addDays($milestoneDuration - 1);

                milestones::create([
                    'project_id' => $project->id,
                    'name' => $template['name'],
                    'description' => $template['description'],
                    'start_date' => $startDate->format('Y-m-d'),
                    'target_date' => $targetDate->format('Y-m-d'),
                    'completed_at' => null,
                    'order' => $template['order'],
                ]);
            }
        }
    }
}
