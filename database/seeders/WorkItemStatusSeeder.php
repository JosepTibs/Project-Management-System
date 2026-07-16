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

        $statusNames = ['To Do', 'In Progress', 'Under Review', 'Done'];

        foreach ($projects as $project) {
            foreach ($statusNames as $order => $name) {
                work_item_statuses::create([
                    'project_id' => $project->id,
                    'name' => $name,
                    'order' => $order + 1,
                ]);
            }
        }
    }
}