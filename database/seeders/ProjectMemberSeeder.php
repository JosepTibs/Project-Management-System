<?php

namespace Database\Seeders;

use App\Models\project_members;
use App\Models\projects;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectMemberSeeder extends Seeder
{
    public function run(): void
    {
        $projects = projects::all();
        $users = User::all();

        foreach ($projects as $project) {
            // Add admin to every project
            $admin = User::where('email', 'admin@example.com')->first();
            project_members::create([
                'project_id' => $project->id,
                'user_id' => $admin->id,
            ]);

            // Add manager to every project
            $manager = User::where('email', 'manager@example.com')->first();
            project_members::create([
                'project_id' => $project->id,
                'user_id' => $manager->id,
            ]);

            // Add 3 random users to this project
            $randomUsers = $users->whereNotIn('id', [$admin->id, $manager->id])->random(3);
            foreach ($randomUsers as $user) {
                project_members::create([
                    'project_id' => $project->id,
                    'user_id' => $user->id,
                ]);
            }
        }
    }
}