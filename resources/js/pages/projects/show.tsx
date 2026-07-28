import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Users, FileText, Edit, Target, ChevronDown, BarChart3, Columns3 } from 'lucide-react';
import { GanttChart } from '@/components/gantt-chart';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Member {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
}

interface WorkItem {
    id: number;
    title: string;
    priority: string;
    due_date: string;
    group_id: number | null;
}

interface Milestone {
    id: number;
    name: string;
    description: string;
    start_date: string;
    target_date: string;
    completed_at: string | null;
    completion_percentage: number;
    order: number;
}

interface WorkItemGroup {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    milestone_id: number | null;
    work_items: WorkItem[];
}

interface ProjectData {
    id: number;
    name: string;
    description: string;
    item_prefix: string;
    created_by: number;
    creator_name: string;
    completion_percentage: number;
    members: Member[];
    work_items: WorkItem[];
    milestones: Milestone[];
    work_item_groups: WorkItemGroup[];
}

interface ShowProjectPageProps extends Record<string, unknown> {
    project: ProjectData;
}

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'critical': return 'destructive' as const;
        case 'high': return 'default' as const;
        case 'medium': return 'secondary' as const;
        case 'low': return 'outline' as const;
        default: return 'outline' as const;
    }
}

export default function ShowProject() {
    const { project } = usePage<ShowProjectPageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href="/projects">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                    <div className="ml-auto flex items-center gap-2">
                        <Link href={`/projects/${project.id}/setup`}>
                            <Button variant="default" size="sm">
                                <Users className="mr-2 h-4 w-4" />
                                Setup
                            </Button>
                        </Link>
                        <Link href={`/projects/${project.id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Project Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-muted-foreground">Name</dt>
                                <dd className="font-medium">{project.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Created By</dt>
                                <dd className="font-medium">{project.creator_name || 'Unknown'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Item Prefix</dt>
                                <dd className="font-mono text-sm">{project.item_prefix}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-muted-foreground">Description</dt>
                                <dd className="text-muted-foreground">{project.description || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground mb-2">Completion</dt>
                                <dd>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">{Math.round(Math.min(100, project.completion_percentage))}%</span>
                                    </div>
                                    <div className="w-1/3 min-w-[160px] bg-secondary rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all"
                                            style={{ width: `${Math.min(100, project.completion_percentage)}%` }}
                                        />
                                    </div>
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Members */}
                    <Card>
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4" />
                                Members ({project.members.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {project.members.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {project.members.map((member: Member) => (
                                                <TableRow key={member.id}>
                                                     <TableCell className="text-sm font-medium">
                                                         <Link href={`/users/${member.id}/edit`} className="text-lg font-medium hover:underline leading-tight">
                                                             {member.user_name}
                                                         </Link>
                                                     </TableCell>
                                                     <TableCell className="text-muted-foreground">{member.user_email}</TableCell>
                                                 </TableRow>
                                             ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <p className="py-2 text-center text-sm text-muted-foreground">No members assigned yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Work Items */}
                    <Card>
                        <CardHeader className="p-4 pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    Work Items ({project.work_items.length})
                                </CardTitle>
                                <div className="flex items-center gap-2">
                        <Link href={`/projects/${project.id}/kanban`}>
                            <Button variant="outline" size="sm">
                                <Columns3 className="mr-1.5 h-4 w-4" />
                                Kanban
                            </Button>
                        </Link>
                        <Link href={`/projects/${project.id}/work-items`}>
                            <Button variant="outline" size="sm">View All</Button>
                        </Link>
                        <Link href={`/projects/${project.id}/groups`}>
                            <Button variant="outline" size="sm">Groups</Button>
                        </Link>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            {project.work_items.length > 0 ? (
                                <div className="space-y-3">
                                    {project.work_item_groups.map((group) => {
                                        const groupItems = project.work_items.filter((item) => item.group_id === group.id);
                                        if (groupItems.length === 0) return null;
                                        return (
                                            <Collapsible key={group.id} defaultOpen={true}>
                                                <div className="rounded-lg border">
                                                    <CollapsibleTrigger asChild>
                                                        <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors select-none">
                                                            <div className="flex items-center gap-2">
                                                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                                                                <span className="text-sm font-medium">{group.name}</span>
                                                                <span className="text-xs text-muted-foreground">({groupItems.length})</span>
                                                            </div>
                                                            {group.end_date && (
                                                                <span className="text-xs text-muted-foreground">Due {group.end_date}</span>
                                                            )}
                                                        </div>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="overflow-x-auto border-t">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Title</TableHead>
                                                                        <TableHead>Priority</TableHead>
                                                                        <TableHead>Due Date</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                     {groupItems.map((item: WorkItem) => (
                                                                         <TableRow key={item.id}>
                                                                             <TableCell className="text-sm font-medium">
                                                                                 <Link href={`/projects/${project.id}/work-items/${item.id}`} className="text-lg font-medium hover:underline leading-tight">
                                                                                     {item.title}
                                                                                 </Link>
                                                                             </TableCell>
                                                                             <TableCell>
                                                                                 <Badge variant={getPriorityVariant(item.priority)}>
                                                                                     {item.priority}
                                                                                 </Badge>
                                                                             </TableCell>
                                                                             <TableCell className="text-muted-foreground">{item.due_date}</TableCell>
                                                                         </TableRow>
                                                                     ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </CollapsibleContent>
                                                </div>
                                            </Collapsible>
                                        );
                                    })}
                                    {project.work_items.filter((item) => item.group_id === null).length > 0 && (
                                        <div className="rounded-lg border">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                                                <span className="text-sm font-medium">Ungrouped</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({project.work_items.filter((item) => item.group_id === null).length})
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto border-t">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Title</TableHead>
                                                            <TableHead>Priority</TableHead>
                                                            <TableHead>Due Date</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {project.work_items.filter((item) => item.group_id === null).map((item: WorkItem) => (
                                                            <TableRow key={item.id}>
                                                                <TableCell className="font-medium">{item.title}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant={getPriorityVariant(item.priority)}>
                                                                        {item.priority}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground">{item.due_date}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="py-2 text-center text-sm text-muted-foreground">No work items yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Milestones */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Target className="h-4 w-4" />
                            Milestones ({project.milestones.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {project.milestones.length > 0 ? (
                            <div className="space-y-2">
                                {project.milestones
                                    .sort((a, b) => a.order - b.order)
                                    .map((milestone) => (
                                    <div key={milestone.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-3">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <h4 className="text-sm font-medium truncate">{milestone.name}</h4>
                                            <Badge variant={milestone.completed_at && Math.round(Math.min(100, milestone.completion_percentage)) >= 100 ? 'default' : 'secondary'} className="text-[10px] h-5 shrink-0">
                                                {milestone.completed_at && Math.round(Math.min(100, milestone.completion_percentage)) >= 100 ? 'Done' : 'Active'}
                                            </Badge>
                                        </div>
                                        <p className="hidden sm:block text-xs text-muted-foreground truncate max-w-[200px]">{milestone.description}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                            <span>{milestone.start_date}</span>
                                            <span>→</span>
                                            <span>{milestone.target_date}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 w-32">
                                            <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(Math.min(100, milestone.completion_percentage))}%</span>
                                            <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-primary rounded-full h-1.5 transition-all"
                                                    style={{ width: `${Math.min(100, milestone.completion_percentage)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-2 text-center text-sm text-muted-foreground">No milestones yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Gantt Chart */}
                <Collapsible defaultOpen={false}>
                    <Card>
                        <CollapsibleTrigger asChild>
                            <CardHeader className="p-4 cursor-pointer hover:bg-muted/50 transition-colors select-none">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <BarChart3 className="h-4 w-4" />
                                        Project Timeline
                                    </CardTitle>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                                </div>
                            </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <CardContent className="p-4 pt-0">
                                <GanttChart 
                                    milestones={project.milestones}
                                    workItemGroups={project.work_item_groups}
                                />
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            </div>
        </AppLayout>
    );
}