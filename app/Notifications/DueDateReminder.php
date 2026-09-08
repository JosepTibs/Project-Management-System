<?php

namespace App\Notifications;

use App\Models\work_item;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class DueDateReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected $workItem;
    protected $daysUntilDue;
    protected $reminderType;
    protected $recipientRole;

    public function __construct(work_item $workItem, int $daysUntilDue, string $reminderType = 'upcoming', string $recipientRole = 'member')
    {
        $this->workItem = $workItem;
        $this->daysUntilDue = $daysUntilDue;
        $this->reminderType = $reminderType;
        $this->recipientRole = $recipientRole;
    }

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'message' => $this->getMessage(),
            'work_item_id' => $this->workItem->id,
            'project_id' => $this->workItem->project_id,
            'project_name' => $this->workItem->project?->name ?? 'Unknown',
            'url' => "/projects/{$this->workItem->project_id}/work-items/{$this->workItem->id}",
            'type' => 'due_date_reminder',
            'reminder_type' => $this->reminderType,
            'recipient_role' => $this->recipientRole,
            'days_until_due' => $this->daysUntilDue,
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    protected function getMessage(): string
    {
        $title = $this->workItem->title;
        $dueDate = $this->workItem->due_date?->format('M d, Y');
        $assigneeName = $this->workItem->assignee?->name ?? 'Unassigned';

        if ($this->recipientRole === 'member') {
            return match ($this->reminderType) {
                'two_weeks' => "📅 Your task '{$title}' is due in 2 weeks ({$dueDate})",
                'one_week' => "⚠️ Your task '{$title}' is due in 1 week ({$dueDate})",
                'daily' => "🔔 Your task '{$title}' is due in {$this->daysUntilDue} day(s)",
                'due_today' => "🔴 Your task '{$title}' is due TODAY!",
                'overdue' => "🚨 Your task '{$title}' is OVERDUE by " . abs($this->daysUntilDue) . " day(s)!",
                default => "Task '{$title}' reminder",
            };
        }

        // Manager/Admin messages include assignee context
        return match ($this->reminderType) {
            'two_weeks' => "📅 '{$title}' (assigned to {$assigneeName}) is due in 2 weeks ({$dueDate})",
            'one_week' => "⚠️ '{$title}' (assigned to {$assigneeName}) is due in 1 week ({$dueDate})",
            'daily' => "🔔 '{$title}' (assigned to {$assigneeName}) is due in {$this->daysUntilDue} day(s)",
            'due_today' => "🔴 '{$title}' (assigned to {$assigneeName}) is due TODAY!",
            'overdue' => "🚨 '{$title}' (assigned to {$assigneeName}) is OVERDUE by " . abs($this->daysUntilDue) . " day(s)!",
            default => "Task '{$title}' reminder",
        };
    }
}
