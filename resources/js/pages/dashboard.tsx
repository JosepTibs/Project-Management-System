import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {  Users,  FolderKanban,  CheckSquare,  AlertCircle,  ArrowUpRight,  Clock,  Activity,  Percent,  CalendarClock,  CircleSlash,  Flag,  Milestone,  TrendingUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface Status { name: string; count: number; }
interface RecentWorkItem { id: number; title: string; priority: string; project: string; status: string; due_date: string | null; }
interface ProjectOverview { id: number; name: string; description: string; members_count: number; work_items_count: number; completion_percentage: number; }
interface TeamDistribution { project_name: string; total: number; }
interface TaskCount { user_name: string; total: number; }
interface MilestoneOverview { total: number; completed: number; overdue: number; upcoming: number; }
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
    team_distribution: TeamDistribution[];
    recent_activities: ActivityLog[];
    tasks_per_user: TaskCount[];
    milestones_overview: MilestoneOverview;
}

function getPriorityBadge(priority: string) {
    const norm = priority?.toLowerCase();
    if (norm === 'high') return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 hover:bg-rose-500/25">High</Badge>;
    if (norm === 'medium') return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 hover:bg-amber-500/25">Medium</Badge>;
    return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 hover:bg-emerald-500/25">Low</Badge>;
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
        team_distribution = [], 
        recent_activities = [], 
        tasks_per_user = [], 
        milestones_overview = { total: 0, completed: 0, overdue: 0, upcoming: 0 } 
    } = usePage<DashboardPageProps>().props;
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const maxTeamMembers = Math.max(...team_distribution.map((d) => d.total), 1);
    const totalWork = stats?.total_work_items || 1;
    const maxTasks = Math.max(...tasks_per_user.map((t) => t.total), 1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                
                {/* Header Profile Banner & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-xs">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                            <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                            <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                                {getInitials(user?.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">Welcome back, {user?.name}</h1>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={typeof route === 'function' ? route('profile.show') : '/profile'}>
                                Edit Profile
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Team</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_users ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">+{stats?.new_users_week ?? 0} joined this week</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_projects ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Work Items</CardTitle>
                            <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_work_items ?? 0}</div>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                <span className="text-rose-600 font-medium">H: {stats?.high_priority ?? 0}</span>
                                <span>•</span>
                                <span className="text-amber-600 font-medium">M: {stats?.medium_priority ?? 0}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-medium">L: {stats?.low_priority ?? 0}</span>
                                <span>•</span>
                                <span className="text-violet-600 font-medium">C: {stats?.critical_priority ?? 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`shadow-xs ${(stats?.overdue_work_items ?? 0) > 0 ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Items</CardTitle>
                            <AlertCircle className={`h-4 w-4 ${(stats?.overdue_work_items ?? 0) > 0 ? 'text-rose-500' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${(stats?.overdue_work_items ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                                {stats?.overdue_work_items ?? 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {(stats?.overdue_work_items ?? 0) > 0 ? 'Requires immediate action' : 'All tasks on schedule'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Workload & Scheduling Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion</CardTitle>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.avg_completion ?? 0}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats?.completed_work_items ?? 0} items fully complete
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Due This Week</CardTitle>
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.due_this_week ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">In the next 7 days</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned</CardTitle>
                            <CircleSlash className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.unassigned_work_items ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Tasks without an assignee</p>
                        </CardContent>
                    </Card>

                    <Card className={`shadow-xs ${(stats?.blocked_work_items ?? 0) > 0 ? 'border-orange-200 dark:border-orange-900/50 bg-orange-50/30 dark:bg-orange-950/10' : ''}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked Items</CardTitle>
                            <AlertCircle className={`h-4 w-4 ${(stats?.blocked_work_items ?? 0) > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.blocked_work_items ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Waiting on an unfinished predecessor
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress & Distribution Metrics */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Priority Distribution</CardTitle>
                            <CardDescription>Breakdown of active tasks by set urgency</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-rose-600 dark:text-rose-400">High Priority</span>
                                    <span>{stats?.high_priority ?? 0}</span>
                                </div>
                                <Progress value={((stats?.high_priority ?? 0) / totalWork) * 100} className="h-2 bg-rose-100 dark:bg-rose-950 [&>div]:bg-rose-600" />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-amber-600 dark:text-amber-400">Medium Priority</span>
                                    <span>{stats?.medium_priority ?? 0}</span>
                                </div>
                                <Progress value={((stats?.medium_priority ?? 0) / totalWork) * 100} className="h-2 bg-amber-100 dark:bg-amber-950 [&>div]:bg-amber-500" />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-emerald-600 dark:text-emerald-400">Low Priority</span>
                                    <span>{stats?.low_priority ?? 0}</span>
                                </div>
                                <Progress value={((stats?.low_priority ?? 0) / totalWork) * 100} className="h-2 bg-emerald-100 dark:bg-emerald-950 [&>div]:bg-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Status Pipeline</CardTitle>
                            <CardDescription>Work items grouped by current status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {statuses.length > 0 ? (
                                statuses.map((status) => (
                                    <div key={status.name} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>{status.name}</span>
                                            <span className="text-muted-foreground">{status.count}</span>
                                        </div>
                                        <Progress value={(status.count / totalWork) * 100} className="h-2" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">No pipeline statuses configured.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Health & Workload Metrics */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Milestones</CardTitle>
                            <Milestone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-2xl font-bold">{milestones_overview.total ?? 0}</div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="rounded-md bg-emerald-500/10 p-2 text-center">
                                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">{milestones_overview.completed ?? 0}</div>
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

                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Team Workload</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {tasks_per_user.length > 0 ? (
                                tasks_per_user.map((task, index) => (
                                    <div key={task.user_name} className="flex items-center gap-3">
                                        <div className="w-5 text-xs font-semibold text-muted-foreground">{index + 1}</div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="truncate">{task.user_name}</span>
                                                <span className="text-muted-foreground">{task.total}</span>
                                            </div>
                                            <Progress value={(task.total / maxTasks) * 100} className="h-2" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">No assigned tasks to show.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members Per Project</CardTitle>
                            <Flag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {team_distribution.length > 0 ? (
                                team_distribution.map((member) => (
                                    <div key={member.project_name} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="truncate">{member.project_name}</span>
                                            <span className="text-muted-foreground">{member.total}</span>
                                        </div>
                                        <Progress value={(member.total / maxTeamMembers) * 100} className="h-2" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">No team distribution data.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tabbed Interactive Section */}
                <Tabs defaultValue="work_items" className="w-full">
                    <div className="flex items-center justify-between pb-2">
                        <TabsList className="bg-muted/60 p-1">
                            <TabsTrigger value="work_items">Recent Tasks</TabsTrigger>
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            <TabsTrigger value="activity">Audit Activity</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tasks Tab */}
                    <TabsContent value="work_items" className="mt-2">
                        <Card className="shadow-xs">
                            <CardContent className="p-0">
                                {recent_work_items.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {recent_work_items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">{item.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                                                    <Badge variant="outline" className="text-xs">{item.status}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="p-6 text-sm text-center text-muted-foreground">No recent work items.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Projects Tab */}
                    <TabsContent value="projects" className="mt-2">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects_overview.length > 0 ? (
                                projects_overview.map((project) => (
                                    <Card key={project.id} className="shadow-xs hover:border-primary/50 transition-colors">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center justify-between">
                                                {project.name}
                                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {project.description || 'No description provided.'}
                                            </p>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-muted-foreground">Completion</span>
                                                    <span>{project.completion_percentage ?? 0}%</span>
                                                </div>
                                                <Progress value={project.completion_percentage ?? 0} className="h-2" />
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                                                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {project.members_count} Members</span>
                                                <span className="flex items-center gap-1"><CheckSquare className="h-3.5 w-3.5" /> {project.work_items_count} Tasks</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No project data available.</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Activity Log Tab */}
                    <TabsContent value="activity" className="mt-2">
                        <Card className="shadow-xs">
                            <CardContent className="p-6">
                                {recent_activities.length > 0 ? (
                                    <div className="relative pl-6 after:absolute after:inset-y-0 after:left-2.5 after:w-0.5 after:bg-border space-y-6">
                                        {recent_activities.map((activity) => (
                                            <div key={activity.id} className="relative flex items-start gap-4">
                                                <div className="absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                                                    <Activity className="h-3 w-3 text-primary" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {activity.user_name} <span className="text-xs text-muted-foreground font-normal">({activity.event})</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{activity.description || 'System action logged'}</p>
                                                </div>
                                                <div className="text-right text-xs text-muted-foreground">
                                                    <p>{activity.date}</p>
                                                    <p>{activity.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground">No recent activity logged.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

            </div>
        </AppLayout>
    );
}