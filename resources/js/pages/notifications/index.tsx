import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'WorkItemAssigned': return '👤';
        case 'StatusChanged': return '🔄';
        case 'DueDateReminder': return '⏰';
        case 'CommentAdded': return '💬';
        default: return '🔔';
    }
}

export default function NotificationsIndex({ notifications }: NotificationsPageProps) {
    const [items, setItems] = useState(notifications.data);
    const [pagination, setPagination] = useState({
        current_page: notifications.current_page,
        last_page: notifications.last_page,
        from: notifications.from,
        to: notifications.to,
        total: notifications.total,
        links: notifications.links,
    });

    async function markAsRead(id: string) {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            setItems(prev =>
                prev.map(n => n.id === id ? { ...n, is_unread: false, read_at: new Date().toISOString() } : n)
            );
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    }

    async function markAllAsRead() {
        try {
            await fetch('/api/notifications/mark-all-read', { method: 'POST' });
            setItems(prev => prev.map(n => ({ ...n, is_unread: false, read_at: new Date().toISOString() })));
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    }

    function handlePageChange(url: string | null) {
        if (url) {
            router.get(url);
        }
    }

    const unreadCount = items.filter(n => n.is_unread).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            Showing {pagination.from}-{pagination.to} of {pagination.total} notifications
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                <div className="rounded-lg border border-sidebar-border/70">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium">No notifications yet</p>
                            <p className="text-sm text-muted-foreground">
                                You'll see notifications here when you're assigned to work items or when statuses change.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {items.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'flex cursor-pointer items-start gap-4 border-b px-6 py-4 transition-colors last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                                        notification.is_unread && 'bg-blue-50 dark:bg-blue-950/30'
                                    )}
                                    onClick={() => {
                                        if (notification.is_unread) {
                                            markAsRead(notification.id);
                                        }
                                        if (notification.data.url) {
                                            router.visit(notification.data.url);
                                        }
                                    }}
                                >
                                    <span className="mt-1 text-2xl">{getTypeIcon(notification.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <p className={cn('text-sm', notification.is_unread ? 'font-semibold' : 'text-muted-foreground')}>
                                                {notification.data.message}
                                            </p>
                                            {notification.is_unread && (
                                                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                                            )}
                                        </div>
                                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>{notification.created_at}</span>
                                            {notification.data.project_name && (
                                                <>
                                                    <span>•</span>
                                                    <span>{notification.data.project_name}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span className="capitalize">{notification.type_label}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {pagination.links.map((link, index) => {
                            if (link.label === '...') {
                                return (
                                    <span key={index} className="px-2 text-sm text-muted-foreground">
                                        ...
                                    </span>
                                );
                            }
                            return (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePageChange(link.url)}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}