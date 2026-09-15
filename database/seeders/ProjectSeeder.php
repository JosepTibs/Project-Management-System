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
            [
                'name' => 'E-Commerce Platform',
                'description' => 'Build a scalable e-commerce platform with payment integration and inventory management.',
                'item_prefix' => 'EC',
                'created_by' => $admin?->id ?? 1,
            ],
            [
                'name' => 'Customer Portal',
                'description' => 'Self-service customer portal for account management and support tickets.',
                'item_prefix' => 'CP',
                'created_by' => $admin?->id ?? 1,
            ],
            [
                'name' => 'Data Analytics Dashboard',
                'description' => 'Business intelligence dashboard with real-time analytics and reporting features.',
                'item_prefix' => 'DA',
                'created_by' => $admin?->id ?? 1,
            ],
            [
                'name' => 'API Gateway',
                'description' => 'Centralized API gateway for microservices architecture with rate limiting and monitoring.',
                'item_prefix' => 'AG',
                'created_by' => $admin?->id ?? 1,
            ],
            [
                'name' => 'DevOps Pipeline',
                'description' => 'CI/CD pipeline automation for deployments, testing, and infrastructure as code.',
                'item_prefix' => 'DP',
                'created_by' => $admin?->id ?? 1,
            ],
            [
                'name' => 'Security Enhancement',
                'description' => 'Implement security improvements including 2FA, encryption, and audit logging.',
                'item_prefix' => 'SE',
                'created_by' => $admin?->id ?? 1,
            ],
            [
                'name' => 'Legacy System Migration',
                'description' => 'Migrate legacy systems to modern cloud-based infrastructure.',
                'item_prefix' => 'LM',
                'created_by' => $admin?->id ?? 1,
            ],
        ];

        foreach ($projects as $project) {
            // ~12 months centered on today. MonthsNoOverflow avoids the
            // Jan-31 -> Mar-3 style jump plain subMonths/addMonths can produce.
            $project['start_date'] = now()->subMonthsNoOverflow(6)->startOfMonth()->toDateString();
            $project['end_date'] = now()->addMonthsNoOverflow(6)->startOfMonth()->toDateString();
            projects::create($project);
        }
    }
}
