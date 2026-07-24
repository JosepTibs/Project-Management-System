import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Calendar, Shield, User, LogIn, LogOut, AlertTriangle, Monitor } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Profile',
        href: '/profile',
    },
];

interface Role {
    id: number;
    name: string;
}

interface ProfileUser {
    id: number;
    username: string;
    fname: string | null;
    mname: string | null;
    lname: string | null;
    sname: string | null;
    name: string;
    email: string;
    avatar: string | null;
    created_at: string;
    updated_at: string;
    email_verified_at: string | null;
    roles: Role[];
}

interface Activity {
    id: number;
    event: 'login' | 'logout' | 'failed';
    ip_address: string | null;
    user_agent: string | null;
    date: string;
    time: string;
}

interface ProfilePageProps extends Record<string, unknown> {
    user: ProfileUser;
    activities: Activity[];
}

function getInitials(name: string | undefined | null): string {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 0) return '?';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

export default function Profile() {
    const { user, activities } = usePage<ProfilePageProps>().props;

    const getEventBadge = (event: string) => {
        switch (event) {
            case 'login':
                return { label: 'Login', variant: 'default' as const, icon: LogIn, className: 'text-green-600 border-green-600' };
            case 'logout':
                return { label: 'Logout', variant: 'outline' as const, icon: LogOut, className: 'text-muted-foreground' };
            case 'failed':
                return { label: 'Failed', variant: 'destructive' as const, icon: AlertTriangle, className: 'text-red-600 border-red-600' };
            default:
                return { label: event, variant: 'secondary' as const, icon: Monitor, className: '' };
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Back Button */}
                <div>
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Profile Header Card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                            <Avatar className="h-24 w-24 overflow-hidden rounded-full">
                                <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                                <AvatarFallback className="rounded-full bg-neutral-200 text-2xl text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                <p className="text-muted-foreground">@{user.username}</p>
                                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    {user.roles.length > 0 ? (
                                        user.roles.map((role) => (
                                            <Badge key={role.id} variant="secondary">
                                                {role.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant="outline">No role assigned</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Details */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-1">
                                <p className="text-xs text-muted-foreground">First Name</p>
                                <p className="font-medium">{user.fname || 'N/A'}</p>
                            </div>
                            <div className="grid gap-1">
                                <p className="text-xs text-muted-foreground">Middle Name</p>
                                <p className="font-medium">{user.mname || 'N/A'}</p>
                            </div>
                            <div className="grid gap-1">
                                <p className="text-xs text-muted-foreground">Last Name</p>
                                <p className="font-medium">{user.lname || 'N/A'}</p>
                            </div>
                            <div className="grid gap-1">
                                <p className="text-xs text-muted-foreground">Suffix</p>
                                <p className="font-medium">{user.sname || 'N/A'}</p>
                            </div>
                            <div className="grid gap-1">
                                <p className="text-xs text-muted-foreground">Username</p>
                                <p className="font-medium">{user.username}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Mail className="h-5 w-5" />
                                Contact & Account
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-1">
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div className="grid gap-1">
                                <p className="text-xs text-muted-foreground">Email Verified</p>
                                <p className="font-medium">
                                    {user.email_verified_at ? (
                                        <span className="flex items-center gap-1 text-green-600">
                                            <span className="h-2 w-2 rounded-full bg-green-600" />
                                            Verified on {user.email_verified_at}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-amber-600">
                                            <span className="h-2 w-2 rounded-full bg-amber-600" />
                                            Not verified
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="grid gap-1">
                                <p className="text-xs text-muted-foreground">Roles</p>
                                <div className="flex flex-wrap gap-1">
                                    {user.roles.length > 0 ? (
                                        user.roles.map((role) => (
                                            <Badge key={role.id} variant="secondary">
                                                {role.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="font-medium text-muted-foreground">No roles assigned</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Account Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5" />
                            Account Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Account Created</p>
                                    <p className="text-sm text-muted-foreground">{user.created_at}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Last Updated</p>
                                    <p className="text-sm text-muted-foreground">{user.updated_at}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Login Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Monitor className="h-5 w-5" />
                            Recent Login Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {activities.map((activity) => {
                                    const badge = getEventBadge(activity.event);
                                    const Icon = badge.icon;
                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                    <Icon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium capitalize">{activity.event}</span>
                                                        <Badge variant={badge.variant} className={badge.className}>
                                                            {badge.label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {activity.ip_address ?? 'Unknown IP'} • {activity.user_agent ?? 'Unknown device'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">{activity.date} • {activity.time}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Settings Link */}
                <div className="flex justify-center">
                    <Button variant="outline" asChild>
                        <Link href={route('profile.edit')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Edit Profile Settings
                        </Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}