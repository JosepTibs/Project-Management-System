import { DonutChart, DonutLegend } from '@/components/charts/donut-chart';
import { WorkloadChart } from '@/components/charts/workload-chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    CheckSquare,
    CircleSlash,
    Clock,
    FolderKanban,
    Milestone,
    Percent,
    TrendingUp,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface Status {
    name: string;
    count: number;
}
interface RecentWorkItem {
    id: number;
    title: string;
    priority: string;
    project: string;
    project_id: number | null;
    status: string;
    due_date: string | null;
}
interface ProjectOverview {
    id: number;
    name: string;
    description: string;
    members_count: number;
    work_items_count: number;
    completion_percentage: number;
}
interface TaskCount {
    user_name: string;
    total: number;
}
interface PositionCount {
    name: string;
    total: number;
}
interface MilestoneOverview {
    total: number;
    completed: number;
    overdue: number;
    upcoming: number;
}
interface TimelinePoint {
    week: string;
    created: number;
    completed: number;
}

/** One tile in the role-specific metrics grid. */
interface Metric {
    label: string;
    value: string | number;
    hint: ReactNode;
    icon: LucideIcon;
    tone?: 'default' | 'danger';
    /** When set, clicking the tile navigates to this route. */
    href?: string;
}
interface DashboardStats {
    total_users: number;
    total_projects: number;
    total_work_items: number;
    overdue_work_items: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
    critical_priority: number;
    avg_completion: number;
    completed_work_items: number;
    unassigned_work_items: number;
    due_this_week: number;
    new_users_week: number;
    blocked_work_items: number;
}
interface ActivityLog {
    id: number;
    type: 'login' | 'general';
    event: string;
    user_name: string;
    username: string;
    ip_address: string | null;
    description: string | null;
    date: string;
    time: string;
}

interface DashboardPageProps extends Record<string, unknown> {
    stats: DashboardStats;
    statuses: Status[];
    recent_work_items: RecentWorkItem[];
    projects_overview: ProjectOverview[];
    recent_activities: ActivityLog[];
    tasks_per_user: TaskCount[];
    timeline: TimelinePoint[];
    milestones_overview: MilestoneOverview;
    team_by_position: PositionCount[];
    unassigned_position_count: number;
}

function getPriorityBadge(priority: string) {
    const norm = priority?.toLowerCase();
    if (norm === 'high') return <Badge className="border-rose-200 bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 dark:text-rose-400">High</Badge>;
    if (norm === 'medium')
        return <Badge className="border-amber-200 bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400">Medium</Badge>;
    return <Badge className="border-emerald-200 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400">Low</Badge>;
}

