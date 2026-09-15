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
                'Create homepage hero section',
                'Implement responsive navigation',
                'Design and build contact form',
                'Set up SEO meta tags',
                'Optimize images for web',
                'Build footer with sitemap links',
                'Add dark mode toggle',
                'Implement lazy loading for images',
                'Create landing pages',
                'Integrate with CRM system',
                'Add user testimonials section',
                'Implement breadcrumb navigation',
                'Set up page caching',
                'Create 404 and error pages',
            ],
            'Mobile App v2' => [
                'Revamp onboarding flow',
                'Add push notification support',
                'Implement offline mode',
                'Redesign user profile screen',
                'Add in-app search functionality',
                'Fix login credential caching bug',
                'Update API client for v2 endpoints',
                'Add biometric authentication',
                'Implement deep linking',
                'Create settings page',
                'Add social media integration',
            ],
            'Internal Tools' => [
                'Build employee time-logging dashboard',
                'Create weekly report generator',
                'Add role-based access control',
                'Design leave request workflow',
                'Implement data export to CSV',
                'Create performance tracking module',
                'Add announcement board feature',
                'Implement document management',
            ],
            'E-Commerce Platform' => [
                'Build product catalog',
                'Implement shopping cart',
                'Create checkout process',
                'Integrate payment gateway',
                'Build inventory management',
                'Create order tracking system',
                'Implement product search',
                'Add review and rating system',
                'Build admin dashboard',
                'Create discount code system',
                'Implement wishlist feature',
            ],
            'Customer Portal' => [
                'Design customer dashboard',
                'Implement ticket system',
                'Create knowledge base',
                'Add live chat support',
                'Build profile management',
                'Implement notification center',
                'Create Billing history page',
            ],
            'Data Analytics Dashboard' => [
                'Create data visualization components',
                'Build report generator',
                'Implement export functionality',
                'Add real-time data updates',
                'Create user activity analytics',
                'Build custom dashboard builder',
                'Implement data filtering',
            ],
            'API Gateway' => [
                'Design API gateway architecture',
                'Implement rate limiting',
                'Add request logging',
                'Create API documentation',
                'Implement authentication middleware',
                'Add health check endpoints',
                'Build monitoring dashboard',
            ],
            'DevOps Pipeline' => [
                'Set up CI/CD workflows',
                'Create deployment scripts',
                'Implement automated testing',
                'Add environment configuration',
                'Build rollback mechanisms',
                'Create infrastructure templates',
                'Implement secret management',
            ],
            'Security Enhancement' => [
                'Implement two-factor authentication',
                'Add data encryption',
                'Create audit logging system',
                'Build security scanning',
                'Implement session management',
                'Add password strength enforcement',
            ],
            'Legacy System Migration' => [
                'Assess legacy system dependencies',
                'Create migration plan',
                'Build data migration scripts',
                'Implement compatibility layer',
                'Create rollback procedures',
                'Document migration process',
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

            if (empty($titles) || $groups->isEmpty() || $statuses->isEmpty()) {
                continue;
            }

            $numItems = min(count($titles), random_int(10, 15));
            $selectedTitles = array_slice($titles, 0, $numItems);
            shuffle($selectedTitles);

            foreach ($selectedTitles as $index => $title) {
                $status = $statuses->random();
                $group = $groups->get($index % $groups->count()); // Distribute evenly across all groups
                $assignee = $members->isNotEmpty() ? $members->random() : User::first();
                $priority = $priorities[random_int(0, count($priorities) - 1)];

                $groupStart = $group->start_date
                    ? $group->start_date->copy()->startOfDay()
                    : now()->startOfDay();
                $groupEnd = $group->end_date
                    ? $group->end_date->copy()->startOfDay()
                    : now()->addMonthsNoOverflow(3)->startOfDay();

                $span = max(0, (int) $groupStart->diffInDays($groupEnd));

                // Due date: random day inside the group window, clamped to group end.
                $dueDate = $groupStart->copy()->addDays(random_int(0, $span));
                if ($dueDate->greaterThan($groupEnd)) {
                    $dueDate = $groupEnd->copy();
                }

                // Start: 0-7 days before due, never before the group start,
                // never after the due date — always inside the group window.
                $startLead = random_int(0, min(7, max(0, (int) $groupStart->diffInDays($dueDate))));
                $startDate = $dueDate->copy()->subDays($startLead);

                work_item::create([
                    'project_id' => $project->id,
                    'status_id' => $status->id,
                    'group_id' => $group->id,
                    'milestone_id' => $group->milestone_id,
                    'title' => $title,
                    'description' => "Task: {$title} for the {$project->name} project.",
                    'assignee_id' => $assignee->id,
                    'priority' => $priority,
                    'start_date' => $startDate->toDateString(),
                    'due_date' => $dueDate->toDateString(),
                    'progress' => random_int(0, 100),
                ]);
            }
        }
    }
}
