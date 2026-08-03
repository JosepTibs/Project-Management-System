<?php

namespace App\Http\Controllers;

use App\Models\projects;
use App\Models\work_item;
use App\Models\work_item_statuses;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Handles project CRUD operations and displays project dashboards.
 */
class ProjectsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Returns all projects with creator, member count, work item count,
     * and average completion percentage.
     */
    public function index()
    {
        $projects = projects::with('creator')
            ->withCount('members', 'workItems')
            // Calculate average completion percentage from work items
            ->selectSub(function ($query) {
                $query->selectRaw('ROUND(AVG(progress), 2)')
                    ->from('work_items')
                    ->whereColumn('project_id', 'projects.id');
            }, 'completion_percentage')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'created_by' => $project->created_by,
                    'creator_name' => $project->creator?->name,
                    'description' => $project->description,
                    'item_prefix' => $project->item_prefix,
                    'members_count' => $project->members_count,
                    'work_items_count' => $project->work_items_count,
                    'completion_percentage' => $project->completion_percentage ?? 0,
                ];
            });

        return Inertia::render('projects/index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return Inertia::render('projects/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'item_prefix' => 'required|string|max:255',
        ]);
        $validated['created_by'] = auth()->id();
        $project = projects::create($validated);

        return redirect()->route('projects.setup.show', $project->id)->with('success', 'Project created. Now set it up.');
    }

    /**
     * Display the specified resource.
     */
    public function show(projects $project)
    {
        $project->loadMissing('members');
        $this->authorize('view', $project);

        $project->load(['creator', 'members.user', 'workItems', 'milestones', 'workItemGroups.workItems']);

        $user = auth()->user();

        return Inertia::render('projects/show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'created_by' => $project->created_by,
                'creator_name' => $project->creator?->name,
                'description' => $project->description,
                'item_prefix' => $project->item_prefix,
                'completion_percentage' => $project->completion_percentage,
                'members' => $project->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'user_id' => $member->user_id,
                        'user_name' => $member->user?->name,
                        'user_email' => $member->user?->email,
                    ];
                }),
                'work_items' => $project->workItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'title' => $item->title,
                        'priority' => $item->priority,
                        'due_date' => $item->due_date?->format('Y-m-d'),
                        'group_id' => $item->group_id,
                    ];
                }),
                'milestones' => $project->milestones->map(function ($milestone) {
                    return [
                        'id' => $milestone->id,
                        'name' => $milestone->name,
                        'description' => $milestone->description,
                        'start_date' => $milestone->start_date?->format('Y-m-d'),
                        'target_date' => $milestone->target_date?->format('Y-m-d'),
                        'completed_at' => $milestone->completed_at?->format('Y-m-d'),
                        'completion_percentage' => $milestone->completion_percentage,
                        'order' => $milestone->order,
                    ];
                }),
                'work_item_groups' => $project->workItemGroups->map(function ($group) {
                    $items = $group->workItems;
                    $avgProgress = $items->count() > 0 ? round($items->avg('progress') ?? 0, 2) : 0;

                    return [
                        'id' => $group->id,
                        'name' => $group->name,
                        'description' => $group->description,
                        'start_date' => $group->start_date?->format('Y-m-d'),
                        'end_date' => $group->end_date?->format('Y-m-d'),
                        'milestone_id' => $group->milestone_id,
                        'completion_percentage' => $avgProgress,
                        'work_items' => $group->workItems->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'title' => $item->title,
                                'priority' => $item->priority,
                                'due_date' => $item->due_date?->format('Y-m-d'),
                                'progress' => $item->progress ?? 0,
                            ];
                        }),
                    ];
                }),
            ],
            'can' => [
                'view' => $user->can('view', $project),
                'update' => $user->can('update', $project),
                'delete' => $user->can('delete', $project),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(projects $project)
    {
        //
        return Inertia::render('projects/edit', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'item_prefix' => $project->item_prefix,
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, projects $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'item_prefix' => 'required|string|max:255',
        ]);

        $project->update($validated);

        return redirect()->route('projects.index')->with('success', 'Project Updated Successfully');
    }

    /**
     * Display the kanban board for a project.
     *
     * Groups work items by their status to create kanban columns.
     * Ensures all defined statuses appear even if they have no work items.
     */
    public function kanban(projects $project)
    {
        // Fetch and group work items by status name
        $workItems = work_item::where('project_id', $project->id)
            ->with(['status', 'assignee', 'group'])
            ->get()
            ->groupBy('status.name')
            ->map(function ($items, $statusName) {
                return [
                    'status' => $statusName,
                    'items' => $items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->title,
                            'priority' => $item->priority,
                            'assignee_name' => $item->assignee?->name,
                            'due_date' => $item->due_date?->format('Y-m-d'),
                            'group_name' => $item->group?->name,
                        ];
                    })->values()->toArray(),
                ];
            })->values()->toArray();

        // Fetch all statuses for this project
        $statuses = work_item_statuses::where('project_id', $project->id)
            ->orderBy('order')
            ->get(['id', 'name', 'color']);

        // Ensure all statuses appear as columns even if empty
        $columns = collect($statuses)->map(function ($status) use ($workItems) {
            $existing = collect($workItems)->firstWhere('status', $status->name);

            return $existing ?: [
                'status' => $status->name,
                'items' => [],
            ];
        })->toArray();

        return Inertia::render('projects/kanban', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
            'columns' => $columns,
            'statuses' => $statuses,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(projects $project)
    {
        $this->authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project Deleted Successfully');
    }
}