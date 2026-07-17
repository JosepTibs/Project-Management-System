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
use Inertia\Inertia;

class ProjectSetupController extends Controller
{
    public function show(projects $project)
    {
        $project->load(['members.user', 'workItemGroups', 'milestones']);

        $allUsers = User::select('id', 'name', 'email')->orderBy('name')->get();

        return Inertia::render('projects/setup', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'item_prefix' => $project->item_prefix,
            ],
            'allUsers' => $allUsers->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
            ]),
            'members' => $project->members->map(fn($m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'user_name' => $m->user?->name,
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
            'groups.*.name' => 'required_with:groups|string|max:255',
            'groups.*.description' => 'nullable|string',
            'groups.*.start_date' => 'nullable|date',
            'groups.*.end_date' => 'nullable|date',
            // Milestones
            'milestones' => 'nullable|array',
            'milestones.*.name' => 'required_with:milestones|string|max:255',
            'milestones.*.description' => 'nullable|string',
            'milestones.*.start_date' => 'nullable|date',
            'milestones.*.target_date' => 'nullable|date',
            // Work Items
            'work_items' => 'nullable|array',
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
            $project->members()->whereNotIn('user_id', $data['user_ids'])->delete();
            $existingIds = $project->members()->pluck('user_id')->toArray();
            foreach ($data['user_ids'] as $userId) {
                if (!in_array($userId, $existingIds)) {
                    project_members::create(['project_id' => $project->id, 'user_id' => $userId]);
                }
            }
        }

        // Save groups
        if (isset($data['groups'])) {
            $project->workItemGroups()->delete();
            foreach ($data['groups'] as $group) {
                $project->workItemGroups()->create($group);
            }
        }

        // Save milestones
        if (isset($data['milestones'])) {
            $project->milestones()->delete();
            foreach ($data['milestones'] as $i => $milestone) {
                $project->milestones()->create(array_merge($milestone, ['order' => $i + 1]));
            }
        }

        // Save work items
        if (isset($data['work_items'])) {
            $project->workItems()->delete();
            foreach ($data['work_items'] as $item) {
                $item['project_id'] = $project->id;
                work_item::create($item);
            }
        }

        return redirect()->route('projects.show', $project->id)
            ->with('success', 'Project setup complete.');
    }
}
