<?php

namespace App\Http\Controllers;

use App\Events\CommentAddedEvent;
use App\Models\comments;
use App\Models\User;
use App\Models\work_item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Handles comment-related operations including creating, updating,
 * deleting, and replying to comments on work items.
 */
class CommentsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Retrieves top-level comments (no parent_id) for a work item,
     * eager loads user and reply relationships, and transforms
     * the data for the frontend.
     */
    public function index(work_item $workItem)
    {
        // Fetch top-level comments ordered by newest first
        $comments = $workItem->comments()
            ->whereNull('parent_id')
            ->with(['user', 'replies.user', 'replies.attachments.uploader', 'attachments.uploader'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($comment) {
                return
                [
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
                    // Transform each reply for frontend consumption
                    'replies' => $comment->replies->map(function ($reply) {
                        return
                        [
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

        return Inertia::render('work-items/show', [
            'workItems' => $workItem->load('status', 'group', 'assignee', 'project'),
            'comments' => $comments,
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
     * Add a reply to an existing comment.
     *
     * Validates the reply content, creates the reply, and dispatches
     * notifications to the assignee and original comment author.
     */
    public function reply(Request $request, comments $comment)
    {
        //
        $validated = $request->validate([
            'content' => 'required|string|max:10000',
        ]);

        // Create reply with the same commentable type and id as parent
        $reply = $comment->replies()->create([
            'commentable_type' => $comment->commentable_type,
            'commentable_id' => $comment->commentable_id,
            'user_id' => auth()->id(),
            'content' => $validated['content'],
        ]);

        // Notify the assignee and/or original comment author.
        // Dispatch once so the listener's $notified guard can deduplicate
        // when the assignee and original comment author are the same user.
        $workItem = work_item::find($comment->commentable_id);

        if ($workItem) {
            $originalAuthor = ($comment->user_id !== auth()->id())
                ? User::find($comment->user_id)
                : null;

            CommentAddedEvent::dispatch(
                $workItem,
                auth()->user(),
                substr($reply->content, 0, 100),
                $originalAuthor
            );
        }

        return redirect()->back()->with('success', 'Reply added.');
    }

    /**
     * Store a newly created resource in storage.
     *
     * Validates the comment content and dispatches a notification
     * to the work item assignee if they are not the commenter.
     */
    public function store(Request $request, work_item $workItem)
    {
        // Any project member may comment; outsiders are rejected.
        $this->authorize('comment.create', $workItem);

        $validated = $request->validate([
            'content' => 'required|string|max:10000',
        ]);

        $comment = $workItem->comments()->create([
            'user_id' => auth()->id(),
            'content' => $validated['content'],
        ]);

        // Only notify assignee if they exist and didn't write the comment themselves
        if ($workItem->assignee_id && $workItem->assignee_id !== auth()->id()) {
            CommentAddedEvent::dispatch(
                $workItem,
                auth()->user(),
                substr($comment->content, 0, 100)
            );
        }

        return redirect()->back()->with('success', 'Comment added.');
    }

    /**
     * Display the specified resource.
     */
    public function show(comments $comments)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(comments $comments)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * Verifies the authenticated user owns the comment before updating.
     */
    public function update(Request $request, comments $comment)
    {
        //
        // Ensure only the comment author can update
        if ($comment->user_id != auth()->id()) {
            abort(403);
        }
        $validated = $request->validate([
            'content' => 'required|string|max:10000',
        ]);
        $comment->update($validated);

        return redirect()->back()->with('success', 'Comment Updated');
    }

    /**
     * Remove the specified resource from storage.
     *
     * Verifies the authenticated user owns the comment before deleting.
     */
    public function destroy(comments $comment)
    {
        //

        // Ensure only the comment author can delete
        if ($comment->user_id != auth()->id()) {
            abort(403);
        }
        $comment->delete();

        return redirect()->back()->with('success', 'Comment Deleted.');
    }
}
