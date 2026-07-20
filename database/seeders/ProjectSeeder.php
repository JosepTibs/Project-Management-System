<?php

namespace Database\Seeders;

use App\Models\projects;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        // Assign the admin user as the creator of seeded projects
        $admin = User::where('email', 'admin@example.com')->first();

        $projects = [
            [
                'name' => 'Website Redesign',
                'description' => 'Complete overhaul of the company website with modern design and improved UX.',
                'item_prefix' => 'WR',
                'created_by' => $admin?->id ?? 1,
            ],
            [
                'name' => 'Mobile App v2',
                'description' => 'Version 2 of the mobile application with new features and performance improvements.',
                'item_prefix' => 'MA',
                'created_by' => $admin?->id ?? 1,
            ],
            [
                'name' => 'Internal Tools',
                'description' => 'Development of internal tools for team productivity and reporting.',
                'item_prefix' => 'IT',
                'created_by' => $admin?->id ?? 1,
            ],
        ];

        foreach ($projects as $project) {
            projects::create($project);
        }
    }
}
