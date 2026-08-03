import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, ChevronDown, ChevronRight, Plus, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface Status {
    id: number;
    name: string;
}

interface WorkItem {
    id: number;
    title: string;
    priority: string;
    due_date: string;
    progress: number;
    status: Status | null;
    assignee: { name: string } | null;
}

interface Group {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    milestone_id: number | null;
    milestone?: { id: number; name: string } | null;
    completion_percentage: number;
    items_count: number;
    work_items: WorkItem[];
}

interface GroupsPageProps extends Record<string, unknown> {
    project: { id: number; name: string };
    groups: Group[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Groups', href: '#' },
];

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'critical': return 'destructive' as const;
        case 'high': return 'default' as const;
        case 'medium': return 'secondary' as const;
        case 'low': return 'outline' as const;
        default: return 'outline' as const;
    }
}

export default function GroupsIndex() {
    const { project, groups } = usePage<GroupsPageProps>().props;
    const [expandedGroups, setExpandedGroups] = useState<number[]>([]);

    function toggleGroup(groupId: number) {
        setExpandedGroups((prev) =>
            prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Work Item Groups`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{project.name} — Work Item Groups</h1>
                    <div className="ml-auto">
                        <Link href={`/projects/${project.id}/work-items/create`}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Work Item
                            </Button>
                        </Link>
                    </div>
                </div>

                {groups.length > 0 ? (
                    <div className="space-y-4">
                        {groups.map((group: Group) => {
                            const isExpanded = expandedGroups.includes(group.id);
                            return (
                                <Card key={group.id}>
                                    <CardHeader className="cursor-pointer" onClick={() => toggleGroup(group.id)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                <div>
                                                    <CardTitle className="text-base">{group.name}</CardTitle>
                                                    {group.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {group.items_count} {group.items_count === 1 ? 'item' : 'items'}
                                                </span>
                                                <div className="w-32">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-muted-foreground">Progress</span>
                                                        <span className="font-medium">{Math.round(group.completion_percentage)}%</span>
                                                    </div>
                                                    <div className="w-full bg-secondary rounded-full h-1.5">
                                                        <div
                                                            className="bg-primary rounded-full h-1.5 transition-all"
                                                            style={{ width: `${group.completion_percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    {isExpanded && (
                                        <CardContent>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                                {group.start_date && <span>Start: {group.start_date}</span>}
                                                {group.start_date && group.end_date && <span>→</span>}
                                                {group.end_date && <span>End: {group.end_date}</span>}
                                                {group.milestone_id && <span>• Milestone: {group.milestone?.name || '—'}</span>}
                                            </div>
                                            {group.work_items.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Title</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Priority</TableHead>
                                                                <TableHead>Progress</TableHead>
                                                                <TableHead>Due Date</TableHead>
                                                                <TableHead>Assignee</TableHead>
                                                                <TableHead className="sr-only">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {group.work_items.map((item: WorkItem) => (
                                                                <TableRow key={item.id}>
                                                                    <TableCell className="font-medium max-w-xs truncate">
                                                                        {item.title}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline">{item.status?.name || '—'}</Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={getPriorityVariant(item.priority)}>
                                                                            {item.priority}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-16 bg-secondary rounded-full h-1.5">
                                                                                <div
                                                                                    className="bg-primary rounded-full h-1.5"
                                                                                    style={{ width: `${item.progress ?? 0}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs text-muted-foreground w-8">
                                                                                {item.progress ?? 0}%
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-muted-foreground">
                                                                        {item.due_date}
                                                                    </TableCell>
                                                                    <TableCell className="text-muted-foreground">
                                                                        {item.assignee?.name || '—'}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex justify-end gap-2">
                                                                            <Link href={`/projects/${project.id}/work-items/${item.id}/edit`}>
                                                                                <Button variant="outline" size="sm" title="Edit">
                                                                                    <ExternalLink className="h-4 w-4" />
                                                                                </Button>
                                                                            </Link>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <p className="py-4 text-center text-sm text-muted-foreground">
                                                    No work items in this group yet.
                                                </p>
                                            )}
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">No work item groups yet. Set them up in the project setup page.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}