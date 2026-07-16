<?php

namespace App\Http\Controllers;

use App\Models\projects;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $projects = projects::withCount('members', 'workItems')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'item_prefix' => $project->item_prefix,
                    'members_count' => $project->members_count,
                    'work_items_count' => $project->work_items_count,
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
            'name'=> 'required|string|max:255',
            'description'=> 'nullable|string',
            'item_prefix'=> 'required|string|max:255',
        ]);
            projects::create($validated);

            return redirect()->route('projects.index')->with('success','Project Created Successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(projects $project)
    {
        $project->load(['members.user', 'workItems']);

        return Inertia::render('projects/show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'item_prefix' => $project->item_prefix,
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
                        'due_date' => $item->due_date,
                    ];
                }),
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
            'project' =>[
                'id'=> $project->id,
                'name'=> $project->name,
                'description'=> $project->description,
                'item_prefix'=> $project->item_prefix,
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, projects $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'item_prefix' => 'required|string|max:255',
        ]);

        $project->update($validated);

        return redirect()->route('projects.index')->with('success', 'Project Updated Successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(projects $project)
    {
        //
        $project->delete();

        return redirect()->route('projects.index')->with('success','Project Deleted Successfully');
    }
}
