import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, ArrowLeft, ChevronLeft, ChevronRight, Check, UserPlus, RefreshCw, Clock, MessageSquare, Loader2} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

interface NotificationData {
    id: string;
    type: string;
    type_label: string;
    data: {
        message: string;
        url?: string;
        project_name?: string;
        type?: string;
    };
    read_at: string | null;
    is_unread: boolean;
    created_at: string;
}

interface PaginatedData {
    data: NotificationData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface NotificationsPageProps {
    notifications: PaginatedData;
    filter?: 'all' | 'unread';
    unread_count?: number;
}

const TYPE_ICON: Record<string, { icon: typeof Bell; className: string }> = {
    WorkItemAssigned: { icon: UserPlus, className: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
    StatusChanged: { icon: RefreshCw, className: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
    DueDateReminder: { icon: Clock, className: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400' },
    CommentAdded: { icon: MessageSquare, className: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400' },
};

function TypeIcon({ type }: { type: string }) {
    const entry = TYPE_ICON[type] ?? { icon: Bell, className: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400' };
    const Icon = entry.icon;
    return (
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', entry.className)}>
            <Icon className="h-4 w-4" />
        </span>
    );
}

export default function NotificationsIndex({
    notifications,
    filter = 'all',
    unread_count = 0,
}: NotificationsPageProps) {
    const [items, setItems] = useState(notifications.data);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [isNavigating, setIsNavigating] = useState(false);
    const [unreadCount, setUnreadCount] = useState(unread_count);

    useEffect(() => {
        setItems(notifications.data);
        setUnreadCount(unread_count);
    }, [notifications.data, unread_count]);

    async function markAsRead(id: string) {
        const snapshot = items;
        setItems((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_unread: false, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setPendingIds((prev) => new Set(prev).add(id));
        try {
            await apiFetch(`/api/notifications/${id}/read`, { 
                method: 'POST',
                headers: csrfHeader()
            });
        } catch (e) {
            console.error('Failed to mark as read', e);
            setItems(snapshot);
            setUnreadCount((prev) => prev + 1);
        } finally {
            setPendingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    async function markAllAsRead() {
        const snapshot = items;
        setItems((prev) => prev.map((n) => ({ ...n, is_unread: false, read_at: new Date().toISOString() })));
        setUnreadCount(0);
        try {
            await apiFetch('/api/notifications/mark-all-read', { 
                method: 'POST',
                headers: csrfHeader()
            });
        } catch (e) {
            console.error('Failed to mark all as read', e);
            setItems(snapshot);
            setUnreadCount(unread_count);
        }
    }

    function csrfHeader(): Record<string, string> {
        const token = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
        return {
            'X-XSRF-TOKEN': decodeURIComponent(token),
            'Content-Type': 'application/json',
        };
    }

    function handleOpen(notification: NotificationData) {
        if (notification.is_unread) {
            markAsRead(notification.id);
        }
        if (notification.data.url) {
            setIsNavigating(true);
            router.visit(notification.data.url),{ preserveState: true, onFinish: () => setIsNavigating(false) };
        }
    }

    function goToFilter(next: 'all' | 'unread') {
        if (next === filter) return;
        setIsNavigating(true);
        router.get(
            '/notifications',
            { filter: next },
            { preserveState: true, onFinish: () => setIsNavigating(false) }
        );
    }

    function handlePageChange(url: string | null) {
        if (url) {
            setIsNavigating(true);
            router.get(url, {}, { preserveState: true ,onFinish: () => setIsNavigating(false) });
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            {notifications.total > 0
                                ? `Showing ${notifications.from}-${notifications.to} of ${notifications.total}`
                                : 'No notifications'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Filter tabs — merged directly onto the list container, no extra divider */}
                <div
                    className={cn(
                        'overflow-hidden rounded-lg border border-sidebar-border/70 transition-opacity',
                        isNavigating && 'opacity-60'
                    )}
                >
                    <div className="flex items-center gap-1 border-b bg-neutral-50/50 px-3 pt-2 dark:bg-neutral-900/40">
                        <button
                            onClick={() => goToFilter('all')}
                            className={cn(
                                'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                                filter === 'all'
                                    ? 'border-blue-600 text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => goToFilter('unread')}
                            className={cn(
                                'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                                filter === 'unread'
                                    ? 'border-blue-600 text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {filter === 'unread'
                                    ? "You're all caught up."
                                    : "You'll see notifications here when you're assigned to work items or when statuses change."}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {items.map((notification) => {
                                const clickable = Boolean(notification.data.url);
                                const pending = pendingIds.has(notification.id);
                                return (
                                    <div
                                        key={notification.id}
                                        role={clickable ? 'button' : undefined}
                                        tabIndex={clickable ? 0 : undefined}
                                        onClick={() => handleOpen(notification)}
                                        onKeyDown={(e) => {
                                            if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                                                e.preventDefault();
                                                handleOpen(notification);
                                            }
                                        }}
                                        className={cn(
                                            'flex items-center gap-3 border-b border-l-2 px-4 py-3 transition-colors last:border-b-0',
                                            clickable && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800',
                                            notification.is_unread
                                            ? 'border-l-blue-600 bg-blue-50/80 dark:bg-blue-950/30'
                                            : 'border-l-transparent bg-neutral-50/50 dark:bg-neutral-800/50'

                                        )}
                                    >
                                        <TypeIcon type={notification.type} />
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={cn(
                                                    'truncate text-sm',
                                                    notification.is_unread ? 'font-semibold' : 'text-muted-foreground'
                                                )}
                                            >
                                                {notification.data.message}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{notification.created_at}</span>
                                                {notification.data.project_name && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate">{notification.data.project_name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {notification.is_unread && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                disabled={pending}
                                                title="Mark as read"
                                                className="shrink-0 rounded-full p-1.5 text-muted-foreground/70 transition-colors hover:bg-neutral-200 hover:text-foreground disabled:opacity-50 dark:hover:bg-neutral-700"
                                            >
                                                {pending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {notifications.links.map((link, index) => {
                            if (link.label === '...') {
                                return (
                                    <span key={index} className="px-2 text-sm text-muted-foreground">
                                        …
                                    </span>
                                );
                            }
                            const isPrev = link.label.toLowerCase().includes('previous');
                            const isNext = link.label.toLowerCase().includes('next');
                            return (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePageChange(link.url)}
                                    disabled={!link.url}
                                >
                                    {isPrev ? (
                                        <ChevronLeft className="h-4 w-4" />
                                    ) : isNext ? (
                                        <ChevronRight className="h-4 w-4" />
                                    ) : (
                                        link.label
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}