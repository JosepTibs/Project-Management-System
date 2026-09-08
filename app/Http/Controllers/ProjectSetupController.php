<?php

namespace App\Http\Controllers;

use App\Models\milestones;
use App\Models\project_members;
use App\Models\projects;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_groups;
use App\Models\work_item_statuses;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Illuminate\Support\Carbon;


class ProjectSetupController extends Controller
{
    public function show(projects $project)
    {
        $project->load(['members.user', 'statuses', 'milestones.work_item_groups.workItems', 'milestones.work_item_groups.assignees']);

        $ungroupedWorkItems = work_item::query()
            ->where('project_id', $project->id)
            ->whereNull('group_id')
            ->whereNotNull('milestone_id')
            ->get()
            ->groupBy('milestone_id');

        $allUsers = User::with('roles')
            ->select('id', 'username', 'email', 'fname', 'lname')
            ->get()
            ->sortBy(fn ($u) => $u->roles->first()?->name ?? 'zzz')
            ->values();

        return Inertia::render('projects/setup', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'item_prefix' => $project->item_prefix,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'end_date' => $project->end_date?->format('Y-m-d'),
                'status_name' => $project->status?->name,
            ],
            'statuses' => $project->statuses->sortBy('order')->values()->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'color' => $s->color,
                'order' => $s->order,
            ]),
            'allUsers' => $allUsers->map(fn ($u) => [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
                'role' => $u->roles->first()?->name ?? 'No Role',
            ]),
            
            'workItemStatuses' => work_item_statuses::where('project_id', $project->id)->orderBy('order')->get()->unique('name')->values()->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
            ]),
            'memberIds' => $project->members->pluck('user_id')->values(),
            'milestones' => $project->milestones->sortBy('order')->values()->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'description' => $m->description,
                'start_date' => $m->start_date?->format('Y-m-d'),
                'target_date' => $m->target_date?->format('Y-m-d'),
                'groups' => $m->work_item_groups->map(fn ($g) => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'description' => $g->description,
                    'start_date' => $g->start_date?->format('Y-m-d'),
                    'end_date' => $g->end_date?->format('Y-m-d'),
                    'progress' => (int) $g->progress,
                    'assignee_ids' => $g->assignees->pluck('id')->values(),
                    'work_items' => $g->workItems->map(fn ($w) => [
                        'id' => $w->id,
                        'title' => $w->title,
                        'description' => $w->description,
                        'priority' => $w->priority,
                        'due_date' => $w->due_date?->format('Y-m-d'),
                        'assignee_id' => $w->assignee_id,
                        'status_id' => $w->status_id,
                    ])->values(),
                ])->values(),
                'work_items' => ($ungroupedWorkItems[$m->id] ?? collect())->map(fn ($w) => [
                    'id' => $w->id,
                    'title' => $w->title,
                    'description' => $w->description,
                    'priority' => $w->priority,
                    'start_date' => $w->start_date?->format('Y-m-d'),
                    'due_date' => $w->due_date?->format('Y-m-d'),
                    'assignee_id' => $w->assignee_id,
                    'status_id' => $w->status_id,
                ])->values(),
            ]),
        ]);
    }

    public function groupsIndex(projects $project)
    {
        $project->load(['workItemGroups.milestone', 'workItemGroups.workItems.status', 'workItemGroups.workItems.assignee', 'workItemGroups.assignees']);

        $groups = $project->workItemGroups->sortByDesc('id')->map(function ($group) {
            $items = $group->workItems;
            $avgProgress = $items->count() > 0 ? round($items->avg('progress') ?? 0, 2) : (int) $group->progress;

            return [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'start_date' => $group->start_date?->format('Y-m-d'),
                'end_date' => $group->end_date?->format('Y-m-d'),
                'milestone_id' => $group->milestone_id,
                'milestone' => $group->milestone ? ['id' => $group->milestone->id, 'name' => $group->milestone->name] : null,
                'completion_percentage' => $avgProgress,
                'progress' => (int) $group->progress,
                'assignees' => $group->assignees->map(fn ($a) => ['id' => $a->id, 'name' => $a->name])->values(),
                'items_count' => $items->count(),
                'work_items' => $items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'title' => $item->title,
                        'priority' => $item->priority,
                        'due_date' => $item->due_date?->format('Y-m-d'),
                        'progress' => $item->progress ?? 0,
                        'status' => $item->status ? ['id' => $item->status->id, 'name' => $item->status->name] : null,
                        'assignee' => $item->assignee ? ['name' => $item->assignee->name] : null,
                    ];
                })->toArray(),
            ];
        })->toArray();

        return Inertia::render('projects/groups', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
            'groups' => $groups,
        ]);
    }

    public function apiShow(projects $project)
    {
        $project->load(['members.user', 'statuses', 'milestones.work_item_groups.workItems', 'milestones.work_item_groups.assignees']);

        $ungroupedWorkItems = work_item::query()
            ->where('project_id', $project->id)
            ->whereNull('group_id')
            ->whereNotNull('milestone_id')
            ->get()
            ->groupBy('milestone_id');

        $allUsers = User::with('roles')
            ->select('id', 'username', 'email', 'fname', 'lname')
            ->get()
            ->sortBy(fn ($u) => $u->roles->first()?->name ?? 'zzz')
            ->values();

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'item_prefix' => $project->item_prefix,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'end_date' => $project->end_date?->format('Y-m-d'),
                'status_name' => $project->status?->name,
            ],
            'statuses' => $project->statuses->sortBy('order')->values()->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'color' => $s->color,
                'order' => $s->order,
            ]),
            'allUsers' => $allUsers->map(fn ($u) => [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
                'role' => $u->roles->first()?->name ?? 'No Role',
            ]),
            'workItemStatuses' => work_item_statuses::where('project_id', $project->id)->orderBy('order')->get()->unique('name')->values()->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
            ]),
            'memberIds' => $project->members->pluck('user_id')->values(),
            'milestones' => $project->milestones->sortBy('order')->values()->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'description' => $m->description,
                'start_date' => $m->start_date?->format('Y-m-d'),
                'target_date' => $m->target_date?->format('Y-m-d'),
                'groups' => $m->work_item_groups->map(fn ($g) => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'description' => $g->description,
                    'start_date' => $g->start_date?->format('Y-m-d'),
                    'end_date' => $g->end_date?->format('Y-m-d'),
                    'progress' => (int) $g->progress,
                    'assignee_ids' => $g->assignees->pluck('id')->values(),
                    'work_items' => $g->workItems->map(fn ($w) => [
                        'id' => $w->id,
                        'title' => $w->title,
                        'description' => $w->description,
                        'priority' => $w->priority,
                        'due_date' => $w->due_date?->format('Y-m-d'),
                        'assignee_id' => $w->assignee_id,
                        'status_id' => $w->status_id,
                    ])->values(),
                ])->values(),
                'work_items' => ($ungroupedWorkItems[$m->id] ?? collect())->map(fn ($w) => [
                    'id' => $w->id,
                    'title' => $w->title,
                    'description' => $w->description,
                    'priority' => $w->priority,
                    'start_date' => $w->start_date?->format('Y-m-d'),
                    'due_date' => $w->due_date?->format('Y-m-d'),
                    'assignee_id' => $w->assignee_id,
                    'status_id' => $w->status_id,
                ])->values(),
            ]),
        ]);
    }

   public function update(Request $request, projects $project)
{
    // Restructuring a project (members, milestones, groups, bulk work
    // items) is admin/manager territory — members are view-only here.
    $project->loadMissing('members');
    $this->authorize('update', $project);

    $data = $request->validate([
        // Project fields
        'name' => 'sometimes|string|max:255',
        'description' => 'nullable|string',
        'start_date' => 'nullable|date',
        'end_date' => 'nullable|date|after_or_equal:start_date',
        'status_name' => 'nullable|string',
        'statuses' => 'nullable|array',
        'statuses.*.id' => 'nullable|integer',
        'statuses.*.name' => 'required|string|max:255',
        'statuses.*.color' => 'nullable|string|max:64',
        'statuses.*.order' => 'nullable|integer',
        // Members
        'member_ids' => 'nullable|array',
        'member_ids.*' => 'exists:users,id',
        // Milestones -> Groups -> Work items
        'milestones' => 'nullable|array',
        'milestones.*.id' => 'nullable|integer',
        'milestones.*.name' => 'nullable|string|max:255',
        'milestones.*.description' => 'nullable|string',
        'milestones.*.start_date' => 'nullable|date',
        'milestones.*.target_date' => 'nullable|date',
        'milestones.*.groups' => 'nullable|array',
        'milestones.*.groups.*.id' => 'nullable|integer',
        'milestones.*.groups.*.name' => 'nullable|string|max:255',
        'milestones.*.groups.*.description' => 'nullable|string',
        'milestones.*.groups.*.start_date' => 'nullable|date',
        'milestones.*.groups.*.end_date' => 'nullable|date',
        'milestones.*.groups.*.progress' => 'nullable|integer|min:0|max:100',
        'milestones.*.groups.*.assignee_ids' => 'nullable|array',
        'milestones.*.groups.*.assignee_ids.*' => 'exists:users,id',
        'milestones.*.groups.*.work_items' => 'nullable|array',
        'milestones.*.groups.*.work_items.*.id' => 'nullable|integer',
        'milestones.*.groups.*.work_items.*.title' => 'nullable|string|max:255',
        'milestones.*.groups.*.work_items.*.description' => 'nullable|string',
        'milestones.*.groups.*.work_items.*.priority' => 'nullable|in:low,medium,high,critical',
        'milestones.*.groups.*.work_items.*.due_date' => 'nullable|date',
        'milestones.*.groups.*.work_items.*.assignee_id' => 'nullable|exists:users,id',
        'milestones.*.groups.*.work_items.*.status_id' => 'nullable|exists:work_item_statuses,id',
        'milestones.*.work_items' => 'nullable|array',
        'milestones.*.work_items.*.id' => 'nullable|integer',
        'milestones.*.work_items.*.title' => 'nullable|string|max:255',
        'milestones.*.work_items.*.description' => 'nullable|string',
        'milestones.*.work_items.*.priority' => 'nullable|in:low,medium,high,critical',
        'milestones.*.work_items.*.start_date' => 'nullable|date',
        'milestones.*.work_items.*.due_date' => 'nullable|date',
        'milestones.*.work_items.*.assignee_id' => 'nullable|exists:users,id',
        'milestones.*.work_items.*.status_id' => 'nullable|exists:work_item_statuses,id',
    ]);

    // Validation for date hierarchy
    $projectStart = isset($data['start_date']) && $data['start_date']
        ? Carbon::parse($data['start_date'])
        : Carbon::parse($project->start_date ?? now()->subMonth(6)->startOfMonth()->format('Y-m-d'));
    $projectEnd = isset($data['end_date']) && $data['end_date']
        ? Carbon::parse($data['end_date'])
        : Carbon::parse($project->end_date ?? now()->addMonth(6)->startOfMonth()->format('Y-m-d'));

    if (isset($data['milestones'])) {
        foreach ($data['milestones'] as $milestone) {
            $msStart = null;
            $msTarget = null;

            if (! empty($milestone['start_date'])) {
                $msStart = Carbon::parse($milestone['start_date']);
                if ($msStart->lt($projectStart) || $msStart->gt($projectEnd)) {
                    return back()->withErrors(['milestones' => 'Milestone start date must be within project dates.']);
                }
            }
            if (! empty($milestone['target_date'])) {
                $msTarget = Carbon::parse($milestone['target_date']);
                if ($msTarget->lt($projectStart) || $msTarget->gt($projectEnd)) {
                    return back()->withErrors(['milestones' => 'Milestone target date must be within project dates.']);
                }
            }

            // Groups under this milestone
            if (isset($milestone['groups'])) {
                foreach ($milestone['groups'] as $group) {
                    if (! empty($group['start_date']) && $msStart) {
                        $gStart = Carbon::parse($group['start_date']);
                        if ($gStart->lt($msStart) || ($msTarget && $gStart->gt($msTarget))) {
                            return back()->withErrors(['groups' => 'Group start date must be within milestone dates.']);
                        }
                    }
                    if (! empty($group['end_date']) && $msTarget) {
                        $gEnd = Carbon::parse($group['end_date']);
                        if (($msStart && $gEnd->lt($msStart)) || $gEnd->gt($msTarget)) {
                            return back()->withErrors(['groups' => 'Group end date must be within milestone dates.']);
                        }
                    }

                    // Work items under this group
                    if (isset($group['work_items'])) {
                        $gStart = ! empty($group['start_date']) ? Carbon::parse($group['start_date']) : null;
                        $gEnd = ! empty($group['end_date']) ? Carbon::parse($group['end_date']) : null;

                        foreach ($group['work_items'] as $item) {
                            if (! empty($item['start_date']) && $gStart) {
                                $iStart = Carbon::parse($item['start_date']);
                                if ($iStart->lt($gStart) || ($gEnd && $iStart->gt($gEnd))) {
                                    return back()->withErrors(['work_items' => 'Item start date must be within group dates.']);
                                }
                            }
                            if (! empty($item['due_date']) && $gEnd) {
                                $iDue = Carbon::parse($item['due_date']);
                                if (($gStart && $iDue->lt($gStart)) || $iDue->gt($gEnd)) {
                                    return back()->withErrors(['work_items' => 'Item due date must be within group dates.']);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Update project fields
    $projectData = Arr::only($data, ['name', 'description', 'item_prefix', 'start_date', 'end_date']);
    if (! empty($projectData)) {
        $project->update($projectData);
    }

    // Sync lifecycle statuses (create / update / delete / reorder)
    if (isset($data['statuses'])) {
        // If we have a full submitted list, reconcile the status rows with it.
        $submittedStatusIds = collect($data['statuses'])->pluck('id')
            ->filter(fn ($id) => $id > 0)->toArray();

        // If the currently active status is being removed, clear it first so
        // the FK on projects.status_id never points at a deleted row.
        if ($project->status_id && ! in_array($project->status_id, $submittedStatusIds)) {
            $project->update(['status_id' => null]);
        }

        $project->statuses()->whereNotIn('id', $submittedStatusIds)->delete();

        foreach (array_values($data['statuses']) as $i => $statusData) {
            if (empty($statusData['name'])) {
                continue;
            }

            $row = [
                'name' => $statusData['name'],
                'color' => $statusData['color'] ?? null,
                'order' => ($statusData['order'] ?? ($i + 1)),
                'is_initial' => $i === 0,
            ];

            if (isset($statusData['id']) && $statusData['id'] > 0) {
                $project->statuses()->where('id', $statusData['id'])->update($row);
            } else {
                $project->statuses()->create($row);
            }
        }

        // Re-assign the project's lifecycle status.
        if (! empty($data['status_name'])) {
            $status = $project->statuses()->where('name', $data['status_name'])->first();
            if ($status) {
                $project->update(['status_id' => $status->id]);
            } elseif ($project->status_id === null) {
                $first = $project->statuses()->orderBy('order')->first();
                $project->update(['status_id' => $first?->id]);
            }
        } elseif ($project->status_id === null) {
            $first = $project->statuses()->orderBy('order')->first();
            $project->update(['status_id' => $first?->id]);
        }
    } elseif (! empty($data['status_name'])) {
        $status = $project->statuses()->where('name', $data['status_name'])->first();
        if ($status && $project->status_id !== $status->id) {
            $project->update(['status_id' => $status->id]);
        }
    }

    // Save members
    if (isset($data['member_ids'])) {
        $project->members()->whereNotIn('user_id', $data['member_ids'])->get()->each->delete();
        $existingIds = $project->members()->pluck('user_id')->toArray();
        foreach ($data['member_ids'] as $userId) {
            if (! in_array($userId, $existingIds)) {
                project_members::create(['project_id' => $project->id, 'user_id' => $userId]);
            }
        }
    }

    // Save nested milestones -> groups -> work items
    if (isset($data['milestones'])) {
        $submittedMilestoneIds = collect($data['milestones'])->pluck('id')->filter(fn ($id) => $id > 0)->toArray();
        $project->milestones()->whereNotIn('id', $submittedMilestoneIds)->delete();

        foreach ($data['milestones'] as $i => $milestone) {
            if (empty($milestone['name'])) {
                continue;
            }
            $milestoneData = array_merge(
                Arr::only($milestone, ['name', 'description', 'start_date', 'target_date']),
                ['order' => $i + 1],
            );
            $milestoneModel = isset($milestone['id']) && $milestone['id'] > 0
                ? $project->milestones()->findOrFail($milestone['id'])
                : $project->milestones()->create($milestoneData + ['project_id' => $project->id]);
            if (isset($milestone['id']) && $milestone['id'] > 0) {
                $milestoneModel->update($milestoneData);
            }

            // Work items attached directly to this milestone (no group).
            $submittedMilestoneItemIds = collect($milestone['work_items'] ?? [])->pluck('id')
                ->filter(fn ($id) => $id > 0)->toArray();
            work_item::query()
                ->where('milestone_id', $milestoneModel->id)
                ->whereNull('group_id')
                ->whereNotIn('id', $submittedMilestoneItemIds)
                ->delete();

            foreach ($milestone['work_items'] ?? [] as $item) {
                if (empty($item['title'])) {
                    continue;
                }
                $itemData = Arr::only($item, [
                    'title', 'description', 'priority', 'start_date', 'due_date', 'assignee_id', 'status_id',
                ]) + ['group_id' => null, 'milestone_id' => $milestoneModel->id];
                if (isset($item['id']) && $item['id'] > 0) {
                    work_item::findOrFail($item['id'])->update($itemData);
                } else {
                    work_item::create($itemData + ['project_id' => $project->id]);
                }
            }

            // Groups under this milestone
            $submittedGroupIds = collect($milestone['groups'] ?? [])->pluck('id')
                ->filter(fn ($id) => $id > 0)->toArray();
            $milestoneModel->work_item_groups()->whereNotIn('id', $submittedGroupIds)->delete();

            foreach ($milestone['groups'] ?? [] as $group) {
                if (empty($group['name'])) {
                    continue;
                }
                $groupData = array_merge(
                    Arr::only($group, ['name', 'description', 'start_date', 'end_date', 'progress']),
                    ['milestone_id' => $milestoneModel->id],
                );
                $groupModel = isset($group['id']) && $group['id'] > 0
                    ? work_item_groups::findOrFail($group['id'])
                    : $milestoneModel->work_item_groups()->create($groupData + ['project_id' => $project->id]);
                if (isset($group['id']) && $group['id'] > 0) {
                    $groupModel->update($groupData);
                }

                // Sync the members assigned to work on this group (multiple assignees)
                if (isset($group['assignee_ids'])) {
                    $groupModel->assignees()->sync($group['assignee_ids'] ?? []);
                }

                // Work items under this group
                $submittedItemIds = collect($group['work_items'] ?? [])->pluck('id')
                    ->filter(fn ($id) => $id > 0)->toArray();
                $groupModel->workItems()->whereNotIn('id', $submittedItemIds)->delete();

                foreach ($group['work_items'] ?? [] as $item) {
                    if (empty($item['title'])) {
                        continue;
                    }
                    $itemData = Arr::only($item, [
                        'title', 'description', 'priority', 'start_date', 'due_date', 'assignee_id', 'status_id',
                    ]) + ['group_id' => $groupModel->id];
                    if (isset($item['id']) && $item['id'] > 0) {
                        work_item::findOrFail($item['id'])->update($itemData);
                    } else {
                        work_item::create($itemData + ['project_id' => $project->id]);
                    }
                }

                // Auto-derive group progress from its work items when it has
                // any; otherwise keep the manually entered value.
               
            }
        }
    }

    return redirect()->route('projects.show', $project->id)
        ->with('success', 'Project setup complete.');
}

}