<?php

namespace App\Http\Controllers;

use App\Events\WorkItemAssignedEvent;
use App\Events\WorkItemStatusChangedEvent;
use App\Models\project_members;
use App\Models\projects;
use App\Models\User;
use App\Models\work_item;
use App\Models\work_item_groups;
use App\Models\work_item_statuses;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Handles work item CRUD operations, progress updates, and status changes
 * within the project management system.
 */
class WorkItemController extends Controller
{
    /**
     * Display the specified work item with its details and comments.
     */
    public function show(projects $project, work_item $workItem)
    {
        // Remember where the user came from for the Back button
        // Guard: don't overwrite if coming from the edit page (after update redirect)
        $previousUrl = url()->previous();
        if (! str_contains($previousUrl, '/edit')) {
            session(['work_item_back_to' => $previousUrl]);
        }

        // Load related status, group, assignee, project, attachments data, and Collaborators
        $workItem->load(['status', 'group', 'assignee', 'project', 'attachments.uploader', 'collaborators']);

        // Load project members for the edit sheet filter options
        $project->load('members.user');

        // Fetch and transform comments for display (note: similar logic to CommentsController for future refactoring)
        $comments = $workItem->comments()
            ->whereNull('parent_id')
            ->with(['user', 'replies.user', 'replies.attachments.uploader', 'attachments.uploader'])
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
                    'attachments' => $comment->attachments->map(fn ($attachment) => [
                        'id' => $attachment->id,
                        'original_name' => $attachment->original_name,
                        'size' => $attachment->size,
                        'mime_type' => $attachment->mime_type,
                        'url' => Storage::disk('public')->url($attachment->path),
                        'download_url' => route('attachments.download', $attachment),
                        'uploaded_by' => $attachment->uploader ? ['id' => $attachment->uploader->id, 'name' => $attachment->uploader->name] : null,
                        'created_at' => $attachment->created_at?->diffForHumans(),
                    ]),
                    'replies' => $comment->replies->map(function ($reply) {
                        return [
                            'id' => $reply->id,
                            'content' => $reply->content,
                            'created_at' => $reply->created_at->diffForHumans(),
                            'user' => [
                                'id' => $reply->user->id,
                                'name' => $reply->user->name,
                            ],
                            'attachments' => $reply->attachments->map(fn ($attachment) => [
                                'id' => $attachment->id,
                                'original_name' => $attachment->original_name,
                                'size' => $attachment->size,
                                'mime_type' => $attachment->mime_type,
                                'url' => Storage::disk('public')->url($attachment->path),
                                'download_url' => route('attachments.download', $attachment),
                                'uploaded_by' => $attachment->uploader ? ['id' => $attachment->uploader->id, 'name' => $attachment->uploader->name] : null,
                                'created_at' => $attachment->created_at?->diffForHumans(),
                            ]),
                        ];
                    }),
                ];
            });

        $attachments = $workItem->attachments->map(fn ($attachment) => [
            'id' => $attachment->id,
            'original_name' => $attachment->original_name,
            'size' => $attachment->size,
            'mime_type' => $attachment->mime_type,
            'url' => Storage::disk('public')->url($attachment->path),
            'download_url' => route('attachments.download', $attachment),
            'uploaded_by' => $attachment->uploader ? ['id' => $attachment->uploader->id, 'name' => $attachment->uploader->name] : null,
            'created_at' => $attachment->created_at?->diffForHumans(),
        ]);

        // Fetch filter options for the edit sheet
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

        return Inertia::render('work-items/show', [
            'backUrl' => session('work_item_back_to', route('projects.work-items.index', $project->id)),
            'workItems' => [
                'id' => $workItem->id,
                'title' => $workItem->title,
                'description' => $workItem->description,
                'priority' => $workItem->priority,
                'due_date' => $workItem->due_date->format('Y-m-d'),
                'progress' => $workItem->progress ?? 0,
                'status_id' => $workItem->status_id,
                'group_id' => $workItem->group_id,
                'assignee_id' => $workItem->assignee_id,
                'start_date' => $workItem->start_date?->format('Y-m-d'),
                'collaborators' => $workItem->collaborators()->pluck('user_id'),
                'status' => $workItem->status ? ['id' => $workItem->status->id, 'name' => $workItem->status->name] : null,
                'group' => $workItem->group ? ['id' => $workItem->group->id, 'name' => $workItem->group->name] : null,
                'assignee' => $workItem->assignee ? ['id' => $workItem->assignee->id, 'name' => $workItem->assignee->name] : null,
                'project' => $workItem->project ? ['id' => $workItem->project->id, 'name' => $workItem->project->name, 'item_prefix' => $workItem->project->item_prefix] : null,
            ],
            'attachments' => $attachments,
            'comments' => $comments,
            'filters' => [
                'statuses' => $statuses,
                'groups' => $groups,
                'members' => $members,
            ],
        ]);
    }

    /**
     * Display a global work items list (across all projects).
     */
    public function globalIndex(Request $request)
    {
        $query = work_item::with(['status', 'group', 'assignee', 'project']);

        // Search by title or description
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply filters
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

        $projects = projects::select('id', 'name')->orderBy('name')->get();
        $statuses = work_item_statuses::select('name')->distinct()->orderBy('name')->get();

        return Inertia::render('work-items/global-index', [
            'workItems' => $workItems,
            'filters' => [
                'projects' => $projects,
                'statuses' => $statuses,
            ],
        ]);
    }

    /**
     * Display a listing of work items for a specific project.
     */
    public function index(projects $project)
    {
        // Load project members and their associated users
        $project->load('members.user');

        // Fetch project work items ordered by newest first
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
                    'status_id' => $item->status_id,
                    'group_id' => $item->group_id,
                    'assignee_id' => $item->assignee_id,
                    'start_date' => $item->start_date?->format('Y-m-d'),
                    'collaborators' => $item->collaborators()->pluck('user_id'),
                    'status' => $item->status ? ['id' => $item->status->id, 'name' => $item->status->name] : null,
                    'group' => $item->group ? ['id' => $item->group->id, 'name' => $item->group->name] : null,
                    'assignee' => $item->assignee ? ['id' => $item->assignee->id, 'name' => $item->assignee->name] : null,
                ];
            });

        // Fetch filter options for the project
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
            'project' => ['id' => $project->id, 'name' => $project->name, 'item_prefix' => $project->item_prefix],
            'filters' => [
                'statuses' => $statuses,
                'groups' => $groups,
                'members' => $members,
            ],
        ]);
    }

    /**
     * Show the form for creating a new work item.
     */
    public function create(projects $project)
    {
        // Fetch filter options for the create form
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

    /**
     * Store a newly created work item in storage.
     */
    public function store(Request $request, projects $project)
    {
        $project->loadMissing('members');
        $this->authorize('work-item.create', $project);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status_id' => 'required|exists:work_item_statuses,id',
            'group_id' => 'required|exists:work_item_groups,id',
            'assignee_id' => 'required|exists:users,id',
            'collaborators' => 'nullable|array',
            'collaborators.*' => 'integer',
            'priority' => 'required|in:low,medium,high,critical',
            'progress' => 'nullable|integer|min:0|max:100',
            'start_date' => 'nullable|date',
            'due_date' => 'required|date',
        ]);

        $validated = $this->applyScheduleConstraint($request, $project, $validated);

        $validated['project_id'] = $project->id;

        $workItem = work_item::create($validated);

        $workItem->collaborators()->attach($this->validCollaboratorIds($request, $project, $validated['assignee_id'] ?? null));
        // Dispatch assignment event if the work item has an assignee
        if ($workItem->assignee) {
            WorkItemAssignedEvent::dispatch($workItem, $workItem->assignee, auth()->user()->name);
        }

        return redirect()
            ->route('projects.work-items.index', $project->id)
            ->with('success', 'Work item created successfully.');
    }

    /**
     * Show the form for editing the specified work item.
     */
    public function edit(projects $project, work_item $workItem)
    {
        // Remember the page the user came from so we can redirect back after update
        session(['work_item_return_to' => url()->previous()]);

        // Fetch filter options for the edit form
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
                'start_date' => $workItem->start_date?->format('Y-m-d'),
                'due_date' => $workItem->due_date->format('Y-m-d'),
                'collaborators' => $workItem->collaborators()->pluck('user_id'),
            ],
            'statuses' => $statuses,
            'groups' => $groups,
            'members' => $members,
        ]);
    }

    /**
     * Update the specified work item in storage.
     *
     * Dispatches assignment and status change events when applicable.
     */
    public function update(Request $request, projects $project, work_item $workItem)
    {
        $workItem->loadMissing('project.members');
        $this->authorize('work-item.update', $workItem);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status_id' => 'required|exists:work_item_statuses,id',
            'group_id' => 'required|exists:work_item_groups,id',
            'assignee_id' => 'required|exists:users,id',
            'priority' => 'required|in:low,medium,high,critical',
            'progress' => 'nullable|integer|min:0|max:100',
            'start_date' => 'nullable|date',
            'due_date' => 'required|date',
        ]);
        $validated = $this->applyScheduleConstraint($request, $project, $validated);
        // Store old values to detect changes for event dispatching
        $oldAssigneeId = $workItem->assignee_id;
        $oldStatusName = $workItem->status->name ?? 'Unknown';

        $workItem->update($validated);
        $workItem->refresh();

        $workItem->collaborators()->sync($this->validCollaboratorIds($request, $project, $workItem->assignee_id));

        // Dispatch assignment event if the assignee changed
        if ($workItem->assignee_id && $workItem->assignee_id != $oldAssigneeId) {
            WorkItemAssignedEvent::dispatch($workItem, $workItem->assignee, auth()->user()->name);
        }

        // Dispatch status change event if the status changed
        if ($workItem->status?->name !== $oldStatusName) {
            WorkItemStatusChangedEvent::dispatch($workItem, $oldStatusName, $workItem->status->name, auth()->user()->name);
        }

        // Redirect back to the page the user came from (stored when the edit form was loaded)
       
            return redirect()->back()->with('success', 'Work item updated successfully.');
        

        
    }

    /**
     * Remove the specified work item from storage.
     */
    public function destroy(projects $project, work_item $workItem)
    {
        $workItem->loadMissing('project.members');
        $this->authorize('work-item.delete', $workItem);

        $workItem->delete();

        return redirect()
            ->back(fallback: route('projects.work-items.index', $project->id))
            ->with('success', 'Work item deleted successfully.');
    }

    /**
     * Bulk update progress for multiple work items and automatically update their status.
     *
     * Updates status based on progress:
     * - 0%: Sets to "To Do"
     * - 0-100%: Sets to "In Progress"
     * - 100%: Sets to "Done"
     */
    public function bulkUpdateProgress(Request $request, projects $project)
    {
        $validated = $request->validate([
            'work_item_ids' => 'required|array',
            'work_item_ids.*' => 'exists:work_items,id',
            'progress' => 'required|integer|min:0|max:100',
        ]);

        // Fetch the statuses to use for automatic status transitions
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
            // Ensure the work item belongs to the current project
            $workItem = work_item::where('id', $itemId)
                ->where('project_id', $project->id)
                ->firstOrFail();

            $workItem->update(['progress' => $validated['progress']]);

            // Automatically update status based on progress value
            $progress = $validated['progress'];
            if ($progress == 0 && $statusToDo) {
                $workItem->update(['status_id' => $statusToDo->id]);
            } elseif ($progress == 100 && $statusDone) {
                $workItem->update(['status_id' => $statusDone->id]);
            } elseif ($progress > 0 && $progress < 100 && $statusInProgress) {
                $workItem->update(['status_id' => $statusInProgress->id]);
            }
        }

        return redirect()
            ->back(fallback: route('projects.work-items.index', $project->id))
            ->with('success', 'Progress updated successfully.');
    }

    /**
     * Update the status of a specific work item.
     */
    public function updateStatus(Request $request, work_item $workItem)
    {
        $validated = $request->validate([
            'status_id' => 'required|exists:work_item_statuses,id',
        ]);

        $workItem->update(['status_id' => $validated['status_id']]);

        return redirect()
            ->back(fallback: route('work-items.global'))
            ->with('success', 'Work item status updated.');
    }

    /**
     * Validate that a work item's dates fall within the project's schedule window.
     *
     * When the parent project defines a start/end date, work items must not be
     * scheduled outside that range. The check is skipped when the project has no
     * date constraints set.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function applyScheduleConstraint(Request $request, projects $project, array $validated): array
    {
        if (! $project->start_date && ! $project->end_date) {
            return $validated;
        }

        $start = $validated['start_date'] ?? null;
        $due = $validated['due_date'] ?? null;

        $errors = [];

        if ($start) {
            $startDate = Carbon::parse($start);
            if ($project->start_date && $startDate->lt($project->start_date->startOfDay())) {
                $errors['start_date'] = "Start date cannot be before the project start date ({$project->start_date->format('Y-m-d')}).";
            }
            if ($project->end_date && $startDate->gt($project->end_date->endOfDay())) {
                $errors['start_date'] = "Start date cannot be after the project end date ({$project->end_date->format('Y-m-d')}).";
            }
        }

        if ($due) {
            $dueDate = Carbon::parse($due);
            if ($project->start_date && $dueDate->lt($project->start_date->startOfDay())) {
                $errors['due_date'] = "Due date cannot be before the project start date ({$project->start_date->format('Y-m-d')}).";
            }
            if ($project->end_date && $dueDate->gt($project->end_date->endOfDay())) {
                $errors['due_date'] = "Due date cannot be after the project end date ({$project->end_date->format('Y-m-d')}).";
            }
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return $validated;
    }

    private function validCollaboratorIds(Request $request, projects $project, $assigneeId): array
    {
        $ids = $request->input('collaborators', []);
        $ids = array_filter(array_map('intval', (array) $ids));

        $memberIds = project_members::where('project_id', $project->id)
        ->pluck('user_id')->all();

        $ids = array_values(array_intersect($ids, $memberIds));

        return array_values(array_filter($ids, fn($id) => $id !== (int) $assigneeId));
    }

    }
