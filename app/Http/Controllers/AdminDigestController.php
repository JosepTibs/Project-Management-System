<?php

namespace App\Http\Controllers;

use App\Models\work_item;
use Inertia\Inertia;

class AdminDigestController extends Controller
{
    /**
     * Show the daily digest page with live data.
     */
    public function index()
    {
        // Overdue items (past due date, not completed)
        $overdueItems = work_item::with(['assignee', 'project'])
            ->whereNotNull('due_date')
            ->whereNull('completed_at')
            ->where('due_date', '<', now())
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'assignee' => $item->assignee?->name ?? 'Unassigned',
                'project' => $item->project?->name ?? 'Unknown',
                'due_date' => $item->due_date->format('M d, Y'),
                'days_overdue' => (int) now()->diffInDays($item->due_date),
                'url' => "/projects/{$item->project_id}/work-items/{$item->id}",
            ]);

        // Due today
        $dueTodayItems = work_item::with(['assignee', 'project'])
            ->whereNotNull('due_date')
            ->whereNull('completed_at')
            ->whereDate('due_date', today())
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'assignee' => $item->assignee?->name ?? 'Unassigned',
                'project' => $item->project?->name ?? 'Unknown',
                'due_date' => $item->due_date->format('M d, Y'),
                'url' => "/projects/{$item->project_id}/work-items/{$item->id}",
            ]);

        // Due this week (next 7 days, excluding today)
        $upcomingItems = work_item::with(['assignee', 'project'])
            ->whereNotNull('due_date')
            ->whereNull('completed_at')
            ->where('due_date', '>', today())
            ->where('due_date', '<=', now()->addWeek())
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'assignee' => $item->assignee?->name ?? 'Unassigned',
                'project' => $item->project?->name ?? 'Unknown',
                'due_date' => $item->due_date->format('M d, Y'),
                'days_until_due' => (int) now()->diffInDays($item->due_date),
                'url' => "/projects/{$item->project_id}/work-items/{$item->id}",
            ]);

        // Completed today
        $completedTodayItems = work_item::with(['assignee', 'project'])
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', today())
            ->orderBy('completed_at', 'desc')
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'assignee' => $item->assignee?->name ?? 'Unassigned',
                'project' => $item->project?->name ?? 'Unknown',
                'completed_at' => $item->completed_at->format('M d, Y g:i A'),
                'url' => "/projects/{$item->project_id}/work-items/{$item->id}",
            ]);

        return Inertia::render('notifications/digest', [
            'stats' => [
                'overdue_count' => $overdueItems->count(),
                'due_today_count' => $dueTodayItems->count(),
                'upcoming_count' => $upcomingItems->count(),
                'completed_today_count' => $completedTodayItems->count(),
            ],
            'overdue_items' => $overdueItems,
            'due_today_items' => $dueTodayItems,
            'upcoming_items' => $upcomingItems,
            'completed_today_items' => $completedTodayItems,
        ]);
    }
}
