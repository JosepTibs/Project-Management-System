<?php

namespace Database\Seeders;

use App\Models\projects;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $projects = [
            [
                'name' => 'Website Redesign',
                'description' => 'Complete overhaul of the company website with modern design and improved UX.',
                'item_prefix' => 'WR',
            ],
            [
                'name' => 'Mobile App v2',
                'description' => 'Version 2 of the mobile application with new features and performance improvements.',
                'item_prefix' => 'MA',
            ],
            [
                'name' => 'Internal Tools',
                'description' => 'Development of internal tools for team productivity and reporting.',
                'item_prefix' => 'IT',
            ],
        ];

        foreach ($projects as $project) {
            projects::create($project);
        }
    }
}