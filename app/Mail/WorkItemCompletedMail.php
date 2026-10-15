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
 * Manager/owner oversight mail: a work item in your project was completed.
 *
 * Sent alongside the in-app WorkItemCompleted notification from
 * SendWorkItemCompletedNotification to the project creator and the
 * assignee (when they didn't complete it themselves). Queued through
 * Gmail SMTP. No per-user settings gate — completions are always
 * noteworthy to the owner.
 */
class WorkItemCompletedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public work_item $workItem,
        public string $actorName,
        public string $recipientName,
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
            subject: "Completed: {$this->workItem->title}",
        );
    }

    public function content(): Content
    {
        $workItem = $this->workItem;
        $workItem->loadMissing(['project', 'assignee']);

        $headline = $this->actorName === 'system'
            ? "'{$workItem->title}' has been marked as completed"
            : "{$this->actorName} completed '{$workItem->title}'";

        return new Content(
            view: 'mails.work-item-completed',
            with: [
                'recipientName' => $this->recipientName,
                'headline' => $headline,
                'actorName' => $this->actorName,
                'title' => $workItem->title,
                'projectName' => $workItem->project?->name ?? 'Unknown',
                'assigneeName' => $workItem->assignee?->name ?? 'Unassigned',
                'completedAt' => $workItem->completed_at?->format('M d, Y g:i A') ?? now()->format('M d, Y g:i A'),
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
}
