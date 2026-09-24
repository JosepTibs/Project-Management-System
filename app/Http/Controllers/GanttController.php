<?php

namespace App\Http\Controllers;

use App\Models\dependencies;
use App\Models\milestones;
use App\Models\projects;
use App\Models\work_item;
use App\Models\work_item_groups;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Handles interactive Gantt chart operations including task resizing,
 * moving, and dependency management.
 */
class GanttController extends Controller
{
    /**
     * Display the Gantt chart view for a project.
     */
    public function index(projects $project)
    {
        $project->load([
    'workItemGroups',
    'milestones',
    'workItems.status',
    'workItems.assignee',
       
    ]);

        return Inertia::render('projects/gantt', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'end_date' => $project->end_date?->format('Y-m-d'),
            ],
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
                'start_date' => $m->start_date?->format('Y-m-d'),
                'target_date' => $m->target_date->format('Y-m-d'),
                'completed_at' => $m->completed_at,
                'completion_percentage' => $m->completion_percentage,
            ]),
            'workItemGroups' => $project->workItemGroups->map(fn ($group) => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'start_date' => $group->start_date?->format('Y-m-d'),
                'end_date' => $group->end_date?->format('Y-m-d'),
                'milestone_id' => $group->milestone_id,
                'completion_percentage' => $group->completion_percentage,
                'work_items' => $group->workItems->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'start_date' => $item->start_date?->format('Y-m-d'),
                    'due_date' => $item->due_date?->format('Y-m-d'),
                    'progress' => $item->progress ?? 0,
                    'priority' => $item->priority,
                    
                ]),
            ]),
        ]);
    }

    /**
     * Resize a work item (update duration by changing end date).
     */
    public function resize(Request $request, projects $project, work_item $workItem)
    {
        $this->authorize('work-item.update', $workItem);

        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'due_date' => 'required|date|after_or_equal:start_date',
        ]);

        // Ensure work item belongs to project
        if ($workItem->project_id !== $project->id) {
            abort(403, 'Work item does not belong to this project.');
        }

        $workItem->update($validated);

        return redirect()->back()->with('success', 'WorkItem Resized Successfully');
        
    }

    /**
     * Move a work item (update start date, auto-calculate end date based on duration).
     */
    public function move(Request $request, projects $project, work_item $workItem)
    {
        $this->authorize('work-item.update', $workItem);

        $validated = $request->validate([
            'start_date' => 'required|date',
        ]);

        // Ensure work item belongs to project
        if ($workItem->project_id !== $project->id) {
            abort(403, 'Work item does not belong to this project.');
        }

        $oldStartDate = $workItem->start_date;
        $oldEndDate = $workItem->due_date;

        // Calculate duration (in days)
        if ($oldStartDate && $oldEndDate) {
            $duration = $oldStartDate->diffInDays($oldEndDate);
            $newEndDate = \Carbon\Carbon::parse($validated['start_date'])->addDays($duration);
            
            $workItem->update([
                'start_date' => $validated['start_date'],
                'due_date' => $newEndDate->format('Y-m-d'),
            ]);
        } else {
            // If no dates set, just set start date
            $workItem->update(['start_date' => $validated['start_date']]);
        }

         return redirect()->back()->with('success', 'WorkItem Resized Successfully');
    }

    /**
     * Create a new dependency between work items.
     */
    public function storeDependency(Request $request, projects $project)
    {
        $validated = $request->validate([
            'predecessor_id' => 'required|exists:work_items,id',
            'successor_id' => 'required|exists:work_items,id|different:predecessor_id',
            'type' => 'required|in:finish_to_start,start_to_start,start_to_finish,finish_to_finish',
            'lag' => 'nullable|integer|min:0',
        ]);

        // Verify both work items belong to the project
        $predecessor = work_item::findOrFail($validated['predecessor_id']);
        $successor = work_item::findOrFail($validated['successor_id']);

        if ($predecessor->project_id !== $project->id || $successor->project_id !== $project->id) {
            abort(403, 'Work items do not belong to this project.');
        }

        // Check for circular dependencies
        if ($this->wouldCreateCircularDependency($validated['predecessor_id'], $validated['successor_id'])) {
            return redirect()->back()->with('success', 'WorkItem Resized Successfully');
        }

        // Check if dependency already exists
        $existing = dependencies::where('predecessor_id', $validated['predecessor_id'])
            ->where('successor_id', $validated['successor_id'])
            ->first();

        if ($existing) {
             return redirect()->back()->with('success', 'WorkItem Resized Successfully');
        }

        $dependency = dependencies::create($validated);

         return redirect()->back()->with('success', 'Dependency Created Successfully');
    }

    /**
     * Delete a dependency.
     */
    public function destroyDependency(projects $project, dependencies $dependency)
    {
        // Verify dependency belongs to project
        $predecessor = $dependency->predecessor;
        $successor = $dependency->successor;

        if ($predecessor->project_id !== $project->id || $successor->project_id !== $project->id) {
            abort(403, 'Dependency does not belong to this project.');
        }

        $dependency->delete();

         return redirect()->back()->with('success', 'Dependency Deleted Successfully');
    }

    /**
     * Get all dependencies for a project.
     */
    public function getDependencies(projects $project)
    {
        $workItemIds = $project->workItems->pluck('id');

        $dependencies = dependencies::whereIn('predecessor_id', $workItemIds)
            ->whereIn('successor_id', $workItemIds)
            ->with(['predecessor', 'successor'])
            ->get()
            ->map(fn ($dep) => [
                'id' => $dep->id,
                'predecessor_id' => $dep->predecessor_id,
                'successor_id' => $dep->successor_id,
                'type' => $dep->type,
                'lag' => $dep->lag,
                'predecessor' => [
                    'id' => $dep->predecessor->id,
                    'title' => $dep->predecessor->title,
                ],
                'successor' => [
                    'id' => $dep->successor->id,
                    'title' => $dep->successor->title,
                ],
            ]);

        return response()->json([
            'success' => true,
            'dependencies' => $dependencies,
        ]);
    }

    /**
     * Check if creating a dependency would create a circular reference.
     */
    private function wouldCreateCircularDependency(int $predecessorId, int $successorId): bool
    {
        // Check if successor is already an ancestor of predecessor
        $visited = [];
        $stack = [$successorId];

        while (!empty($stack)) {
            $current = array_pop($stack);
            
            if ($current === $predecessorId) {
                return true;
            }

            if (in_array($current, $visited)) {
                continue;
            }

            $visited[] = $current;

            // Get all predecessors of current node
            $deps = dependencies::where('successor_id', $current)->pluck('predecessor_id')->toArray();
            $stack = array_merge($stack, $deps);
        }

        return false;
    }

    public function moveGroup(Request  $request, projects $project, work_item_groups $group) 
    {
        $this->authorize('update', $project);

        if($group->project_id !== $project->id){
            abort(403, ' Group Does not belong to this project');
        }

        $validated = $request->validate([
            'start_date'=> 'required|date',
            'end_date'=> 'required|date|after_or_equal:start_date',
        ]);

        // Group dates are DERIVED from their work items, so moving a group
        // shifts every item in it by the same day delta, then the group
        // window is recomputed from the items.
        $delta = (int) round((float) Carbon::parse($group->start_date)->startOfDay()
            ->diffInDays(Carbon::parse($validated['start_date'])->startOfDay(), false));

        // Clamp the shift so items stay inside the parent milestone window.
        $delta = $this->clampDeltaToMilestone($group, null, $delta);

        if ($delta !== 0) {
            work_item::query()
                ->where('group_id', $group->id)
                ->whereNotNull('due_date')
                ->update([
                    'start_date' => DB::raw('DATE_ADD(COALESCE(start_date, due_date), INTERVAL '.$delta.' DAY)'),
                    'due_date' => DB::raw('DATE_ADD(due_date, INTERVAL '.$delta.' DAY)'),
                ]);
        }

        work_item::recomputeGroupSchedule($group->id);

        return redirect()->back()->with('success','Group moved successfully');
    }

    public function resizeGroup(Request $request, projects $project, work_item_groups $group)
    {
       $this->authorize('update', $project);

        if($group->project_id !== $project->id){
            abort(403, ' Group Does not belong to this project');
        }

        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        // Group dates are DERIVED from their work items, so resizing a group
        // moves only the boundary items (left edge: earliest starts, right
        // edge: latest dues), then the window is recomputed.
        $oldStart = Carbon::parse($group->start_date)->startOfDay();
        $oldEnd = Carbon::parse($group->end_date)->startOfDay();
        $newStart = Carbon::parse($validated['start_date'])->startOfDay();
        $newEnd = Carbon::parse($validated['end_date'])->startOfDay();

        // Left edge: shift the items currently sitting on the group's start.
        if (! $newStart->equalTo($oldStart)) {
            $delta = (int) round((float) $oldStart->diffInDays($newStart, false));
            $delta = $this->clampDeltaToMilestone($group, 'start', $delta);

            if ($delta !== 0) {
                work_item::query()
                    ->where('group_id', $group->id)
                    ->whereRaw('COALESCE(start_date, due_date) = ?', [$group->start_date->toDateString()])
                    ->update([
                        'start_date' => DB::raw('DATE_ADD(COALESCE(start_date, due_date), INTERVAL '.$delta.' DAY)'),
                        'due_date' => DB::raw('DATE_ADD(due_date, INTERVAL '.$delta.' DAY)'),
                    ]);

                work_item::recomputeGroupSchedule($group->id);
            }
        }

        // Right edge: shift the items currently sitting on the group's end.
        if (! $newEnd->equalTo($oldEnd)) {
            $delta = (int) round((float) $oldEnd->diffInDays($newEnd, false));
            $delta = $this->clampDeltaToMilestone($group, 'end', $delta);

            if ($delta !== 0) {
                work_item::query()
                    ->where('group_id', $group->id)
                    ->where('due_date', $group->end_date->toDateString())
                    ->update([
                        'start_date' => DB::raw('DATE_ADD(COALESCE(start_date, due_date), INTERVAL '.$delta.' DAY)'),
                        'due_date' => DB::raw('DATE_ADD(due_date, INTERVAL '.$delta.' DAY)'),
                    ]);

                work_item::recomputeGroupSchedule($group->id);
            }
        }

        return redirect()->back()->with('success', 'Group resized successfully');
    }

    /**
     * Clamp a day-shift so the group's items stay inside the parent
     * milestone window. $edge narrows the check to a single boundary
     * ('start' for left-edge resizes, 'end' for right-edge ones, null for
     * full moves).
     */
    private function clampDeltaToMilestone(work_item_groups $group, ?string $edge, int $delta): int
    {
        $milestone = $group->milestone;
        if (! $milestone || $delta === 0) {
            return $delta;
        }

        $items = work_item::query()->where('group_id', $group->id);
        if (! $items->exists()) {
            return $delta;
        }

        $msStart = $milestone->start_date?->copy()->startOfDay();
        $msEnd = $milestone->target_date?->copy()->startOfDay();

        if ($edge !== 'end' && $msStart) {
            // earliest item start must remain >= milestone start
            $min = Carbon::parse($items->min(DB::raw('COALESCE(start_date, due_date)')))->startOfDay();
            $lower = (int) round((float) $min->diffInDays($msStart, false)); // msStart - min
            $delta = max($delta, $lower);
        }

        if ($edge !== 'start' && $msEnd) {
            // latest item due must remain <= milestone target
            $max = Carbon::parse($items->max('due_date'))->startOfDay();
            $upper = (int) round((float) $max->diffInDays($msEnd, false)); // msEnd - max
            $delta = min($delta, $upper);
        }

        return $delta;
    }

    public function moveMilestone(Request $request, projects $project, milestones $milestone)
    {
        $this->authorize('update', $project);

        if($milestone->project_id !== $project->id){
            abort(403, 'Milestone does not belong in this Project');
        }
        $validated = $request->validate([
            'target_date' => 'required|date',
        ]);

        $milestone->update($validated);

        return redirect()->back()->with('success', 'Milestone moved successfully');
    }

}
