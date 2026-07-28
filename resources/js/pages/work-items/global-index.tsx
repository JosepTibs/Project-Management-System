import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, ExternalLink, Edit } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Status {
    name: string;
}

interface Group {
    id: number;
    name: string;
}

interface Member {
    id: number;
    name: string;
}

interface ProjectRef {
    id: number;
    name: string;
}

interface WorkItemData {
    id: number;
    title: string;
    priority: string;
    due_date: string;
    status: Status | null;
    group: Group | null;
    assignee: Member | null;
    project: ProjectRef | null;
}

interface GlobalWorkItemsPageProps extends Record<string, unknown> {
    workItems: WorkItemData[];
    filters: {
        projects: ProjectRef[];
        statuses: Status[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Work Items',
        href: '/work-items',
    },
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

export default function GlobalWorkItemsIndex() {
    const { workItems, filters } = usePage<GlobalWorkItemsPageProps>().props;
    const [search, setSearch] = useState('');
    const [projectFilter, setProjectFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const filteredItems = useMemo(() => {
        return workItems.filter((item) => {
            const matchesSearch = !search.trim() ||
                item.title.toLowerCase().includes(search.toLowerCase());

            const matchesProject = !projectFilter || projectFilter === 'all' || String(item.project?.id) === projectFilter;
            const matchesStatus = !statusFilter || statusFilter === 'all' || item.status?.name === statusFilter;
            const matchesPriority = !priorityFilter || priorityFilter === 'all' || item.priority === priorityFilter;

            return matchesSearch && matchesProject && matchesStatus && matchesPriority;
        });
    }, [workItems, search, projectFilter, statusFilter, priorityFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Work Items" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">All Work Items</h1>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="w-full sm:w-44">
                                <Select value={projectFilter} onValueChange={setProjectFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All projects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All projects</SelectItem>
                                        {filters.projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-40">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        {filters.statuses.map((s) => (
                                            <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-40">
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All priorities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All priorities</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Work Items ({filteredItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Assignee</TableHead>
                                            <TableHead className="sr-only">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map((item: WorkItemData) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium max-w-xs truncate hover:underline leading-tight">
                                                    <Link href={`/projects/${item.project?.id}/work-items/${item.id}`}>
                                                    {item.title} </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/projects/${item.project?.id}`}
                                                        className="text-sm text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"
                                                    >
                                                        {item.project?.name || '—'}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {item.status?.name || '—'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getPriorityVariant(item.priority)}>
                                                        {item.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.due_date}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                   
                                                    {item.assignee?.name || '—'}
                                                    
                                                </TableCell>
                                               
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/projects/${item.project?.id}/work-items/${item.id}`}>
                                                            <Button variant="outline" size="sm" title="View">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/projects/${item.project?.id}/work-items/${item.id}/edit`}>
                                                            <Button variant="outline" size="sm" title="Edit">
                                                                <Edit className="h-4 w-4" />
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
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                {search || projectFilter || statusFilter || priorityFilter
                                    ? 'No work items match the current filters.'
                                    : 'No work items found.'}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}