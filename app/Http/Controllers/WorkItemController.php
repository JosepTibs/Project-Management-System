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
}