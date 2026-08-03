<?php

namespace App\Providers;

use App\Events\CommentAddedEvent;
use App\Events\WorkItemAssignedEvent;
use App\Events\WorkItemStatusChangedEvent;
use App\Listeners\SendCommentAddedNotification;
use App\Listeners\SendStatusChangeNotification;
use App\Listeners\SendWorkItemAssignedNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * Maps application events to their corresponding listeners.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        /**
         * Dispatched when a work item is assigned to a user.
         * Listener sends a notification to the assignee.
         */
        WorkItemAssignedEvent::class => [
            SendWorkItemAssignedNotification::class,
        ],
        /**
         * Dispatched when a work item status changes.
         * Listener sends a notification to the assignee.
         */
        WorkItemStatusChangedEvent::class => [
            SendStatusChangeNotification::class,
        ],
        /**
         * Dispatched when a comment is added to a work item.
         * Listener notifies the assignee and/or original comment author.
         */
        CommentAddedEvent::class => [
            SendCommentAddedNotification::class,
        ],
    ];

    public function boot(): void
    {
        //
    }
}
