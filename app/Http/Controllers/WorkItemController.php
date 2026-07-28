<?php

namespace App\Http\Controllers;

use App\Models\projects;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_groups;
use App\Models\work_item_statuses;
use App\Models\project_members;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkItemController extends Controller
{
    public function show(projects $project, work_item $workItem)
    {
        $workItem->load(['status', 'group', 'assignee', 'project']);

        $comments = $workItem->comments()
            ->whereNull('parent_id')
            ->with(['user', 'replies.user'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at->diffForHumans(),
                    'user' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                    ],
                    'replies' => $comment->replies->map(function ($reply) {
                        return [
                            'id' => $reply->id,
                            'content' => $reply->content,
                            'created_at' => $reply->created_at->diffForHumans(),
                            'user' => [
                                'id' => $reply->user->id,
                                'name' => $reply->user->name,
                            ],
                        ];
                    }),
                ];
            });

        return Inertia::render('work-items/show', [
            'workItems' => [
                'id' => $workItem->id,
                'title' => $workItem->title,
                'description' => $workItem->description,
                'priority' => $workItem->priority,
                'due_date' => $workItem->due_date->format('Y-m-d'),
                'progress' => $workItem->progress ?? 0,
                'status' => $workItem->status ? ['id' => $workItem->status->id, 'name' => $workItem->status->name] : null,
                'group' => $workItem->group ? ['id' => $workItem->group->id, 'name' => $workItem->group->name] : null,
                'assignee' => $workItem->assignee ? ['id' => $workItem->assignee->id, 'name' => $workItem->assignee->name] : null,
                'project' => $workItem->project ? ['id' => $workItem->project->id, 'name' => $workItem->project->name] : null,
            ],
            'comments' => $comments,
        ]);
    }

    public function globalIndex(Request $request)
    {
        $query = work_item::with(['status', 'group', 'assignee', 'project']);

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }
        if ($statusName = $request->input('status_name')) {
            $query->whereHas('status', function ($q) use ($statusName) {
                $q->where('name', $statusName);
            });
        }
        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        $workItems = $query->orderBy('created_at', 'desc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'priority' => $item->priority,
                'due_date' => $item->due_date?->format('Y-m-d'),
                'status' => $item->status ? ['id' => $item->status->id, 'name' => $item->status->name] : null,
                'group' => $item->group ? ['id' => $item->group->id, 'name' => $item->group->name] : null,
                'assignee' => $item->assignee ? ['id' => $item->assignee->id, 'name' => $item->assignee->name] : null,
                'project' => $item->project ? ['id' => $item->project->id, 'name' => $item->project->name] : null,
            ];
        });

        $projects = \App\Models\projects::select('id', 'name')->orderBy('name')->get();
        $statuses = work_item_statuses::select('name')->distinct()->orderBy('name')->get();

        return Inertia::render('work-items/global-index', [
            'workItems' => $workItems,
            'filters' => [
                'projects' => $projects,
                'statuses' => $statuses,
            ],
        ]);
    }

    public function index(projects $project)
    {
        $project->load('members.user');

        $workItems = work_item::where('project_id', $project->id)
            ->with(['status', 'group', 'assignee'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'priority' => $item->priority,
                    'due_date' => $item->due_date->format('Y-m-d'),
                    'progress' => $item->progress ?? 0,
                    'status' => $item->status ? ['id' => $item->status->id, 'name' => $item->status->name] : null,
                    'group' => $item->group ? ['id' => $item->group->id, 'name' => $item->group->name] : null,
                    'assignee' => $item->assignee ? ['id' => $item->assignee->id, 'name' => $item->assignee->name] : null,
                ];
            });

        $statuses = work_item_statuses::where('project_id', $project->id)
            ->orderBy('order')
            ->get(['id', 'name']);

        $groups = work_item_groups::where('project_id', $project->id)
            ->get(['id', 'name']);

        $members = $project->members->map(function ($member) {
            return [
                'id' => $member->user->id,
                'name' => $member->user->name,
            ];
        });

        return Inertia::render('work-items/index', [
            'workItems' => $workItems,
            'project' => ['id' => $project->id, 'name' => $project->name],
            'filters' => [
                'statuses' => $statuses,
                'groups' => $groups,
                'members' => $members,
            ],
        ]);
    }

    public function create(projects $project)
    {
        $statuses = work_item_statuses::where('project_id', $project->id)
            ->orderBy('order')
            ->get(['id', 'name']);

        $groups = work_item_groups::where('project_id', $project->id)
            ->get(['id', 'name']);

        $members = project_members::where('project_id', $project->id)
            ->with('user')
            ->get()
            ->map(function ($member) {
                return ['id' => $member->user->id, 'name' => $member->user->name];
            });

        return Inertia::render('work-items/create', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'statuses' => $statuses,
            'groups' => $groups,
            'members' => $members,
        ]);
    }

    public function store(Request $request, projects $project)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status_id' => 'required|exists:work_item_statuses,id',
            'group_id' => 'required|exists:work_item_groups,id',
            'assignee_id' => 'required|exists:users,id',
            'priority' => 'required|in:low,medium,high,critical',
            'progress' => 'nullable|integer|min:0|max:100',
            'due_date' => 'required|date',
        ]);

        $validated['project_id'] = $project->id;

        work_item::create($validated);

        return redirect()
            ->route('projects.work-items.index', $project->id)
            ->with('success', 'Work item created successfully.');
    }

    public function edit(projects $project, work_item $workItem)
    {
        $statuses = work_item_statuses::where('project_id', $project->id)
            ->orderBy('order')
            ->get(['id', 'name']);

        $groups = work_item_groups::where('project_id', $project->id)
            ->get(['id', 'name']);

        $members = project_members::where('project_id', $project->id)
            ->with('user')
            ->get()
            ->map(function ($member) {
                return ['id' => $member->user->id, 'name' => $member->user->name];
            });

        return Inertia::render('work-items/edit', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'workItem' => [
                'id' => $workItem->id,
                'title' => $workItem->title,
                'description' => $workItem->description,
                'status_id' => $workItem->status_id,
                'group_id' => $workItem->group_id,
                'assignee_id' => $workItem->assignee_id,
                'priority' => $workItem->priority,
                'progress' => $workItem->progress ?? 0,
                'due_date' => $workItem->due_date->format('Y-m-d'),
            ],
            'statuses' => $statuses,
            'groups' => $groups,
            'members' => $members,
        ]);
    }

    public function update(Request $request, projects $project, work_item $workItem)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status_id' => 'required|exists:work_item_statuses,id',
            'group_id' => 'required|exists:work_item_groups,id',
            'assignee_id' => 'required|exists:users,id',
            'priority' => 'required|in:low,medium,high,critical',
            'progress' => 'nullable|integer|min:0|max:100',
            'due_date' => 'required|date',
        ]);

        $workItem->update($validated);

        return redirect()
            ->route('projects.work-items.index', $project->id)
            ->with('success', 'Work item updated successfully.');
    }

    public function destroy(projects $project, work_item $workItem)
    {
        $workItem->delete();

        return redirect()
            ->route('projects.work-items.index', $project->id)
            ->with('success', 'Work item deleted successfully.');
    }

    public function bulkUpdateProgress(Request $request, projects $project)
    {
        $validated = $request->validate([
            'work_item_ids' => 'required|array',
            'work_item_ids.*' => 'exists:work_items,id',
            'progress' => 'required|integer|min:0|max:100',
        ]);

        $statusToDo = work_item_statuses::where('project_id', $project->id)
            ->where('name', 'To Do')
            ->first();
        $statusInProgress = work_item_statuses::where('project_id', $project->id)
            ->where('name', 'In Progress')
            ->first();
        $statusDone = work_item_statuses::where('project_id', $project->id)
            ->where('name', 'Done')
            ->first();

        foreach ($validated['work_item_ids'] as $itemId) {
            $workItem = work_item::where('id', $itemId)
                ->where('project_id', $project->id)
                ->firstOrFail();

            $workItem->update(['progress' => $validated['progress']]);

            $progress = $validated['progress'];
            if ($progress == 0 && $statusToDo) {
                $workItem->update(['status_id' => $statusToDo->id]);
            } elseif ($progress == 100 && $statusDone) {
                $workItem->update(['status_id' => $statusDone->id]);
            } elseif ($progress > 0 && $progress < 100 && $statusInProgress) {
                $workItem->update(['status_id' => $statusInProgress->id]);
            }
        }

        return redirect()->back()->with('success', 'Progress updated successfully.');
    }

    public function updateStatus(Request $request, work_item $workItem)
    {
        $validated = $request->validate([
            'status_id' => 'required|exists:work_item_statuses,id',
        ]);

        $workItem->update(['status_id' => $validated['status_id']]);

        return redirect()->back()->with('success', 'Work item status updated.');
    }
}
