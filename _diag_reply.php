<?php

use App\Events\CommentAddedEvent;
use App\Models\User;
use App\Models\work_item;
use App\Notifications\CommentAdded;
use Illuminate\Support\Facades\Notification;

Notification::fake();

$wi = work_item::whereNotNull('assignee_id')->first();
$assignee = User::find($wi->assignee_id);
$commenter = User::where('id', '!=', $wi->assignee_id)->first();

echo "work_item id={$wi->id}, assignee id={$assignee->id}, commenter id={$commenter->id}\n";

// SCENARIO A: top-level comment - NO original author. Only the assignee branch can fire.
echo "--- Scenario A (no originalAuthor) ---\n";
CommentAddedEvent::dispatch($wi, $commenter, 'preview A');
echo 'assignee sent = '.Notification::sent($assignee, CommentAdded::class)->count().PHP_EOL;

// SCENARIO B: original author == assignee (same person).
echo "--- Scenario B (originalAuthor == assignee) ---\n";
CommentAddedEvent::dispatch($wi, $commenter, 'preview B', $assignee);
echo 'assignee sent = '.Notification::sent($assignee, CommentAdded::class)->count().PHP_EOL;
