export interface DueStatus {
    label: string;
    className: string;
    date: string | null;
}

function formatDate(dateStr: string): string {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export function getDueStatus( endDate: string | null | undefined, progress: number, completedAt?: string | null | undefined): DueStatus {
     const isDone = progress >= 100 || !!completedAt;
    if (isDone) {
        return {
            label: completedAt
                ? `Done · ${formatDate(completedAt)}`   // ← shows the completion date
                : 'Done',
            className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            date: endDate ? formatDate(endDate) : null,
        };
    }

    if (!endDate) {
        return { label: 'No due date', className: '', date: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${endDate}T00:00:00`);
    const daysLeft = Math.round((due.getTime() - today.getTime()) / 86_400_000);

    if (daysLeft < 0) return {
        label: `${formatDate(endDate)} · Overdue ${Math.abs(daysLeft)}d`,
        className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        date: formatDate(endDate),
    };
    if (daysLeft === 0) return {
        label: `${formatDate(endDate)} · Due today`,
        className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        date: formatDate(endDate),
    };
    if (daysLeft <= 3) return {
        label: `${formatDate(endDate)} · ${daysLeft}d left`,
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        date: formatDate(endDate),
    };
    return {
        label: `${formatDate(endDate)} · ${daysLeft}d left`,
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
        date: formatDate(endDate),
    };
}
