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
 * Member (assignee) transactional mail: status of your work item changed.
 *
 * Sent alongside the in-app StatusChanged notification, gated by the
 * recipient's `notification_settings.status_changed` flag in
 * SendStatusChangeNotification. Queued through Gmail SMTP.
 */
class StatusChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public work_item $workItem,
        public string $oldStatus,
        public string $newStatus,
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
            subject: "Status update: {$this->workItem->title} → {$this->newStatus}",
        );
    }

    public function content(): Content
    {
        $workItem = $this->workItem;
        $workItem->loadMissing(['project', 'assignee']);

        return new Content(
            view: 'mails.status-changed',
            with: [
                'recipientName' => $this->recipientName,
                'actorName' => $this->actorName,
                'title' => $workItem->title,
                'projectName' => $workItem->project?->name ?? 'Unknown',
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
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
