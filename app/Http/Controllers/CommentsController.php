<?php

namespace App\Http\Controllers;

use App\Models\comments;
use App\Models\work_item;
use Illuminate\Http\Request;
use Inertia\Inertia;
class CommentsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(work_item $workItem)
    {
        $comments = $workItem->comments()
        ->whereNull('parent_id')
        ->with(['user','replies.user'])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($comment){
            return 
            [
                'id'=> $comment->id,
                'content'=> $comment->content,
                'created_at'=> $comment->created_at->diffForHumans(),
                'user'=>
                [
                    'id'=> $comment->user->id,
                    'name'=> $comment->user->name,
                ],
                'replies'=> $comment->replies->map(function ($reply)
                {
                    return 
                    [
                        'id'=>$reply->id,
                        'content'=> $reply->content,
                        'created_at'=> $reply->created_at->diffForHumans(),
                        'user'=>
                        [
                            'id' => $reply->user->id,
                            'name'=> $reply->user->name,
                        ],
                    ];
                }),
            ];
        });
        return Inertia::render('work-items/show', [
            'workItems'=>$workItem->load('status','group','assignee','project'),
            'comments'=> $comments,
        ]);
    }
   

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        
    }
    public function reply(Request $request, comments $comment)
    {
        //
        $validated = $request->validate([
            'content'=> 'required|string|max:10000',
        ]);
        $comment->replies()->create([
            'commentable_type'=>$comment->commentable_type,
            'commentable_id'=> $comment->commentable_id,
            'user_id'=> auth()->id(),
            'content'=>$validated['content'],
        ]);
        return redirect()->back()->with('success','Reply added.');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, work_item $workItem)
    {
        //
        $validated = $request->validate([
            'content'=>'required|string|max:10000',
        ]);

        $workItem->comments()->create([
            'user_id'=>auth()->id(),
            'content'=> $validated['content'],
        ]);
        return redirect()->back()->with('success','Comment added.');
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
     */
    public function update(Request $request, comments $comment)
    {
        //
        if($comment->user_id != auth()->id()){
        abort(403);
        }
        $validated = $request->validate([
            'content'=>'required|string|max:10000'
        ]);
        $comment->update($validated);

        return redirect()->back()->with('success','Comment Updated');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(comments $comment)
    {
        //

        if($comment->user_id != auth()->id()){
            abort(403);
        }
        $comment->delete();

        return redirect()->back()->with('success','Comment Deleted.');
    }
}
