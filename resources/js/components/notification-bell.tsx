import { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEchoNotification } from '@laravel/echo-react';

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

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const {auth} = usePage().props as any;
    const userId = auth?.user?.id;


    useEchoNotification(`App.Models.User.${userId}`, () => {
    fetchRecent();
    fetchUnreadCount();
});

    useEffect(() => {
        fetchRecent();
        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchRecent() {
        try {
            const res = await fetch('/api/notifications/recent');
            const data = await res.json();
            setNotifications(data.notifications);
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    }

    async function fetchUnreadCount() {
        try {
            const res = await fetch('/api/notifications/unread-count');
            const data = await res.json();
            setUnreadCount(data.count);
        } catch (e) {
            console.error('Failed to fetch unread count', e);
        }
    }

    function csrfHeader(): Record<string, string> {
        const token = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
        return {
            'X-XSRF-TOKEN': decodeURIComponent(token),
            'Content-Type': 'application/json',
        };
    }

    async function markAsRead(id: string) {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: csrfHeader() });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_unread: false, read_at: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    }

    async function markAllAsRead() {
        try {
            await fetch('/api/notifications/mark-all-read', { method: 'POST', headers: csrfHeader() });
            setNotifications(prev => prev.map(n => ({ ...n, is_unread: false, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    }

    function handleToggle() {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setLoading(true);
            fetchRecent().finally(() => setLoading(false));
        }
    }

    function getTypeIcon(type: string) {
        switch (type) {
            case 'assigned': return '👤';
            case 'status_changed': return '🔄';
            case 'DueDateReminder': return '⏰';
            case 'comment_added': return '💬';
            default: return '🔔';
        }
    }

    return (
        <div ref={dropdownRef} className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 cursor-pointer"
                onClick={handleToggle}
            >
                <Bell className="!size-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-sidebar-border/70 bg-white shadow-lg dark:bg-neutral-900">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h3 className="text-sm font-semibold">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                >
                                    <CheckCheck className="h-3 w-3" />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800',
                                        notification.is_unread && 'bg-blue-50 dark:bg-blue-950/30'
                                    )}
                                    onClick={async() => {
                                        if (notification.is_unread) {
                                            await markAsRead(notification.id);
                                        }
                                        if (notification.data.url) {
                                            window.location.href = notification.data.url;
                                        }
                                    }}
                                >
                                    <span className="mt-0.5 text-lg">{getTypeIcon(notification.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn('text-sm', notification.is_unread ? 'font-medium' : 'text-muted-foreground')}>
                                            {notification.data.message}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {notification.created_at}
                                        </p>
                                    </div>
                                    {notification.is_unread && (
                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        href={route('notifications.index')}
                        className="block border-t px-4 py-2.5 text-center text-sm text-blue-600 hover:bg-neutral-50 dark:text-blue-400 dark:hover:bg-neutral-800"
                        onClick={() => setIsOpen(false)}
                    >
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
}