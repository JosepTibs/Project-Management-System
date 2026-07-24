<?php

namespace App\Http\Controllers;

use App\Models\projects;
use App\Models\project_members;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_statuses;
use App\Models\work_item_groups;
use App\Models\LoginActivity;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user()?->load('roles');

        // Total counts
        $totalUsers = User::count();
        $totalProjects = projects::count();
        $totalWorkItems = work_item::count();
        $overdueWorkItems = work_item::where('due_date', '<', now())->count();

        // Work items by priority
        $highPriority = work_item::where('priority', 'high')->count();
        $mediumPriority = work_item::where('priority', 'medium')->count();
        $lowPriority = work_item::where('priority', 'low')->count();

        // Work items by status
        $statuses = work_item_statuses::withCount('workItems')->get()->groupBy('name')->map(function ($group) {
            return [
                'name' => $group->first()->name,
                'count' => $group->sum('work_items_count'),
            ];
        })->values();

        // Recent work items (latest 5)
        $recentWorkItems = work_item::with(['project:id,name', 'status:id,name'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'priority' => $item->priority,
                    'project' => $item->project?->name ?? 'N/A',
                    'status' => $item->status?->name ?? 'N/A',
                    'due_date' => $item->due_date?->format('Y-m-d'),
                ];
            });

        // Projects overview with member count and work item count
        $projectsOverview = projects::withCount(['members', 'workItems'])
            ->selectSub(function ($query) {
                $query->selectRaw('ROUND(AVG(progress), 2)')
                    ->from('work_items')
                    ->whereColumn('project_id', 'projects.id');
            }, 'completion_percentage')
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'members_count' => $project->members_count,
                    'work_items_count' => $project->work_items_count,
                    'completion_percentage' => $project->completion_percentage ?? 0,
                ];
            });

        // Team members distribution (users per project)
        $teamDistribution = project_members::selectRaw('project_id, count(*) as total')
            ->groupBy('project_id')
            ->with('project:id,name')
            ->get()
            ->map(function ($member) {
                return [
                    'project_name' => $member->project?->name ?? 'N/A',
                    'total' => $member->total,
                ];
            });

        // Recent login/logout activity across all users
        $recentActivities = LoginActivity::with('user:id,username,fname,mname,lname,sname')
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($activity) {
                $user = $activity->user;
                $nameParts = array_filter([$user?->fname, $user?->mname, $user?->lname, $user?->sname]);
                $userName = $nameParts ? implode(' ', $nameParts) : ($user?->username ?? 'Unknown');

                return [
                    'id' => $activity->id,
                    'event' => $activity->event,
                    'user_name' => $userName,
                    'username' => $user?->username ?? 'unknown',
                    'ip_address' => $activity->ip_address,
                    'user_agent' => $activity->user_agent,
                    'date' => $activity->created_at?->format('M d, Y'),
                    'time' => $activity->created_at?->format('g:i A'),
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'total_users' => $totalUsers,
                'total_projects' => $totalProjects,
                'total_work_items' => $totalWorkItems,
                'overdue_work_items' => $overdueWorkItems,
                'high_priority' => $highPriority,
                'medium_priority' => $mediumPriority,
                'low_priority' => $lowPriority,
            ],
            'statuses' => $statuses,
            'recent_work_items' => $recentWorkItems,
            'projects_overview' => $projectsOverview,
            'team_distribution' => $teamDistribution,
            'recent_activities' => $recentActivities,
        ]);
    }
}