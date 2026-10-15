<?php

namespace App\Mail;

use App\Models\User;
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
 * Member transactional mail: someone commented on your work item
 * (or replied to your comment).
 *
 * Sent alongside the in-app CommentAdded notification, gated by the
 * recipient's `notification_settings.comment_added` flag in
 * SendCommentAddedNotification. Queued through Gmail SMTP.
 */
class CommentAddedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public work_item $workItem,
        public User $commenter,
        public string $commentPreview,
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
            subject: "New comment on: {$this->workItem->title}",
        );
    }

    public function content(): Content
    {
        $workItem = $this->workItem;
        $workItem->loadMissing(['project']);

        return new Content(
            view: 'mails.comment-added',
            with: [
                'recipientName' => $this->recipientName,
                'commenterName' => $this->commenter->name,
                'title' => $workItem->title,
                'projectName' => $workItem->project?->name ?? 'Unknown',
                'commentPreview' => $this->commentPreview,
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
