import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, ArrowLeft} from 'lucide-react';
import WorkItemSheet, { type EditWorkItemData } from '@/components/work-items/work-item-sheet';
import { getDueStatus } from '@/lib/project-due';
import { useState, useMemo } from 'react';

interface Status {
    id: number;
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

interface WorkItemData {
    id: number;
    title: string;
    description: string;
    priority: string;
    due_date: string;
    progress: number;
    completed_at?: string | null;
    status_id: number;
    group_id: number;
    assignee_id: number;
    start_date: string | null;
    collaborators: number[];
    status: Status | null;
    group: Group | null;
    assignee: Member | null;
}

interface WorkItemsPageProps extends Record<string, unknown> {
    workItems: WorkItemData[];
    project: { id: number; name: string; item_prefix: string; created_by?: number };
    filters: {
        statuses: Status[];
        groups: Group[];
        members: Member[];
    };
    auth?: {
        roles?: string[];
        user?: { id: number };
    };
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

function ProgressCell({ projectId, item, canEdit }: {
    projectId: number;
    item: WorkItemData;
    canEdit: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(item.progress));
    const clamped = Math.min(100, Math.max(0, item.progress ?? 0));

    const commit = () => {
        const next = Math.max(0, Math.min(100, Math.round(Number(draft) || 0)));
        if (next !== item.progress) {
            router.patch(`/projects/${projectId}/work-items/${item.id}/progress`,
                { progress: next },
                { preserveScroll: true,
                  onSuccess: () => setEditing(false),
                  onError: () => setDraft(String(item.progress)) });
        } else { setDraft(String(item.progress)); setEditing(false); }
    };

    const bar = (
        <>
            <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary rounded-full h-1.5" style={{ width: `${clamped}%` }} />
            </div>
            <span className="text-xs text-muted-foreground w-8 tabular-nums">{clamped}%</span>
        </>
    );

    if (!canEdit) return <div className="flex items-center gap-2">{bar}</div>;

    if (!editing) {
        return (
            <button type="button"
                onClick={() => { setDraft(String(item.progress)); setEditing(true); }}
                title="Click to update progress"
                className="flex items-center gap-2 group">
                {bar}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <Input autoFocus type="number" min={0} max={100} value={draft}
                aria-label={`Progress for ${item.title}`}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
                    if (e.key === 'Escape') { setDraft(String(item.progress)); setEditing(false); }
                }}
                onBlur={commit}
                className="w-16 h-8 text-right text-xs" />
            <span className="text-xs text-muted-foreground">%</span>
        </div>
    );
}

export default function WorkItemsIndex() {
    const { workItems, project, filters, auth } = usePage<WorkItemsPageProps>().props;
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [editingWorkItem, setEditingWorkItem] = useState<WorkItemData | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
;
    // Role tiers: admins manage everything; managers only projects they own;
    // members/unroled users may only progress their own items.
    const userRoles: string[] = (auth?.roles ?? []) as string[];
    const isAdmin = userRoles.some((r) => ['admin', 'superadmin'].includes(r.toLowerCase()));
    const isManager = !isAdmin && userRoles.some((r) => r.toLowerCase().includes('manager'));
    const ownsProject = Number((project as { created_by?: number })?.created_by) === Number(auth?.user?.id);
    const canManageProject = isAdmin || (isManager && ownsProject);
    const canEditProgress = (item: WorkItemData) =>
        canManageProject ||
        Number(item.assignee_id) === Number(auth?.user?.id) ||
        (item.collaborators ?? []).includes(Number(auth?.user?.id));
    // Deletion matches the backend work-item.delete gate: managers anywhere,
    // members only on their own assigned rows.
    const canDelete = (item: WorkItemData) =>
        canManageProject || Number(item.assignee_id) === Number(auth?.user?.id);
    const [progressDrafts, setProgressDrafts] = useState<Record<number, string>>({});

    const filteredItems = useMemo(() => {
        return workItems.filter((item) => {
            const matchesSearch = !search.trim() ||
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.description?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = !statusFilter || statusFilter ==='all' || String(item.status?.id) === statusFilter;
            const matchesGroup = !groupFilter || groupFilter === 'all' || String(item.group?.id) === groupFilter;
            const matchesPriority = !priorityFilter || priorityFilter ==='all' || item.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesGroup && matchesPriority;
        });
    }, [workItems, search, statusFilter, groupFilter, priorityFilter]);

    function commitProgress(item: WorkItemData, value: string) {
        const parsed = Number(value);
        if (value.trim() === '' || Number.isNaN(parsed) || parsed < 0 || parsed > 100 || parsed === item.progress) {
            // Invalid or unchanged — just discard the draft.
            setProgressDrafts((prev) => {
                const next = { ...prev };
                delete next[item.id];
                return next;
            });
            return;
        }

        router.patch(
            `/projects/${project.id}/work-items/bulk-progress`,
            { work_item_ids: [item.id], progress: parsed },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProgressDrafts((prev) => {
                        const next = { ...prev };
                        delete next[item.id];
                        return next;
                    });
                },
            }
        );
    }

    function handleDelete(itemId: number, title: string) {
        if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            router.delete(`/projects/${project.id}/work-items/${itemId}`, { preserveScroll: true });
        }
    }




    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: 'Work Items', href: `/projects/${project.id}/work-items` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Work Items`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{project.name} — Work Items</h1>
                    <div className="ml-auto">
                        <Button onClick={() => { setSheetMode('create'); setEditingWorkItem(null); setSheetOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Work Item
                        </Button>
                    </div>
                </div>

             

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by title or description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="w-full sm:w-40">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        {filters.statuses.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-40">
                                <Select value={groupFilter} onValueChange={setGroupFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All groups" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All groups</SelectItem>
                                        {filters.groups.map((g) => (
                                            <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
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
                                        <TableHead>Status</TableHead>
                                        <TableHead>Group</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Assignee</TableHead>
                                        <TableHead className="sr-only">Actions</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map((item: WorkItemData) => (
                                            <TableRow key={item.id}>
                                                
                                                <TableCell className="font-medium max-w-xs truncate">
                                                   <Link href={`/projects/${project.id}/work-items/${item.id}`}>
                                                   {item.title}
                                                   </Link> 
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.status?.name || '—'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.group?.name || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getPriorityVariant(item.priority)}>
                                                        {item.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <ProgressCell projectId={project.id} item={item} canEdit={canEditProgress(item)} />
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    {(() => {
                                                        const { label, className } = getDueStatus(item.due_date, item.progress, item.completed_at);
                                                        return (
                                                            <span
                                                                title={item.due_date ? `Due ${label}` : 'No due date'}
                                                                className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                    item.due_date ? className : 'text-muted-foreground'
                                                                }`}
                                                            >
                                                                {label}
                                                            </span>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.assignee?.name || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        {canManageProject && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                title="Edit"
                                                                onClick={() => { setEditingWorkItem(item); setSheetMode('edit'); setSheetOpen(true); }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {canDelete(item) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            title="Delete"
                                                            onClick={() => handleDelete(item.id, item.title)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                {search || statusFilter || groupFilter || priorityFilter
                                    ? 'No work items match the current filters.'
                                    : 'No work items yet. Create your first work item!'}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <WorkItemSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                mode={sheetMode}
                project={{ id: project.id, item_prefix: project.item_prefix }}
                members={filters.members}
                statuses={filters.statuses}
                groups={filters.groups}
                workItemId={editingWorkItem?.id}
                initialWorkItem={editingWorkItem ?? undefined}
                onSuccess={() => setSheetOpen(false)}
            />
        </AppLayout>
    );
}