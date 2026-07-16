import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface Status {
    name: string;
    count: number;
}

interface RecentWorkItem {
    id: number;
    title: string;
    priority: string;
    project: string;
    status: string;
    due_date: string | null;
}

interface ProjectOverview {
    id: number;
    name: string;
    description: string;
    members_count: number;
    work_items_count: number;
}

interface TeamDistribution {
    project_name: string;
    total: number;
}

interface DashboardStats {
    total_users: number;
    total_projects: number;
    total_work_items: number;
    overdue_work_items: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
}

interface DashboardPageProps extends Record<string, unknown> {
    stats: DashboardStats;
    statuses: Status[];
    recent_work_items: RecentWorkItem[];
    projects_overview: ProjectOverview[];
    team_distribution: TeamDistribution[];
}

function getPriorityBadgeVariant(priority: string) {
    switch (priority?.toLowerCase()) {
        case 'high':
            return 'destructive' as const;
        case 'medium':
            return 'default' as const;
        case 'low':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
}

export default function Dashboard() {
    const { stats, statuses, recent_work_items, projects_overview, team_distribution } =
        usePage<DashboardPageProps>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Stats Cards Row */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <span className="text-2xl">👥</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_users}</div>
                            <p className="text-xs text-muted-foreground">Registered users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                            <span className="text-2xl">📁</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_projects}</div>
                            <p className="text-xs text-muted-foreground">Active projects</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Work Items</CardTitle>
                            <span className="text-2xl">📋</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_work_items}</div>
                            <p className="text-xs text-muted-foreground">
                                H: {stats.high_priority} · M: {stats.medium_priority} · L: {stats.low_priority}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                            <span className="text-2xl">⚠️</span>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stats.overdue_work_items > 0 ? 'text-red-600' : ''}`}>
                                {stats.overdue_work_items}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.overdue_work_items > 0 ? 'Needs attention' : 'All caught up'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Priority Distribution & Status Pipeline */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Priority Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Priority Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="font-medium text-red-600">High</span>
                                        <span>{stats.high_priority}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                        <div
                                            className="h-2 rounded-full bg-red-600"
                                            style={{
                                                width: stats.total_work_items > 0
                                                    ? `${(stats.high_priority / stats.total_work_items) * 100}%`
                                                    : '0%',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="font-medium text-amber-600">Medium</span>
                                        <span>{stats.medium_priority}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                        <div
                                            className="h-2 rounded-full bg-amber-500"
                                            style={{
                                                width: stats.total_work_items > 0
                                                    ? `${(stats.medium_priority / stats.total_work_items) * 100}%`
                                                    : '0%',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="font-medium text-green-600">Low</span>
                                        <span>{stats.low_priority}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                        <div
                                            className="h-2 rounded-full bg-green-500"
                                            style={{
                                                width: stats.total_work_items > 0
                                                    ? `${(stats.low_priority / stats.total_work_items) * 100}%`
                                                    : '0%',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Pipeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Status Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {statuses.length > 0 ? (
                                    statuses.map((status) => (
                                        <div key={status.name}>
                                            <div className="mb-1 flex items-center justify-between text-sm">
                                                <span className="font-medium">{status.name}</span>
                                                <span>{status.count}</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full bg-sky-600"
                                                    style={{
                                                        width: stats.total_work_items > 0
                                                            ? `${(status.count / stats.total_work_items) * 100}%`
                                                            : '0%',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No statuses defined yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Work Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Work Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recent_work_items.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 font-medium">Title</th>
                                            <th className="pb-2 font-medium">Project</th>
                                            <th className="pb-2 font-medium">Priority</th>
                                            <th className="pb-2 font-medium">Status</th>
                                            <th className="pb-2 font-medium">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent_work_items.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0">
                                                <td className="py-2 font-medium">{item.title}</td>
                                                <td className="py-2 text-muted-foreground">{item.project}</td>
                                                <td className="py-2">
                                                    <Badge variant={getPriorityBadgeVariant(item.priority)}>
                                                        {item.priority}
                                                    </Badge>
                                                </td>
                                                <td className="py-2 text-muted-foreground">{item.status}</td>
                                                <td className="py-2 text-muted-foreground">
                                                    {item.due_date ?? 'No due date'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No work items yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Projects Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Projects Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {projects_overview.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {projects_overview.map((project) => (
                                    <Card key={project.id} className="border-sidebar-border/70">
                                        <CardHeader>
                                            <CardTitle className="text-base">{project.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                                                {project.description ?? 'No description'}
                                            </p>
                                            <div className="flex gap-4 text-sm">
                                                <span className="flex items-center gap-1">
                                                    👥 {project.members_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    📋 {project.work_items_count}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No projects yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Team Distribution */}
                {team_distribution.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Team Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {team_distribution.map((item) => (
                                    <div key={item.project_name}>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="font-medium">{item.project_name}</span>
                                            <span>{item.total} members</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-muted">
                                            <div
                                                className="h-2 rounded-full bg-violet-600"
                                                style={{
                                                    width: `${Math.min((item.total / Math.max(...team_distribution.map((d) => d.total))) * 100, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}