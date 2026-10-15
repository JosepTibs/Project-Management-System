<?php

namespace App\Mail;

use App\Models\work_item;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Member + manager due-date reminder mail.
 *
 * Member variant: personal ("Your task ..."), gated by the assignee's
 * `notification_settings.reminder_days_before` inside
 * SendDueDateReminders::sendMemberReminders().
 *
 * Manager variant: oversight ("'...' (assigned to X) ..."), sent for every
 * incomplete item in projects the manager owns
 * (SendDueDateReminders::sendManagerReminders) on a fixed
 * 14/7/1-6/due-today/overdue schedule. Queued through Gmail SMTP.
 */
class DueDateReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public work_item $workItem,
        public int $daysUntilDue,
        public string $reminderType = 'upcoming',
        public string $recipientRole = 'member',
        public string $recipientName = '',
    ) {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('monitoring.from.address'),
                config('monitoring.from.name'),
            ),
            subject: $this->subjectLine(),
        );
    }

    public function content(): Content
    {
        $workItem = $this->workItem;
        $workItem->loadMissing(['project', 'assignee']);

        return new Content(
            view: 'mails.due-date-reminder',
            with: [
                'recipientName' => $this->recipientName,
                'headline' => $this->headline(),
                'title' => $workItem->title,
                'projectName' => $workItem->project?->name ?? 'Unknown',
                'assigneeName' => $workItem->assignee?->name ?? 'Unassigned',
                'dueDate' => $workItem->due_date?->format('M d, Y') ?? 'No due date',
                'daysUntilDue' => $this->daysUntilDue,
                'reminderLabel' => $this->reminderLabel(),
                'isOverdue' => $this->daysUntilDue < 0,
                'isDueToday' => $this->daysUntilDue === 0,
                'recipientRole' => $this->recipientRole,
                'itemUrl' => url("/projects/{$workItem->project_id}/work-items/{$workItem->id}"),
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }

    protected function subjectLine(): string
    {
        $title = $this->workItem->title;

        return match ($this->reminderType) {
            'overdue' => "OVERDUE: {$title}",
            'due_today' => "Due TODAY: {$title}",
            'one_week' => "Due in 1 week: {$title}",
            'two_weeks' => "Due in 2 weeks: {$title}",
            default => "Reminder: {$title} due in {$this->daysUntilDue} day(s)",
        };
    }

    protected function reminderLabel(): string
    {
        return match ($this->reminderType) {
            'two_weeks' => 'Due in 2 weeks',
            'one_week' => 'Due in 1 week',
            'daily' => "Due in {$this->daysUntilDue} day(s)",
            'due_today' => 'Due today',
            'overdue' => 'Overdue by '.abs($this->daysUntilDue).' day(s)',
            default => 'Upcoming deadline',
        };
    }

    protected function headline(): string
    {
        $title = $this->workItem->title;
        $dueDate = $this->workItem->due_date?->format('M d, Y') ?? 'no due date';
        $assigneeName = $this->workItem->assignee?->name ?? 'Unassigned';

        if ($this->recipientRole === 'member') {
            return match ($this->reminderType) {
                'two_weeks' => "Your task '{$title}' is due in 2 weeks ({$dueDate})",
                'one_week' => "Your task '{$title}' is due in 1 week ({$dueDate})",
                'daily' => "Your task '{$title}' is due in {$this->daysUntilDue} day(s) ({$dueDate})",
                'due_today' => "Your task '{$title}' is due TODAY!",
                'overdue' => "Your task '{$title}' is OVERDUE by ".abs($this->daysUntilDue).' day(s)!',
                default => "Task '{$title}' reminder",
            };
        }

        return match ($this->reminderType) {
            'two_weeks' => "'{$title}' (assigned to {$assigneeName}) is due in 2 weeks ({$dueDate})",
            'one_week' => "'{$title}' (assigned to {$assigneeName}) is due in 1 week ({$dueDate})",
            'daily' => "'{$title}' (assigned to {$assigneeName}) is due in {$this->daysUntilDue} day(s) ({$dueDate})",
            'due_today' => "'{$title}' (assigned to {$assigneeName}) is due TODAY!",
            'overdue' => "'{$title}' (assigned to {$assigneeName}) is OVERDUE by ".abs($this->daysUntilDue).' day(s)!',
            default => "Task '{$title}' reminder",
        };
    }
}
