<?php

namespace App\Listeners;

use App\Models\LoginActivity;
use Illuminate\Auth\Events\Failed;
use Illuminate\Http\Request;

class LogFailedLoginAttempt
{
    /**
     * Create the event listener.
     */
    public function __construct(
        protected Request $request,
    ) {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Failed $event): void
    {
        if ($event->credentials && isset($event->credentials['email'])) {
            LoginActivity::create([
                'user_id' => $event->user?->id,
                'ip_address' => $this->request->ip(),
                'user_agent' => $this->request->userAgent(),
                'event' => 'failed',
                'created_at' => now(),
            ]);
        }
    }
}