function getInitials(name?: string | null): string {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

export default function Dashboard() {
    const {
        stats,
        statuses = [],
        recent_work_items = [],
        projects_overview = [],
        recent_activities = [],
        tasks_per_user = [],
        team_by_position: teamByPosition = [],
        unassigned_position_count: unassignedPositionCount = 0,
        milestones_overview = { total: 0, completed: 0, overdue: 0, upcoming: 0 },
    } = usePage<DashboardPageProps>().props;
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    // Role-based dashboard: admins get full audit analytics, managers get
    // their owned-project scope, members see a personal "My Tasks" view.
    const roles: string[] = auth?.roles ?? [];
    const isAdmin = roles.some((r) => ['admin', 'superadmin'].includes(r.toLowerCase()));
    const isManager = !isAdmin && roles.some((r) => r.toLowerCase().includes('manager'));
    const isMember = !isAdmin && !isManager;

    const totalWork = stats?.total_work_items || 1;

    const priorityData = [
        { name: 'Critical', value: stats?.critical_priority ?? 0, color: '#8b5cf6' },
        { name: 'High', value: stats?.high_priority ?? 0, color: '#e11d48' },
        { name: 'Medium', value: stats?.medium_priority ?? 0, color: '#f59e0b' },
        { name: 'Low', value: stats?.low_priority ?? 0, color: '#10b981' },
    ];

    const statusData = statuses.map((status) => ({ name: status.name, value: status.count }));

    const workloadData = tasks_per_user.map((task) => ({ name: task.user_name, value: task.total }));

    // Deep-link helper for recent-task rows; undefined when the project ref is missing.
    const workItemHref = (item: RecentWorkItem) => (item.project_id ? `/projects/${item.project_id}/work-items/${item.id}?from=all` : undefined);

    // Metric tiles: exactly four per role.
    const overdueCount = stats?.overdue_work_items ?? 0;

    const completedMetric = (hint: string): Metric => ({
        label: 'Completed Items',
        value: stats?.completed_work_items ?? 0,
        hint,
        icon: CheckCircle2,
        href: '/work-items',
    });

    const overdueMetric: Metric = {
        label: 'Overdue Items',
        value: overdueCount,
        hint: overdueCount > 0 ? 'Requires immediate action' : 'All tasks on schedule',
        icon: AlertCircle,
        tone: overdueCount > 0 ? 'danger' : 'default',
        href: '/work-items',
    };

    // Four metrics per role. Every figure is already scoped server-side:
    // admins -> company-wide, managers -> projects they own, members -> their own tasks.
    const metrics: Metric[] = isAdmin
        ? [
              { label: 'Active Projects', value: stats?.total_projects ?? 0, hint: 'Across all departments', icon: FolderKanban, href: '/projects' },
              overdueMetric,
              completedMetric('Across all projects'),
              {
                  label: 'Total Team',
                  value: stats?.total_users ?? 0,
                  hint: (
                      <div className="space-y-1.5">
                          <div>+{stats?.new_users_week ?? 0} joined this week</div>
                          {teamByPosition.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                  {teamByPosition.map((p) => (
                                      <Badge
                                          key={p.name}
                                          variant="secondary"
                                          className={`text-[10px] font-normal ${p.total === 0 ? 'text-muted-foreground/70' : ''}`}
                                      >
                                          {p.name}: {p.total}
                                      </Badge>
                                  ))}
                                  {unassignedPositionCount > 0 && (
                                      <Badge variant="secondary" className="text-muted-foreground/70 text-[10px] font-normal">
                                          Not assigned: {unassignedPositionCount}
                                      </Badge>
                                  )}
                              </div>
                          )}
                      </div>
                  ),
                  icon: Users,
                  href: '/users',
              },
          ]
        : isManager
          ? [
                { label: 'My Projects', value: stats?.total_projects ?? 0, hint: 'Projects you own', icon: FolderKanban, href: '/projects' },
                overdueMetric,
                completedMetric('In your projects'),
                {
                    label: 'Unassigned',
                    value: stats?.unassigned_work_items ?? 0,
                    hint: 'Tasks without an assignee',
                    icon: CircleSlash,
                    href: '/work-items',
                },
            ]
          : [
                { label: 'Avg Completion', value: `${stats?.avg_completion ?? 0}%`, hint: 'Across your tasks', icon: Percent },
                { label: 'Due This Week', value: stats?.due_this_week ?? 0, hint: 'In the next 7 days', icon: CalendarClock, href: '/work-items' },
                overdueMetric,
                completedMetric('Of your tasks'),
            ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
                {/* Header Profile Banner & Actions */}
                <div className="bg-card flex flex-col justify-between gap-4 rounded-xl border p-6 shadow-xs md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <Avatar className="border-primary/20 h-14 w-14 border-2">
                            <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(user?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">Welcome back, {user?.name}</h1>
                            <p className="text-muted-foreground text-sm">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={typeof route === 'function' ? route('profile.show') : '/profile'}>Edit Profile</Link>
                        </Button>
                    </div>
                </div>

                {/* Key Metrics — exactly four per role */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        const danger = metric.tone === 'danger';

                        const card = (
                            <Card
                                key={metric.label}
                                className={`shadow-xs transition-colors ${[
                                    danger ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/10' : '',
                                    metric.href ? 'hover:border-primary/50 hover:shadow-sm' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}`}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-muted-foreground text-sm font-medium">{metric.label}</CardTitle>
                                    <span className="flex items-center gap-1">
                                        <Icon className={`h-4 w-4 ${danger ? 'text-rose-500' : 'text-muted-foreground'}`} />
                                        {metric.href && <ArrowUpRight className="text-muted-foreground/60 h-3.5 w-3.5" />}
                                    </span>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${danger ? 'text-rose-600 dark:text-rose-400' : ''}`}>{metric.value}</div>
                                    <div className="text-muted-foreground mt-1 text-xs">{metric.hint}</div>
                                </CardContent>
                            </Card>
                        );

                        return metric.href ? (
                            <Link
                                key={metric.label}
                                href={metric.href}
                                className="focus-visible:ring-ring block rounded-lg outline-none focus-visible:ring-2"
                            >
                                {card}
                            </Link>
                        ) : (
                            card
                        );
                    })}
                </div>

                {/* Zoho-style Work Summary & Priority donuts */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Priority Mix</CardTitle>
                            <CardDescription>Active tasks by set urgency</CardDescription>
                        </CardHeader>
                        <CardContent className="grid items-center gap-6 sm:grid-cols-2">
                            <DonutChart data={priorityData} centerValue={String(totalWork)} centerLabel="Total items" />
                            <DonutLegend data={priorityData} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Work Summary</CardTitle>
                            <CardDescription>Work items grouped by current status</CardDescription>
                        </CardHeader>
                        <CardContent className="grid items-center gap-6 sm:grid-cols-2">
                            <DonutChart data={statusData} centerValue={String(totalWork)} centerLabel="Total items" />
                            <DonutLegend data={statusData} />
                        </CardContent>
                    </Card>
                </div>

                {/* Health & Workload Metrics */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Link href="/projects" className="focus-visible:ring-ring block rounded-xl outline-none focus-visible:ring-2">
                        <Card className="hover:border-primary/50 shadow-xs transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium">Milestones</CardTitle>
                                <span className="flex items-center gap-1">
                                    <Milestone className="text-muted-foreground h-4 w-4" />
                                    <ArrowUpRight className="text-muted-foreground/60 h-3.5 w-3.5" />
                                </span>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-2xl font-bold">{milestones_overview.total ?? 0}</div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="rounded-md bg-emerald-500/10 p-2 text-center">
                                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {milestones_overview.completed ?? 0}
                                        </div>
                                        <div className="text-muted-foreground">Done</div>
                                    </div>
                                    <div className="rounded-md bg-amber-500/10 p-2 text-center">
                                        <div className="font-semibold text-amber-600 dark:text-amber-400">{milestones_overview.upcoming ?? 0}</div>
                                        <div className="text-muted-foreground">Upcoming</div>
                                    </div>
                                    <div className="rounded-md bg-rose-500/10 p-2 text-center">
                                        <div className="font-semibold text-rose-600 dark:text-rose-400">{milestones_overview.overdue ?? 0}</div>
                                        <div className="text-muted-foreground">Overdue</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {isMember ? (
                        <Card className="shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium">My Tasks</CardTitle>
                                <CheckSquare className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-2xl font-bold">{stats?.total_work_items ?? 0}</div>
                                <p className="text-muted-foreground text-xs">
                                    {stats?.completed_work_items ?? 0} fully complete ·{stats?.due_this_week ?? 0} due this week
                                </p>
                                {recent_work_items.length > 0 && (
                                    <ul className="space-y-1.5">
                                        {recent_work_items.slice(0, 5).map((item) => (
                                            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                                                {workItemHref(item) ? (
                                                    <Link href={workItemHref(item)!} className="truncate hover:underline">
                                                        {item.title}
                                                    </Link>
                                                ) : (
                                                    <span className="truncate">{item.title}</span>
                                                )}
                                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                                    {item.status}
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-muted-foreground text-sm font-medium">Tasks Per Assignee</CardTitle>
                                <TrendingUp className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-muted-foreground text-xs">
                                    Open workload by team member; bars above 1.5&times; the average appear highlighted.
                                </p>
                                {workloadData.length > 0 ? (
                                    <WorkloadChart data={workloadData} height={240} />
                                ) : (
                                    <p className="text-muted-foreground text-sm">No assigned tasks to show.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Tabbed Interactive Section */}
                <Tabs defaultValue="work_items" className="w-full">
                    <div className="flex items-center justify-between pb-2">
                        <TabsList className="bg-muted/60 p-1">
                            <TabsTrigger value="work_items">{isMember ? 'My Tasks' : 'Recent Tasks'}</TabsTrigger>
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            {isAdmin && <TabsTrigger value="activity">Audit Activity</TabsTrigger>}
                        </TabsList>
                    </div>

                    {/* Tasks Tab */}
                    <TabsContent value="work_items" className="mt-2">
                        <Card className="shadow-xs">
                            <CardContent className="p-0">
                                {recent_work_items.length > 0 ? (
                                    <div className="divide-border divide-y">
                                        {recent_work_items.map((item) => (
                                            <div key={item.id} className="hover:bg-muted/30 flex items-center justify-between p-4 transition-colors">
                                                <div className="space-y-1">
                                                    {workItemHref(item) ? (
                                                        <Link
                                                            href={workItemHref(item)!}
                                                            className="text-sm leading-tight font-medium hover:underline"
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    ) : (
                                                        <p className="text-sm leading-tight font-medium">{item.title}</p>
                                                    )}
                                                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                                        <span>{item.project}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {item.due_date ?? 'No due date'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {getPriorityBadge(item.priority)}
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground p-6 text-center text-sm">No recent work items.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Projects Tab */}
                    <TabsContent value="projects" className="mt-2">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects_overview.length > 0 ? (
                                projects_overview.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="focus-visible:ring-ring block rounded-xl outline-none focus-visible:ring-2"
                                    >
                                        <Card className="hover:border-primary/50 shadow-xs transition-colors">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="flex items-center justify-between text-base">
                                                    {project.name}
                                                    <ArrowUpRight className="text-muted-foreground h-4 w-4" />
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <p className="text-muted-foreground line-clamp-2 text-xs">
                                                    {project.description || 'No description provided.'}
                                                </p>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-medium">
                                                        <span className="text-muted-foreground">Completion</span>
                                                        <span>{project.completion_percentage ?? 0}%</span>
                                                    </div>
                                                    <Progress value={project.completion_percentage ?? 0} className="h-2" />
                                                </div>
                                                <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5" /> {project.members_count} Members
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <CheckSquare className="h-3.5 w-3.5" /> {project.work_items_count} Tasks
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">No project data available.</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Activity Log Tab (admins only) */}
                    {isAdmin && (
                        <TabsContent value="activity" className="mt-2">
                            <Card className="shadow-xs">
                                <CardContent className="p-6">
                                    {recent_activities.length > 0 ? (
                                        <div className="after:bg-border relative space-y-6 pl-6 after:absolute after:inset-y-0 after:left-2.5 after:w-0.5">
                                            {recent_activities.map((activity) => (
                                                <div key={activity.id} className="relative flex items-start gap-4">
                                                    <div className="bg-background border-border absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full border">
                                                        <Activity className="text-primary h-3 w-3" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-sm font-medium">
                                                            {activity.user_name}{' '}
                                                            <span className="text-muted-foreground text-xs font-normal">({activity.event})</span>
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {activity.description || 'System action logged'}
                                                        </p>
                                                    </div>
                                                    <div className="text-muted-foreground text-right text-xs">
                                                        <p>{activity.date}</p>
                                                        <p>{activity.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center text-sm">No recent activity logged.</p>
                                    )}

                                    <div className="mt-4 border-t pt-3">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href="/activity-logs">View all activity</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </AppLayout>
    );
}
