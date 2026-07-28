<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\projects;
use App\Models\project_members;
use App\Models\work_item_groups;
use App\Models\milestones;
use App\Models\work_item;
use App\Models\work_item_statuses;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;

class ProjectSetupController extends Controller
{
    public function show(projects $project)
    {
        $project->load(['members.user', 'workItemGroups', 'milestones', 'workItems']);

        $allUsers = User::select('id', 'username', 'email')->orderBy('username')->get();

        return Inertia::render('projects/setup', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'item_prefix' => $project->item_prefix,
            ],
            'allUsers' => $allUsers->map(fn($u) => [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
            ]),
            'members' => $project->members->map(fn($m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'user_name' => $m->user?->username,
                'user_email' => $m->user?->email,
            ]),
            'workItemGroups' => $project->workItemGroups->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'description' => $g->description,
                'start_date' => $g->start_date?->format('Y-m-d'),
                'end_date' => $g->end_date?->format('Y-m-d'),
            ]),
            'milestones' => $project->milestones->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'description' => $m->description,
                'start_date' => $m->start_date?->format('Y-m-d'),
                'target_date' => $m->target_date?->format('Y-m-d'),
                'order' => $m->order,
            ]),
            'statuses' => work_item_statuses::select('id', 'name')->orderBy('id')->get()->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
            ]),
            'workItems' => $project->workItems->map(fn($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'description' => $w->description,
                'priority' => $w->priority,
                'due_date' => $w->due_date?->format('Y-m-d'),
                'assignee_id' => $w->assignee_id,
                'group_id' => $w->group_id,
                'status_id' => $w->status_id,
            ]),
        ]);
    }

    public function groupsIndex(projects $project)
    {
        $project->load(['workItemGroups.workItems.status', 'workItemGroups.workItems.assignee']);

        $groups = $project->workItemGroups->map(function ($group) {
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

    public function update(Request $request, projects $project)
    {
        $data = $request->validate([
            // Members
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
            // Groups
            'groups' => 'nullable|array',
            'groups.*.id' => 'nullable|integer|exists:work_item_groups,id',
            'groups.*.name' => 'required_with:groups|string|max:255',
            'groups.*.description' => 'nullable|string',
            'groups.*.start_date' => 'nullable|date',
            'groups.*.end_date' => 'nullable|date',
            // Milestones
            'milestones' => 'nullable|array',
            'milestones.*.id' => 'nullable|integer|exists:milestones,id',
            'milestones.*.name' => 'required_with:milestones|string|max:255',
            'milestones.*.description' => 'nullable|string',
            'milestones.*.start_date' => 'nullable|date',
            'milestones.*.target_date' => 'nullable|date',
            // Work Items
            'work_items' => 'nullable|array',
            'work_items.*.id' => 'nullable|integer|exists:work_items,id',
            'work_items.*.title' => 'required_with:work_items|string|max:255',
            'work_items.*.description' => 'nullable|string',
            'work_items.*.priority' => 'required_with:work_items|in:low,medium,high,critical',
            'work_items.*.due_date' => 'nullable|date',
            'work_items.*.assignee_id' => 'nullable|exists:users,id',
            'work_items.*.group_id' => 'nullable|exists:work_item_groups,id',
            'work_items.*.status_id' => 'nullable|exists:work_item_statuses,id',
        ]);

        // Save members
        if (isset($data['user_ids'])) {
            $project->members()->whereNotIn('user_id', $data['user_ids'])->get()->each->delete();
            $existingIds = $project->members()->pluck('user_id')->toArray();
            foreach ($data['user_ids'] as $userId) {
                if (!in_array($userId, $existingIds)) {
                    project_members::create(['project_id' => $project->id, 'user_id' => $userId]);
                }
            }
        }

        // Save groups — update existing, create new, delete removed
        if (isset($data['groups'])) {
            $submittedGroupIds = collect($data['groups'])->pluck('id')->filter()->toArray();
            $project->workItemGroups()->whereNotIn('id', $submittedGroupIds)->delete();

            foreach ($data['groups'] as $group) {
                $groupData = Arr::only($group, ['name', 'description', 'start_date', 'end_date']);
                if (isset($group['id'])) {
                    $project->workItemGroups()->where('id', $group['id'])->update($groupData);
                } else {
                    $groupData['project_id'] = $project->id;
                    $project->workItemGroups()->create($groupData);
                }
            }
        }

        // Save milestones — update existing, create new, delete removed
        if (isset($data['milestones'])) {
            $submittedMilestoneIds = collect($data['milestones'])->pluck('id')->filter()->toArray();
            $project->milestones()->whereNotIn('id', $submittedMilestoneIds)->delete();

            foreach ($data['milestones'] as $i => $milestone) {
                $milestoneData = array_merge(
                    Arr::only($milestone, ['name', 'description', 'start_date', 'target_date']),
                    ['order' => $i + 1]
                );
                if (isset($milestone['id'])) {
                    $project->milestones()->where('id', $milestone['id'])->update($milestoneData);
                } else {
                    $milestoneData['project_id'] = $project->id;
                    $project->milestones()->create($milestoneData);
                }
            }
        }

        // Save work items — update existing, create new, delete removed
        if (isset($data['work_items'])) {
            $submittedWorkItemIds = collect($data['work_items'])->pluck('id')->filter()->toArray();
            $project->workItems()->whereNotIn('id', $submittedWorkItemIds)->delete();

            foreach ($data['work_items'] as $item) {
                $itemData = Arr::only($item, ['title', 'description', 'priority', 'due_date', 'assignee_id', 'group_id', 'status_id']);
                if (isset($item['id'])) {
                    $project->workItems()->where('id', $item['id'])->update($itemData);
                } else {
                    $itemData['project_id'] = $project->id;
                    work_item::create($itemData);
                }
            }
        }

        return redirect()->route('projects.show', $project->id)
            ->with('success', 'Project setup complete.');
    }
}
