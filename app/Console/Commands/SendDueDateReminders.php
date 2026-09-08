<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\work_item;
use App\Notifications\DueDateReminder;
use App\Notifications\AdminDigest;
use Illuminate\Console\Command;

class SendDueDateReminders extends Command
{
    protected $signature = 'notifications:due-date-reminders';
    protected $description = 'Send due date reminder notifications based on role';

    public function handle(): int
    {
        $totalSent = 0;

        $totalSent += $this->sendMemberReminders();
        $totalSent += $this->sendManagerReminders();
        $this->sendAdminDigest();

        $this->info("Sent {$totalSent} due date reminder(s).");

        return Command::SUCCESS;
    }

    /**
     * Send reminders to members (assignees) based on their personal reminder_days_before setting.
     */
    protected function sendMemberReminders(): int
    {
        $count = 0;

        $workItems = work_item::with(['assignee.notificationSettings'])
            ->whereNotNull('due_date')
            ->whereNull('completed_at')
            ->whereNotNull('assignee_id')
            ->get();

        foreach ($workItems as $workItem) {
            $assignee = $workItem->assignee;
            if (!$assignee) continue;

            $daysUntilDue = (int) now()->diffInDays($workItem->due_date, false);
            $reminderType = $this->determineMemberReminderType($daysUntilDue, $assignee);

            if (!$reminderType) continue;

            if ($this->shouldSendToMember($workItem, $assignee, $reminderType)) {
                $assignee->notify(new DueDateReminder($workItem, $daysUntilDue, $reminderType, 'member'));
                $count++;
            }
        }

        return $count;
    }

    /**
     * Send reminders to managers for ALL items in their projects.
     * Uses fixed schedule: 2 weeks, 1 week, daily, overdue.
     */
    protected function sendManagerReminders(): int
    {
        $count = 0;

        // Get all managers
        $managers = User::whereHas('roles', function ($query) {
            $query->where('name', 'like', '%manager%');
        })->get();

        foreach ($managers as $manager) {
            // Get all incomplete work items in projects owned by this manager
            $workItems = work_item::with('assignee')
                ->whereNotNull('due_date')
                ->whereNull('completed_at')
                ->whereHas('project', function ($query) use ($manager) {
                    $query->where('created_by', $manager->id);
                })
                ->get();

            foreach ($workItems as $workItem) {
                // Skip if manager is the assignee (already got member reminder)
                if ($workItem->assignee_id === $manager->id) continue;

                $daysUntilDue = (int) now()->diffInDays($workItem->due_date, false);
                $reminderType = $this->determineManagerReminderType($daysUntilDue);

                if (!$reminderType) continue;

                if ($this->shouldSendToManager($workItem, $manager, $reminderType)) {
                    $manager->notify(new DueDateReminder($workItem, $daysUntilDue, $reminderType, 'manager'));
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Send daily digest to admins instead of individual notifications.
     */
    protected function sendAdminDigest(): int
    {
        $admins = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['superadmin', 'admin']);
        })->get();

        if ($admins->isEmpty()) return 0;

        $upcomingCount = work_item::whereNotNull('due_date')
            ->whereNull('completed_at')
            ->where('due_date', '>', now())
            ->where('due_date', '<=', now()->addWeek())
            ->count();

        $overdueCount = work_item::whereNotNull('due_date')
            ->whereNull('completed_at')
            ->where('due_date', '<', now())
            ->count();

        $dueTodayCount = work_item::whereNotNull('due_date')
            ->whereNull('completed_at')
            ->whereDate('due_date', today())
            ->count();

        $newlyCompletedCount = work_item::whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->subDay())
            ->count();

        foreach ($admins as $admin) {
            $admin->notify(new AdminDigest(
                $upcomingCount,
                $overdueCount,
                $dueTodayCount,
                $newlyCompletedCount,
                [],
                []
            ));
        }

        return $admins->count();
    }


    protected function determineMemberReminderType(int $daysUntilDue, User $assignee): ?string
    {
        $settings = $assignee->notificationSettings;
        $reminderDaysBefore = $settings?->reminder_days_before ?? 1;

        if ($daysUntilDue < 0) return 'overdue';
        if ($daysUntilDue === 0) return 'due_today';
        if ($daysUntilDue === 14) return 'two_weeks';
        if ($daysUntilDue === 7) return 'one_week';
        if ($daysUntilDue >= 1 && $daysUntilDue <= $reminderDaysBefore) return 'daily';

        return null;
    }

    protected function determineManagerReminderType(int $daysUntilDue): ?string
    {
        if ($daysUntilDue < 0) return 'overdue';
        if ($daysUntilDue === 0) return 'due_today';
        if ($daysUntilDue === 14) return 'two_weeks';
        if ($daysUntilDue === 7) return 'one_week';
        if ($daysUntilDue >= 1 && $daysUntilDue <= 6) return 'daily';

        return null;
    }

    protected function shouldSendToMember(work_item $workItem, User $assignee, string $reminderType): bool
    {
        if (in_array($reminderType, ['two_weeks', 'one_week'])) {
            return !$assignee->notifications()
                ->where('type', 'App\\Notifications\\DueDateReminder')
                ->whereJsonContains('data->work_item_id', $workItem->id)
                ->whereJsonContains('data->reminder_type', $reminderType)
                ->exists();
        }

        return !$assignee->notifications()
            ->where('type', 'App\\Notifications\\DueDateReminder')
            ->whereJsonContains('data->work_item_id', $workItem->id)
            ->whereJsonContains('data->reminder_type', $reminderType)
            ->whereDate('created_at', today())
            ->exists();
    }

    protected function shouldSendToManager(work_item $workItem, User $manager, string $reminderType): bool
    {
        if (in_array($reminderType, ['two_weeks', 'one_week'])) {
            return !$manager->notifications()
                ->where('type', 'App\\Notifications\\DueDateReminder')
                ->whereJsonContains('data->work_item_id', $workItem->id)
                ->whereJsonContains('data->reminder_type', $reminderType)
                ->exists();
        }

        return !$manager->notifications()
            ->where('type', 'App\\Notifications\\DueDateReminder')
            ->whereJsonContains('data->work_item_id', $workItem->id)
            ->whereJsonContains('data->reminder_type', $reminderType)
            ->whereDate('created_at', today())
            ->exists();
    }
}
