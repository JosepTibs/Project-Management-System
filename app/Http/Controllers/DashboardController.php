<?php

namespace App\Http\Controllers;

use App\Models\activity_logs;
use App\Models\LoginActivity;
use App\Models\milestones;
use App\Models\project_members;
use App\Models\projects;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_statuses;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user()?->load('roles');

        // Total counts (active only; archived items are excluded from metrics)
        $totalUsers = User::count();
        $totalProjects = projects::notArchived()->count();
        $totalWorkItems = work_item::notArchived()->count();
        $archivedWorkItems = work_item::archived()->count();
        $overdueWorkItems = work_item::notArchived()
            ->where('due_date', '<', now())
            ->where('progress', '<', 100)
            ->count();

        // Work items by priority (schema enum includes 'critical')
        $highPriority = work_item::notArchived()->where('priority', 'high')->count();
        $mediumPriority = work_item::notArchived()->where('priority', 'medium')->count();
        $lowPriority = work_item::notArchived()->where('priority', 'low')->count();
        $criticalPriority = work_item::notArchived()->where('priority', 'critical')->count();

        // Derived work-item health metrics
        $avgCompletion = (int) round(work_item::notArchived()->avg('progress') ?? 0);
        $completedWorkItems = work_item::notArchived()->where('progress', 100)->count();
        $unassignedWorkItems = work_item::notArchived()->whereNull('assignee_id')->count();
        $dueThisWeek = work_item::notArchived()
            ->whereNotNull('due_date')
            ->where('due_date', '>=', now()->startOfDay())
            ->where('due_date', '<=', now()->endOfDay()->addDays(7))
            ->where('progress', '<', 100)
            ->count();

        // Users created within the last 7 days (replaces the hardcoded subtitle)
        $newUsersWeek = User::where('created_at', '>=', now()->subWeek())->count();

        // Work items blocked by an unfinished predecessor (active only)
        $blockedWorkItems = DB::table('dependencies')
            ->join('work_items as pred', 'pred.id', '=', 'dependencies.predecessor_id')
            ->join('work_items as succ', 'succ.id', '=', 'dependencies.successor_id')
            ->whereNull('pred.archived_at')
            ->whereNull('succ.archived_at')
            ->where('pred.progress', '<', 100)
            ->distinct()
            ->count('succ.id');

        // Workload: number of assigned work items per user (top contributors)
        $tasksPerUser = work_item::selectRaw('assignee_id, count(*) as total')
            ->notArchived()
            ->whereNotNull('assignee_id')
            ->groupBy('assignee_id')
            ->orderByDesc('total')
            ->with('assignee:id,fname,mname,lname,sname,username')
            ->get()
            ->map(function ($item) {
                $user = $item->assignee;
                $nameParts = array_filter([$user?->fname, $user?->mname, $user?->lname, $user?->sname]);
                $userName = $nameParts ? implode(' ', $nameParts) : ($user?->username ?? 'Unassigned');

                return [
                    'user_name' => $userName,
                    'total' => $item->total,
                ];
            })
            ->take(5)
            ->values();

        // Milestone health
        $totalMilestones = milestones::count();
        $completedMilestones = milestones::whereNotNull('completed_at')->count();
        $overdueMilestones = milestones::whereNull('completed_at')
            ->whereNotNull('target_date')
            ->where('target_date', '<', now()->startOfDay())
            ->count();
        $upcomingMilestones = milestones::whereNull('completed_at')
            ->whereNotNull('target_date')
            ->where('target_date', '>=', now()->startOfDay())
            ->count();

        // Work items by status (excludes archived items)
        $statuses = work_item_statuses::withCount(['workItems' => function ($q) {
            $q->notArchived();
        }])->get()->groupBy('name')->map(function ($group) {
            return [
                'name' => $group->first()->name,
                'count' => $group->sum('work_items_count'),
            ];
        })->values();

        // Recent work items (latest 5, active only)
        $recentWorkItems = work_item::with(['project:id,name', 'status:id,name'])
            ->notArchived()
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

        // Projects overview with member count and work item count (active only)
        $projectsOverview = projects::notArchived()
            ->withCount(['members', 'workItems' => function ($q) {
                $q->whereNull('archived_at');
            }])
            ->selectSub(function ($query) {
                $query->selectRaw('ROUND(AVG(progress), 2)')
                    ->from('work_items')
                    ->whereColumn('project_id', 'projects.id')
                    ->whereNull('archived_at');
            }, 'completion_percentage')
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'members_count' => $project->members_count,
                    'work_items_count' => $project->work_items_count,
                    'completion_percentage' => (int) round((float) ($project->completion_percentage ?? 0)),
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
        $loginActivities = LoginActivity::with('user:id,username,fname,mname,lname,sname')
            ->get()
            ->map(function ($activity) {
                $user = $activity->user;
                $nameParts = array_filter([$user?->fname, $user?->mname, $user?->lname, $user?->sname]);
                $userName = $nameParts ? implode(' ', $nameParts) : ($user?->username ?? 'Unknown');

                return [
                    'id' => 'login-'.$activity->id,
                    'type' => 'login',
                    'event' => $activity->event,
                    'user_name' => $userName,
                    'username' => $user?->username ?? 'unknown',
                    'ip_address' => $activity->ip_address,
                    'user_agent' => $activity->user_agent,
                    'created_at' => $activity->created_at,
                ];
            })
            ->values()
            ->toBase();

        // Recent general activity logs (user creation, updates, etc.)
        $generalActivities = activity_logs::with('user:id,username,fname,mname,lname,sname')
            ->get()
            ->map(function ($log) {
                $user = $log->user;
                $nameParts = array_filter([$user?->fname, $user?->mname, $user?->lname, $user?->sname]);
                $userName = $nameParts ? implode(' ', $nameParts) : ($user?->username ?? 'Unknown');

                return [
                    'id' => 'general-'.$log->id,
                    'type' => 'general',
                    'event' => $log->event,
                    'user_name' => $userName,
                    'username' => $user?->username ?? 'unknown',
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'description' => $log->description,
                    'created_at' => $log->created_at,
                ];
            })
            ->values()
            ->toBase();

        // Merge and sort activities by date
        $recentActivities = $loginActivities
            ->merge($generalActivities)
            ->sortByDesc('created_at')
            ->take(20)
            ->values()
            ->map(function ($activity) {
                return [
                    'id' => $activity['id'] ?? null,
                    'type' => $activity['type'] ?? null,
                    'event' => $activity['event'] ?? null,
                    'user_name' => $activity['user_name'] ?? null,
                    'username' => $activity['username'] ?? null,
                    'ip_address' => $activity['ip_address'] ?? null,
                    'user_agent' => $activity['user_agent'] ?? null,
                    'description' => $activity['description'] ?? null,
                    'properties' => $activity['properties'] ?? null,
                    'date' => $activity['created_at']?->format('M d, Y'),
                    'time' => $activity['created_at']?->format('g:i A'),
                ];
            });

        // Weekly timeline for the last 8 weeks: work items created vs completed.
        // Created is bucketed by created_at; completed by the derived completed_at.
        // Pre-existing items at 100% progress with a null completed_at are excluded
        // from the completed series (their true completion date is unknown) rather
        // than backfilled with a guessed date.
        $timeline = [];
        $weekStart = now()->startOfWeek();

        for ($i = 7; $i >= 0; $i--) {
            $start = $weekStart->copy()->subWeeks($i);
            $end = $start->copy()->addWeeks(1);

            $timeline[] = [
                'week' => $start->format('M d'),
                'created' => work_item::notArchived()
                    ->where('created_at', '>=', $start)
                    ->where('created_at', '<', $end)
                    ->count(),
                'completed' => work_item::notArchived()
                    ->whereNotNull('completed_at')
                    ->where('completed_at', '>=', $start)
                    ->where('completed_at', '<', $end)
                    ->count(),
            ];
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'total_users' => $totalUsers,
                'total_projects' => $totalProjects,
                'total_work_items' => $totalWorkItems,
                'overdue_work_items' => $overdueWorkItems,
                'high_priority' => $highPriority,
                'medium_priority' => $mediumPriority,
                'low_priority' => $lowPriority,
                'critical_priority' => $criticalPriority,
                'avg_completion' => $avgCompletion,
                'completed_work_items' => $completedWorkItems,
                'unassigned_work_items' => $unassignedWorkItems,
                'due_this_week' => $dueThisWeek,
                'new_users_week' => $newUsersWeek,
                'blocked_work_items' => $blockedWorkItems,
                'archived_work_items' => $archivedWorkItems,
            ],
            'statuses' => $statuses,
            'recent_work_items' => $recentWorkItems,
            'projects_overview' => $projectsOverview,
            'team_distribution' => $teamDistribution,
            'recent_activities' => $recentActivities,
            'tasks_per_user' => $tasksPerUser,
            'timeline' => $timeline,
            'milestones_overview' => [
                'total' => $totalMilestones,
                'completed' => $completedMilestones,
                'overdue' => $overdueMilestones,
                'upcoming' => $upcomingMilestones,
            ],
        ]);
    }
}
