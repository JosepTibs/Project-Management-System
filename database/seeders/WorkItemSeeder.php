<?php

namespace Database\Seeders;

use App\Models\projects;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_groups;
use App\Models\work_item_statuses;
use Illuminate\Database\Seeder;

class WorkItemSeeder extends Seeder
{
    public function run(): void
    {
        $projects = projects::all();
        $priorities = ['low', 'medium', 'high', 'critical'];

        $titlesByProject = [
            'Website Redesign' => [
                ['title' => 'Create homepage hero section', 'priority' => 'high'],
                ['title' => 'Implement responsive navigation', 'priority' => 'high'],
                ['title' => 'Design and build contact form', 'priority' => 'medium'],
                ['title' => 'Set up SEO meta tags', 'priority' => 'medium'],
                ['title' => 'Optimize images for web', 'priority' => 'low'],
                ['title' => 'Build footer with sitemap links', 'priority' => 'medium'],
                ['title' => 'Add dark mode toggle', 'priority' => 'low'],
                ['title' => 'Implement lazy loading for images', 'priority' => 'medium'],
            ],
            'Mobile App v2' => [
                ['title' => 'Revamp onboarding flow', 'priority' => 'critical'],
                ['title' => 'Add push notification support', 'priority' => 'high'],
                ['title' => 'Implement offline mode', 'priority' => 'high'],
                ['title' => 'Redesign user profile screen', 'priority' => 'medium'],
                ['title' => 'Add in-app search functionality', 'priority' => 'medium'],
                ['title' => 'Fix login credential caching bug', 'priority' => 'critical'],
                ['title' => 'Update API client for v2 endpoints', 'priority' => 'high'],
            ],
            'Internal Tools' => [
                ['title' => 'Build employee time-logging dashboard', 'priority' => 'high'],
                ['title' => 'Create weekly report generator', 'priority' => 'medium'],
                ['title' => 'Add role-based access control', 'priority' => 'critical'],
                ['title' => 'Design leave request workflow', 'priority' => 'medium'],
                ['title' => 'Implement data export to CSV', 'priority' => 'low'],
            ],
        ];

        foreach ($projects as $project) {
            $statuses = work_item_statuses::where('project_id', $project->id)->get();
            $groups = work_item_groups::where('project_id', $project->id)->get();
            $members = User::whereIn('id', function ($q) use ($project) {
                $q->select('user_id')
                  ->from('project_members')
                  ->where('project_id', $project->id);
            })->get();

            $titles = $titlesByProject[$project->name] ?? [];

            foreach ($titles as $i => $itemData) {
                $status = $statuses->random();
                $group = $groups->random();
                $assignee = $members->random();

                work_item::create([
                    'project_id' => $project->id,
                    'status_id' => $status->id,
                    'group_id' => $group->id,
                    'title' => $itemData['title'],
                    'description' => "Task: {$itemData['title']} for the {$project->name} project.",
                    'assignee_id' => $assignee->id,
                    'priority' => $itemData['priority'],
                    'due_date' => now()->addDays(rand(5, 45)),
                    'progress' => rand(0, 100),
                ]);
            }
        }
    }
}