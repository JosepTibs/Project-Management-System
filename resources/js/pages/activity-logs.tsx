import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Monitor, User, Calendar, Filter } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Activity Logs',
        href: '/activity-logs',
    },
];

interface User {
    id: number;
    username: string;
    fname: string;
    lname: string;
}

interface ActivityLog {
    id: number;
    event: string;
    description: string | null;
    subject_type: string;
    ip_address: string | null;
    created_at: string;
    user: {
        id: number;
        username: string;
        fname: string;
        mname: string;
        lname: string;
        sname: string;
    } | null;
}

interface Filters {
    user_id: string;
    event: string;
    subject_type: string;
    date_from: string;
    date_to: string;
    search: string;
}

interface ActivityLogsPageProps extends Record<string, unknown> {
    activities: {
        data: ActivityLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    users: User[];
    eventTypes: string[];
    subjectTypes: string[];
    filters: Filters;
}

export default function ActivityLogs() {
    const { activities, users, eventTypes, subjectTypes, filters } = usePage<ActivityLogsPageProps>().props;
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const [showFilters, setShowFilters] = useState(false);

    const form = useForm({
        search: filters.search || '',
        user_id: filters.user_id && filters.user_id !== 'all' ? filters.user_id : '',
        event: filters.event && filters.event !== 'all' ? filters.event : '',
        subject_type: filters.subject_type && filters.subject_type !== 'all' ? filters.subject_type : '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    // Count active filters
    const activeFilterCount = [
        form.data.user_id,
        form.data.event,
        form.data.subject_type,
        form.data.date_from,
        form.data.date_to,
        form.data.search,
    ].filter(Boolean).length;

    const getEventBadge = (event: string) => {
        switch (event.toLowerCase()) {
            case 'created':
                return { label: 'Created', variant: 'default' as const, className: 'bg-green-600 text-white' };
            case 'updated':
                return { label: 'Updated', variant: 'default' as const, className: 'bg-blue-600 text-white' };
            case 'deleted':
                return { label: 'Deleted', variant: 'destructive' as const };
            case 'login':
                return { label: 'Login', variant: 'outline' as const, className: 'text-green-600 border-green-600' };
            case 'logout':
                return { label: 'Logout', variant: 'outline' as const };
            default:
                return { label: event, variant: 'secondary' as const };
        }
    };

    const getInitials = (name: string | undefined | null): string => {
        if (!name) return '?';
        const names = name.trim().split(' ');
        if (names.length === 0) return '?';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Filter Toggle Button */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Filters Card - Collapsible */}
                {showFilters && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search</Label>
                                    <Input
                                        id="search"
                                        value={form.data.search}
                                        onChange={(e) => form.setData('search', e.target.value)}
                                        placeholder="Search logs..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="user_id">User</Label>
                                    <Input
                                        id="user_id"
                                        value={form.data.user_id}
                                        onChange={(e) => form.setData('user_id', e.target.value)}
                                        list="users-list"
                                        placeholder="Select or type username..."
                                    />
                                    <datalist id="users-list">
                                        <option value="all" />
                                        {users.map((u) => (
                                            <option key={u.id} value={u.username}>
                                                {u.fname} {u.lname} (@{u.username})
                                            </option>
                                        ))}
                                    </datalist>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="event">Event Type</Label>
                                    <Input
                                        id="event"
                                        value={form.data.event}
                                        onChange={(e) => form.setData('event', e.target.value)}
                                        list="event-list"
                                        placeholder="Select or type event..."
                                    />
                                    <datalist id="event-list">
                                        <option value="all" />
                                        {eventTypes.map((event) => (
                                            <option key={event} value={event}>
                                                {event.charAt(0).toUpperCase() + event.slice(1)}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject_type">Model Type</Label>
                                    <Input
                                        id="subject_type"
                                        value={form.data.subject_type}
                                        onChange={(e) => form.setData('subject_type', e.target.value)}
                                        list="model-list"
                                        placeholder="Select or type model..."
                                    />
                                    <datalist id="model-list">
                                        <option value="all" />
                                        {subjectTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_from">Date From</Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={form.data.date_from}
                                        onChange={(e) => form.setData('date_from', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_to">Date To</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={form.data.date_to}
                                        onChange={(e) => form.setData('date_to', e.target.value)}
                                    />
                                </div>

                                <div className="flex items-end gap-2 md:col-span-2 lg:col-span-6">
                                    <Button 
                                        type="button"
                                        onClick={() => form.get('/activity-logs', {
                                            preserveState: true,
                                            preserveScroll: true,
                                        })}
                                        disabled={form.processing}
                                        className="flex-1 md:flex-none"
                                    >
                                        Apply Filters
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            form.reset();
                                            window.location.href = '/activity-logs';
                                        }}
                                        className="flex-1 md:flex-none"
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Activity Logs List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Activity Logs ({activities.total} total)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activities.data.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No activity logs found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 font-medium">User</th>
                                            <th className="pb-2 font-medium">Event</th>
                                            <th className="pb-2 font-medium">Description</th>
                                            <th className="pb-2 font-medium">Model</th>
                                            <th className="pb-2 font-medium">IP Address</th>
                                            <th className="pb-2 font-medium">Date</th>
                                            <th className="pb-2 font-medium">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.data.map((activity) => {
                                            const badge = getEventBadge(activity.event);
                                            return (
                                                <tr key={activity.id} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="py-3">
                                                        {activity.user ? (
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback className="rounded-md bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
                                                                        {getInitials(`${activity.user.fname} ${activity.user.lname}`)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {activity.user.fname} {activity.user.lname}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        @{activity.user.username}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">System</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        <Badge variant={badge.variant} className={badge.className}>
                                                            {badge.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 max-w-md">
                                                        <p className="text-sm truncate" title={activity.description || ''}>
                                                            {activity.description || '-'}
                                                        </p>
                                                    </td>
                                                    <td className="py-3">
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                                            {activity.subject_type}
                                                        </code>
                                                    </td>
                                                    <td className="py-3 text-muted-foreground">
                                                        {activity.ip_address || 'N/A'}
                                                    </td>
                                                    <td className="py-3 text-muted-foreground">
                                                        {formatDate(activity.created_at)}
                                                    </td>
                                                    <td className="py-3 text-muted-foreground">
                                                        {formatTime(activity.created_at)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {activities.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((activities.current_page - 1) * activities.per_page) + 1} to{' '}
                                    {Math.min(activities.current_page * activities.per_page, activities.total)} of{' '}
                                    {activities.total} results
                                </div>
                                <div className="flex gap-2">
                                    {activities.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1 text-sm rounded ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-muted/80'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}