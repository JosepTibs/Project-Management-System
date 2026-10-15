import { cn } from '@/lib/utils';
import {
    AlarmClock,
    BadgeCheck,
    Bell,
    BellRing,
    Calendar,
    CalendarClock,
    Clock,
    KeyRound,
    LayoutDashboard,
    MessageSquare,
    RefreshCw,
    Siren,
    UserPlus,
    type LucideIcon,
} from 'lucide-react';

/** Minimal shape this project actually sends (bell + index page + Echo). */
export type NotificationIconInput = {
    type?: string | null;
    reminder_type?: string | null;
    data?: { type?: string | null; reminder_type?: string | null } | null;
};

function resolveKind(input: NotificationIconInput): string {
    const outer = (input.type ?? '').trim();
    // class_basename match first (case-sensitive): 'WorkItemAssigned', etc.
    const known = [
        'WorkItemAssigned', 'StatusChanged', 'DueDateReminder',
        'WorkItemCompleted', 'AdminDigest', 'CommentAdded',
        'PasswordResetRequested',
    ];
    if (known.includes(outer)) return outer;
    // then snake slugs from data.type / toDatabase(): 'work_item_assigned', 'assigned', etc.
    const slug = (input.data?.type ?? outer).trim().toLowerCase();
    if (['workitemassigned', 'work_item_assigned', 'assigned'].includes(slug)) return 'WorkItemAssigned';
    if (['statuschanged', 'status_changed'].includes(slug)) return 'StatusChanged';
    if (['duedatereminder', 'due_date_reminder'].includes(slug)) return 'DueDateReminder';
    if (['workitemcompleted', 'work_item_completed', 'completed'].includes(slug)) return 'WorkItemCompleted';
    if (['admindigest', 'admin_digest', 'daily_digest'].includes(slug)) return 'AdminDigest';
    if (['commentadded', 'comment_added'].includes(slug)) return 'CommentAdded';
    if (['passwordresetrequested', 'password_reset', 'password_reset_requested'].includes(slug)) return 'PasswordResetRequested';
    // legacy aliases from the other project so old calls don't break
    if (slug === 'approval_completed') return 'WorkItemCompleted';
    return outer;
}

function resolveReminder(input: NotificationIconInput): string | null {
    const r = (input.reminder_type ?? input.data?.reminder_type ?? null);
    if (!r) return null;
    const v = String(r).toLowerCase();
    if (v === '30_day') return 'daily';
    if (v === '14_day') return 'two_weeks';
    if (v === '60_day') return 'two_weeks';
    return v; // two_weeks | one_week | daily | due_today | overdue
}

/**
 * Icon + text tone. Urgency via Lucide + color, messages stay plain text.
 */
export function notificationIcon(input: NotificationIconInput): { icon: LucideIcon; className: string } {
    const kind = resolveKind(input);

    if (kind === 'DueDateReminder') {
        switch (resolveReminder(input)) {
            case 'two_weeks': return { icon: Calendar, className: 'text-amber-600 dark:text-amber-400' };
            case 'one_week':  return { icon: CalendarClock, className: 'text-orange-600 dark:text-orange-400' };
            case 'daily':     return { icon: BellRing, className: 'text-orange-600 dark:text-orange-400' };
            case 'due_today': return { icon: AlarmClock, className: 'text-red-600 dark:text-red-400' };
            case 'overdue':   return { icon: Siren, className: 'text-red-700 dark:text-red-400' };
            default:          return { icon: Clock, className: 'text-orange-600 dark:text-orange-400' };
        }
    }

    switch (kind) {
        case 'WorkItemAssigned':      return { icon: UserPlus, className: 'text-purple-600 dark:text-purple-400' };
        case 'StatusChanged':         return { icon: RefreshCw, className: 'text-blue-600 dark:text-blue-400' };
        case 'CommentAdded':          return { icon: MessageSquare, className: 'text-teal-600 dark:text-teal-400' };
        case 'WorkItemCompleted':     return { icon: BadgeCheck, className: 'text-emerald-600 dark:text-emerald-400' };
        case 'AdminDigest':           return { icon: LayoutDashboard, className: 'text-indigo-600 dark:text-indigo-400' };
        case 'PasswordResetRequested':return { icon: KeyRound, className: 'text-amber-600 dark:text-amber-400' };
        default:                      return { icon: Bell, className: 'text-muted-foreground' };
    }
}

export function notificationIconClassName(className: string): string {
    return cn('h-4 w-4 shrink-0', className);
}

/** Circled pill for the /notifications page (replaces local TYPE_ICON). */
const PILL: Record<string, string> = {
    WorkItemAssigned: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    StatusChanged: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    DueDateReminder: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    CommentAdded: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
    WorkItemCompleted: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    AdminDigest: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
    PasswordResetRequested: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
};

export function NotificationTypeIcon({ type, reminder_type, data }: NotificationIconInput) {
    const { icon: Icon } = notificationIcon({ type, reminder_type, data });
    const kind = resolveKind({ type, reminder_type, data });
    return (
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', PILL[kind] ?? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400')}>
            <Icon className="h-4 w-4" />
        </span>
    );
}
