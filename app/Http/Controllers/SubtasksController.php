<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\subtasks;
use App\Models\work_item;
use Inertia\Inertia;

class SubtasksController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(work_item $workItem)
    {
        //

        $subtasks = $workItem->subtasks()
        ->with('assignee')
        ->orderby('order')
        ->get()
        ->map(fn ($subtask) => [
            'id' => $subtask->id,
            'title' => $subtask->title,
            'description' => $subtask->description,
            'progress' => $subtask->progress,
            'priority' => $subtask->priority,
            'due_date' => $subtask->due_date?->format('Y-m-d'),
            'order' => $subtask->order,
            'assignee' => $subtask->assignee ? [
                'id' => $subtask->assignee->id,
                'name'  => $subtask->assignee->name
            ] : null,
       ]);

       return Inertia::render('work-items/show', [
            'workItem' => [
                'id' => $workItem->id,
                'title' => $workItem->title,
                'subtasks' => $subtasks,
            ],
       ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, work_item $workItem)
    {
        //
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'priority' => 'required|in:low,medium,high,critical',
            'due_date' => 'nullable|date',
            'order' =>  'nullable|integer|min:0',
        ]);

        $validated['work_item_id'] = $workItem->id;
        $validated['order'] = $validated['order'] ?? ($workItem->subtasks()->max('order')+1);

        $subtask = subtasks::create($validated);

        return redirect()->back()->with('success','Subtask created.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, work_item $workItem, subtasks $subtask)
    {
        //
        $this->authorize('update', $subtask);

         $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'priority' => 'required|in:low,medium,high,critical',
            'due_date' => 'nullable|date',
            'order' =>  'nullable|integer|min:0',
        ]);

         $subtask->update($validated);

            return back()->with('success','Subtask Updated.');
    }

    public function updateProgress(Request $request, work_item $workItem, subtasks $subtask)
    {
        $validated = $request->validate([
            'progress' => 'required|integer|min:0|max:100',
        ]);
         $subtask->update(['progress' => $validated['progress']]);

         return redirect()->back()->with('success', 'Progress Updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(work_item $workItem, subtasks $subtask)
    {
        //
        $this->authorize('delete', $subtask);

        $subtask->delete();

        return back()->with('success','Subtask deleted.');
    }

    public function reorder(Request $request, work_item $workItem)
    {
        $validated = $request->validate([
            'subtask_ids' => 'required|array',
            'subtask_ids.*' => 'exists:subtasks,id',
        ]);

        foreach($validated['subtask_ids'] as $index => $subtaskId){
            subtasks::where('id', $subtaskId)->where('work_item_id', $workItem->id)->update(['order' => $index]);
        }
        return back()->with('success','Subtask Reordered.');
    }
}
