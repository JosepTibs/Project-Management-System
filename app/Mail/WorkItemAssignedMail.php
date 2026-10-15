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
 * Member (assignee) transactional mail: someone assigned you a work item.
 *
 * Sent alongside the in-app WorkItemAssigned notification, gated by the
 * recipient's `notification_settings.work_item_assigned` flag in
 * SendWorkItemAssignedNotification. Queued via the database queue
 * (QUEUE_CONNECTION=database) through Gmail SMTP.
 */
class WorkItemAssignedMail extends Mailable implements ShouldQueue
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
            subject: "Assigned: {$this->workItem->title}",
        );
    }

    public function content(): Content
    {
        $workItem = $this->workItem;
        $workItem->loadMissing(['project', 'assignee', 'status']);

        return new Content(
            view: 'mails.work-item-assigned',
            with: [
                'recipientName' => $this->recipientName,
                'actorName' => $this->actorName,
                'title' => $workItem->title,
                'description' => $workItem->description,
                'projectName' => $workItem->project?->name ?? 'Unknown',
                'statusName' => $workItem->status?->name ?? '—',
                'priority' => $workItem->priority ?? '—',
                'dueDate' => $workItem->due_date?->format('M d, Y') ?? 'No due date',
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
