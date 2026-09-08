<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class AdminDigest extends Notification implements ShouldQueue
{
    use Queueable;

    protected $upcomingCount;
    protected $overdueCount;
    protected $dueTodayCount;
    protected $newlyCompletedCount;
    protected $upcomingItems;
    protected $overdueItems;

    public function __construct(
        int $upcomingCount,
        int $overdueCount,
        int $dueTodayCount,
        int $newlyCompletedCount,
        array $upcomingItems = [],
        array $overdueItems = []
    ) {
        $this->upcomingCount = $upcomingCount;
        $this->overdueCount = $overdueCount;
        $this->dueTodayCount = $dueTodayCount;
        $this->newlyCompletedCount = $newlyCompletedCount;
        $this->upcomingItems = $upcomingItems;
        $this->overdueItems = $overdueItems;
    }

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'message' => $this->getMessage(),
            'url' => '/admin/digest',
            'type' => 'admin_digest',
            'digest_data' => [
                'upcoming_count' => $this->upcomingCount,
                'overdue_count' => $this->overdueCount,
                'due_today_count' => $this->dueTodayCount,
                'newly_completed_count' => $this->newlyCompletedCount,
                'upcoming_items' => $this->upcomingItems,
                'overdue_items' => $this->overdueItems,
            ],
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    protected function getMessage(): string
    {
        $today = now()->format('M d, Y');
        return "📊 Daily Digest ({$today}): {$this->dueTodayCount} due today, {$this->overdueCount} overdue, {$this->upcomingCount} due this week, {$this->newlyCompletedCount} completed";
    }
}
