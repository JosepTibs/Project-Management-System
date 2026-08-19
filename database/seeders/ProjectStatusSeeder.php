<?php

namespace Database\Seeders;

use App\Models\project_statuses;
use App\Models\projects;
use Illuminate\Database\Seeder;

class ProjectStatusSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['name' => 'Draft',     'color' => '#6b7280', 'is_initial' => true,  'is_final' => false],
            ['name' => 'Planning',  'color' => '#3b82f6', 'is_initial' => false, 'is_final' => false],
            ['name' => 'Approved',  'color' => '#8b5cf6', 'is_initial' => false, 'is_final' => false],
            ['name' => 'Active',    'color' => '#10b981', 'is_initial' => false, 'is_final' => false],
            ['name' => 'On Hold',   'color' => '#f59e0b', 'is_initial' => false, 'is_final' => false],
            ['name' => 'Completed', 'color' => '#14b8a6', 'is_initial' => false, 'is_final' => true],
        ];

        foreach (projects::all() as $project) {
            $hasStatuses = project_statuses::where('project_id', $project->id)->exists();
            if ($hasStatuses) {
                continue;
            }

            foreach ($defaults as $order => $status) {
                project_statuses::create([
                    'project_id' => $project->id,
                    'name' => $status['name'],
                    'color' => $status['color'],
                    'order' => $order + 1,
                    'is_initial' => $status['is_initial'],
                    'is_final' => $status['is_final'],
                ]);
            }

            $project->update([
                'start_date' => now()->subMonth(6)->startOfMonth()->format('Y-m-d'),
                'end_date' => now()->addMonth(6)->startOfMonth()->format('Y-m-d'),
            ]);

            // Assign the initial status (Draft) to the project
            $initial = project_statuses::where('project_id', $project->id)->where('is_initial', true)->first();
            if ($initial && ! $project->status_id) {
                $project->update(['status_id' => $initial->id]);
            }
        }
    }
}
