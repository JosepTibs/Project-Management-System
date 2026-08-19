<?php

namespace App\Http\Controllers;

use App\Models\projects;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_statuses;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
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
        $user = auth()->user();
        $isPrivileged = $user->roles->contains(function ($role) {
            return in_array(strtolower($role->name), ['admin', 'manager']);
        });

        $query = projects::with('creator')
            ->withCount('members', 'workItems')
            // Calculate average completion percentage from work items
            ->selectSub(function ($query) {
                $query->selectRaw('ROUND(AVG(progress), 2)')
                    ->from('work_items')
                    ->whereColumn('project_id', 'projects.id');
            }, 'completion_percentage')
            ->orderBy('created_at', 'desc');

        // Non-admin/manager users only see the projects they are a member of.
        if (!$isPrivileged) {
            $query->whereHas('members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            });
        }

        $projects = $query->get()
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
            'projects' => $projects->values(),
            'statuses' => self::defaultProjectStatuses(),
            'allUsers' => $this->allUsers(),
            'workItemStatuses' => work_item_statuses::select('id', 'name')->orderBy('id')->get()->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
            ]),
        ]);
    }

    /**
     * The users available to add as project members, with their primary role.
     *
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function allUsers()
    {
        return User::whereHas('roles', function ($query) {
            $query->where('name', 'member');
        })
            ->select('id', 'username', 'email', 'fname', 'lname')
            ->get()
            ->sortBy(fn ($u) => $u->roles->first()?->name ?? 'zzz')
            ->values()
            ->map(fn ($u) => [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
                'role' => $u->roles->first()?->name ?? 'No Role',
            ])
            ->values();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'item_prefix' => 'required|string|max:255',
        'start_date' => 'nullable|date',
        'end_date' => 'nullable|date|after_or_equal:start_date',
        'status_name' => 'nullable|string|in:'.implode(',', array_column(self::defaultProjectStatuses(), 'name')),
        'member_ids' => 'nullable|array',
        'member_ids.*' => 'exists:users,id',
        'milestones' => 'nullable|array',
        'milestones.*.name' => 'nullable|string|max:255',
        'milestones.*.description' => 'nullable|string',
        'milestones.*.start_date' => 'nullable|date',
        'milestones.*.target_date' => 'nullable|date',
        'milestones.*.groups' => 'nullable|array',
        'milestones.*.groups.*.name' => 'nullable|string|max:255',
        'milestones.*.groups.*.description' => 'nullable|string',
        'milestones.*.groups.*.start_date' => 'nullable|date',
        'milestones.*.groups.*.end_date' => 'nullable|date',
        'milestones.*.groups.*.work_items' => 'nullable|array',
        'milestones.*.groups.*.work_items.*.title' => 'nullable|string|max:255',
        'milestones.*.groups.*.work_items.*.description' => 'nullable|string',
        'milestones.*.groups.*.work_items.*.priority' => 'nullable|in:low,medium,high,critical',
        'milestones.*.groups.*.work_items.*.start_date' => 'nullable|date',
        'milestones.*.groups.*.work_items.*.due_date' => 'nullable|date',
        'milestones.*.groups.*.work_items.*.assignee_id' => 'nullable|exists:users,id',
        'milestones.*.groups.*.work_items.*.status_id' => 'nullable|exists:work_item_statuses,id',
    ]);

    $validated['created_by'] = auth()->id();

    $projectStart = isset($validated['start_date']) && $validated['start_date']
        ? Carbon::parse($validated['start_date'])
        : Carbon::parse(now()->subMonth(6)->startOfMonth()->format('Y-m-d'));
    $projectEnd = isset($validated['end_date']) && $validated['end_date']
        ? Carbon::parse($validated['end_date'])
        : Carbon::parse(now()->addMonth(6)->startOfMonth()->format('Y-m-d'));

    if (isset($validated['milestones'])) {
        foreach ($validated['milestones'] as $milestone) {
            if (!empty($milestone['start_date'])) {
                $msStart = Carbon::parse($milestone['start_date']);
                if ($msStart->lt($projectStart) || $msStart->gt($projectEnd)) {
                    return back()->withErrors(['milestones' => 'Milestone start date must be within project dates.']);
                }
            }
            if (!empty($milestone['target_date'])) {
                $msTarget = Carbon::parse($milestone['target_date']);
                if ($msTarget->lt($projectStart) || $msTarget->gt($projectEnd)) {
                    return back()->withErrors(['milestones' => 'Milestone target date must be within project dates.']);
                }
            }

            if (isset($milestone['groups'])) {
                $msStart = !empty($milestone['start_date']) ? Carbon::parse($milestone['start_date']) : null;
                $msTarget = !empty($milestone['target_date']) ? Carbon::parse($milestone['target_date']) : null;

                foreach ($milestone['groups'] as $group) {
                    if (!empty($group['start_date']) && $msStart) {
                        $gStart = Carbon::parse($group['start_date']);
                        if ($gStart->lt($msStart) || $gStart->gt($msTarget)) {
                            return back()->withErrors(['groups' => "Group start date must be within milestone dates."]);
                        }
                    }
                    if (!empty($group['end_date']) && $msTarget) {
                        $gEnd = Carbon::parse($group['end_date']);
                        if ($gEnd->lt($msStart) || $gEnd->gt($msTarget)) {
                            return back()->withErrors(['groups' => "Group end date must be within milestone dates."]);
                        }
                    }

                    if (isset($group['work_items'])) {
                        $gStart = !empty($group['start_date']) ? Carbon::parse($group['start_date']) : null;
                        $gEnd = !empty($group['end_date']) ? Carbon::parse($group['end_date']) : null;

                        foreach ($group['work_items'] as $item) {
                            if (!empty($item['start_date']) && $gStart) {
                                $iStart = Carbon::parse($item['start_date']);
                                if ($iStart->lt($gStart) || $iStart->gt($gEnd)) {
                                    return back()->withErrors(['work_items' => "Item start date must be within group dates."]);
                                }
                            }
                            if (!empty($item['due_date']) && $gEnd) {
                                $iDue = Carbon::parse($item['due_date']);
                                if ($iDue->lt($gStart) || $iDue->gt($gEnd)) {
                                    return back()->withErrors(['work_items' => "Item due date must be within group dates."]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    $project = projects::create(Arr::only($validated, [
        'name',
        'description',
        'item_prefix',
        'start_date',
        'end_date',
        'created_by',
    ]));

    if (!empty($validated['status_name'])) {
        $status = $project->statuses()->where('name', $validated['status_name'])->first();
        if ($status) {
            $project->update(['status_id' => $status->id]);
        }
    }

    if (isset($validated['member_ids'])) {
        foreach ($validated['member_ids'] as $userId) {
            $project->members()->create(['user_id' => $userId]);
        }
    }

    if (isset($validated['milestones'])) {
        foreach ($validated['milestones'] as $milestoneIndex => $milestone) {
            if (empty($milestone['name'])) {
                continue;
            }

            $milestoneModel = $project->milestones()->create([
                'name' => $milestone['name'],
                'description' => $milestone['description'] ?? null,
                'start_date' => $milestone['start_date'] ?? null,
                'target_date' => $milestone['target_date'] ?? null,
                'order' => $milestoneIndex + 1,
            ]);

            foreach ($milestone['groups'] ?? [] as $group) {
                if (empty($group['name'])) {
                    continue;
                }

                $groupModel = $milestoneModel->work_item_groups()->create([
                    'project_id' => $project->id,
                    'name' => $group['name'],
                    'description' => $group['description'] ?? null,
                    'start_date' => $group['start_date'] ?? null,
                    'end_date' => $group['end_date'] ?? null,
                ]);

                foreach ($group['work_items'] ?? [] as $item) {
                    if (empty($item['title'])) {
                        continue;
                    }

                    work_item::create([
                        'project_id' => $project->id,
                        'group_id' => $groupModel->id,
                        'title' => $item['title'],
                        'description' => $item['description'] ?? null,
                        'priority' => $item['priority'] ?? null,
                        'start_date' => $item['start_date'] ?? null,
                        'due_date' => $item['due_date'] ?? null,
                        'assignee_id' => $item['assignee_id'] ?? null,
                        'status_id' => $item['status_id'] ?? null,
                    ]);
                }
            }
        }
    }

    return redirect()->route('projects.index')->with('success', 'Project Created Successfully');
}
    /**
     * The default lifecycle statuses used for a new project.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function defaultProjectStatuses(): array
    {
        return [
            ['name' => 'Draft',     'color' => '#6b7280', 'is_initial' => true],
            ['name' => 'Planning',  'color' => '#3b82f6', 'is_initial' => false],
            ['name' => 'Approved',  'color' => '#8b5cf6', 'is_initial' => false],
            ['name' => 'Active',    'color' => '#10b981', 'is_initial' => false],
            ['name' => 'On Hold',   'color' => '#f59e0b', 'is_initial' => false],
            ['name' => 'Completed', 'color' => '#14b8a6', 'is_initial' => false],
        ];
    }

    /**
     * Display the specified resource.
     */
    public function show(projects $project)
    {
        $project->loadMissing('members');
        $this->authorize('view', $project);

        $project->load(['creator', 'members.user', 'workItems', 'milestones', 'workItemGroups.workItems', 'status', 'statuses']);

        $user = auth()->user();

        // Build kanban/gantt/calendar data (mirrors kanban()).
        $kanbanWorkItems = work_item::where('project_id', $project->id)
            ->with(['status', 'assignee', 'group'])
            ->get();

        $statuses = work_item_statuses::where('project_id', $project->id)
            ->orderBy('order')
            ->get(['id', 'name', 'color']);

        $groupedWorkItems = $kanbanWorkItems->groupBy('status.name')
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

        $columns = collect($statuses)->map(function ($status) use ($groupedWorkItems) {
            $existing = collect($groupedWorkItems)->firstWhere('status', $status->name);
            return $existing ?: [
                'status' => $status->name,
                'items' => [],
            ];
        })->values()->toArray();

        $workItems = $kanbanWorkItems->map(fn ($item) => [
            'id' => $item->id,
            'group_id' => $item->group_id,
            'title' => $item->title,
            'description' => $item->description,
            'start_date' => $item->start_date?->format('Y-m-d'),
            'due_date' => $item->due_date?->format('Y-m-d'),
            'progress' => $item->progress ?? 0,
            'priority' => $item->priority,
            'status' => $item->status ? ['id' => $item->status->id, 'name' => $item->status->name] : null,
            'assignee' => $item->assignee ? ['id' => $item->assignee->id, 'name' => $item->assignee->name] : null,
        ])->values();

                return Inertia::render('projects/show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'created_by' => $project->created_by,
                'creator_name' => $project->creator?->name,
                'description' => $project->description,
                                'item_prefix' => $project->item_prefix,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'end_date' => $project->end_date?->format('Y-m-d'),
                'status_name' => $project->status?->name,
                'members_count' => $project->members->count(),
                'work_items_count' => $project->workItems->count(),
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
                        'progress' => $item->progress ?? 0,
                        'description' => $item->description,
                        'status' => $item->status ? ['id' => $item->status->id, 'name' => $item->status->name] : null,
                        'assignee' => $item->assignee ? ['id' => $item->assignee->id, 'name' => $item->assignee->name] : null,
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
                        'group_id' => $item->group_id,
                        'progress' => $item->progress ?? 0,
                        'description' => $item->description,
                        'status' => $item->status ? ['id' => $item->status->id, 'name' => $item->status->name] : null,
                        'assignee' => $item->assignee ? ['id' => $item->assignee->id, 'name' => $item->assignee->name] : null,
                            ];
                        }),
                    ];
                }),
                
            ],
            'columns' => $columns,
            'statuses' => $statuses,
            'workItems' => $workItems,
            'setup' => [
                'allUsers' => $this->allUsers(),
                'statuses' => $project->statuses->sortBy('order')->values()->map(fn ($s) => [
                    'name' => $s->name,
                    'color' => $s->color,
                ]),
                'workItemStatuses' => work_item_statuses::select('id', 'name')->orderBy('id')->get()->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                ]),
                'memberIds' => $project->members->pluck('user_id')->values(),
                'milestones' => $project->milestones->sortBy('order')->values()->map(function ($m) use ($project) {
                    return [
                        'id' => $m->id,
                        'name' => $m->name,
                        'description' => $m->description,
                        'start_date' => $m->start_date?->format('Y-m-d'),
                        'target_date' => $m->target_date?->format('Y-m-d'),
                        'groups' => $project->workItemGroups->where('milestone_id', $m->id)->map(function ($g) {
                            return [
                                'id' => $g->id,
                                'name' => $g->name,
                                'description' => $g->description,
                                'start_date' => $g->start_date?->format('Y-m-d'),
                                'end_date' => $g->end_date?->format('Y-m-d'),
                                'work_items' => $g->workItems->map(fn ($w) => [
                                    'id' => $w->id,
                                    'title' => $w->title,
                                    'description' => $w->description,
                                    'priority' => $w->priority,
                                    'start_date' => $w->start_date?->format('Y-m-d'),
                                    'due_date' => $w->due_date?->format('Y-m-d'),
                                    'assignee_id' => $w->assignee_id,
                                    'status_id' => $w->status_id,
                                ])->values(),
                            ];
                        })->values(),
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
                'status' => $project->status,
                'item_prefix' => $project->item_prefix,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'end_date' => $project->end_date?->format('Y-m-d'),
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
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            
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
        $project->load([
    'workItemGroups',
    'milestones',
    'workItems.status',
    'workItems.assignee',
      
    ]);
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

            'workItems' => $project->workItems->map(fn ($item) => [
            'id' => $item->id,
            'group_id' => $item->group_id,
            'title' => $item->title,
            'description' => $item->description,
            'start_date' => $item->start_date?->format('Y-m-d'),
            'due_date' => $item->due_date?->format('Y-m-d'),
            'progress' => $item->progress ?? 0,
            'priority' => $item->priority,
            'status' => $item->status ? ['id' => $item->status->id, 'name' => $item->status->name] : null,
            'assignee' => $item->assignee ? ['id' => $item->assignee->id, 'name' => $item->assignee->name] : null,
            
        ]),
        'milestones' => $project->milestones->map(fn ($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'description' => $m->description,
            'target_date' => $m->target_date->format('Y-m-d'),
            'completed_at' => $m->completed_at,
        ]),
        'workItemGroups' => $project->workItemGroups->map(fn ($group) => [
            'id' => $group->id,
            'name' => $group->name,
            'description' => $group->description,
            'start_date' => $group->start_date?->format('Y-m-d'),
            'end_date' => $group->end_date?->format('Y-m-d'),
            'milestone_id' => $group->milestone_id,
        ]),
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