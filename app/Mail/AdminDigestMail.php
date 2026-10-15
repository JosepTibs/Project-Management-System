<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Admin/Superadmin daily digest mail (one mail per day per admin).
 *
 * Aggregates what SendDueDateReminders::sendAdminDigest() counts instead
 * of spamming admins with per-item reminders: due today, overdue, due
 * this week, completed in the last day. Runs daily 09:00 Asia/Manila
 * (routes/console.php). Queued through Gmail SMTP.
 */
class AdminDigestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $upcomingCount,
        public int $overdueCount,
        public int $dueTodayCount,
        public int $newlyCompletedCount,
        public array $upcomingItems = [],
        public array $overdueItems = [],
        public string $recipientName = '',
    ) {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        $today = now()->format('M d, Y');

        return new Envelope(
            from: new Address(
                config('monitoring.from.address'),
                config('monitoring.from.name'),
            ),
            subject: "Daily Digest ({$today}): {$this->dueTodayCount} due today, {$this->overdueCount} overdue",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mails.admin-digest',
            with: [
                'recipientName' => $this->recipientName,
                'today' => now()->format('l, M d, Y'),
                'upcomingCount' => $this->upcomingCount,
                'overdueCount' => $this->overdueCount,
                'dueTodayCount' => $this->dueTodayCount,
                'newlyCompletedCount' => $this->newlyCompletedCount,
                'upcomingItems' => $this->upcomingItems,
                'overdueItems' => $this->overdueItems,
                'digestUrl' => url('/admin/digest'),
                'hasAttentionItems' => ($this->overdueCount + $this->dueTodayCount) > 0,
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
