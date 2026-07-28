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
    protected $listen = [
        WorkItemAssignedEvent::class => [
            SendWorkItemAssignedNotification::class,
        ],
        WorkItemStatusChangedEvent::class => [
            SendStatusChangeNotification::class,
        ],
        CommentAddedEvent::class => [
            SendCommentAddedNotification::class,
        ],
    ];

    public function boot(): void
    {
        //
    }
}