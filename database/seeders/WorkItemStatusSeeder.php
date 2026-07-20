<?php

namespace Database\Seeders;

use App\Models\projects;
use App\Models\work_item_statuses;
use Illuminate\Database\Seeder;

class WorkItemStatusSeeder extends Seeder
{
    public function run(): void
    {
        $projects = projects::all();

        $statuses = [
            ['name' => 'To Do',        'color' => '#6b7280'],
            ['name' => 'In Progress',  'color' => '#3b82f6'],
            ['name' => 'Under Review', 'color' => '#f59e0b'],
            ['name' => 'Done',         'color' => '#10b981'],
        ];

        foreach ($projects as $project) {
            foreach ($statuses as $order => $status) {
                work_item_statuses::create([
                    'project_id' => $project->id,
                    'name' => $status['name'],
                    'color' => $status['color'],
                    'order' => $order + 1,
                ]);
            }
        }
    }
}