<?php

namespace Database\Seeders;

use App\Models\projects;
use App\Models\Tags;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $projects = projects::all();

        $tags = [
            ['name' => 'Bug',          'color' => '#ef4444'],
            ['name' => 'Feature',      'color' => '#3b82f6'],
            ['name' => 'Enhancement',  'color' => '#8b5cf6'],
            ['name' => 'Documentation','color' => '#f59e0b'],
            ['name' => 'Urgent',       'color' => '#dc2626'],
            ['name' => 'High Priority','color' => '#ec4899'],
        ];

        foreach ($projects as $project) {
            foreach ($tags as $tag) {
                Tags::create([
                    'project_id' => $project->id,
                    'name' => $tag['name'],
                    'color' => $tag['color'],
                ]);
            }
        }
    }
}
