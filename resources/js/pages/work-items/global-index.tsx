import { confirmRequest } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import WorkItemSheet, { type EditWorkItemData } from '@/components/work-items/work-item-sheet';
import AppLayout from '@/layouts/app-layout';
import { getDueStatus } from '@/lib/project-due';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ExternalLink, MoreHorizontal, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Status {
    id?: number;
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
    item_prefix?: string;
    end_date?: string | null;
    created_by?: number;
}

interface WorkItemData {
    id: number;
    title: string;
    priority: string;
    progress: number;
    start_date?: string | null;
    due_date: string | null;
    status_id?: number | null;
    group_id?: number | null;
    assignee_id?: number | null;
    collaborator_ids?: number[];
    status: Status | null;
    group: Group | null;
    assignee: Member | null;
    project: ProjectRef | null;
    archived?: boolean;
}

interface ProjectContext {
    project: { id: number; name: string; item_prefix?: string };
    statuses: { id: number; name: string }[];
    groups: { id: number; name: string }[];
    members: Member[];
}

interface GlobalWorkItemsPageProps extends Record<string, unknown> {
    workItems: WorkItemData[];
    archived?: boolean;
    pageTitle: string;
    filters: {
        projects: ProjectRef[];
        statuses: Status[];
    };
    projectContexts?: Record<string, ProjectContext>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Work Items',
        href: '/work-items',
    },
];

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'critical':
            return 'destructive' as const;
        case 'high':
            return 'default' as const;
        case 'medium':
            return 'secondary' as const;
        case 'low':
            return 'outline' as const;
        default:
            return 'outline' as const;
    }
}

async function handleDelete(projectId: number, workItemId: number, title?: string) {
    const ok = await confirmRequest({
        title: title ? `Delete "${title}"?` : 'Delete work item?',
        description: 'This work item will be permanently removed. This action cannot be undone.',
        confirmLabel: 'Delete work item',
    });

    if (ok) {
        router.delete(`/projects/${projectId}/work-items/${workItemId}`, { preserveScroll: true });
    }
}

function handleArchive(workItemId: number) {
    router.post(`/work-items/${workItemId}/archive`, {}, { preserveScroll: true });
}

function handleRestore(workItemId: number) {
    router.post(`/work-items/${workItemId}/restore`, {}, { preserveScroll: true });
}

function setArchivedView(archived: boolean) {
    router.get('/work-items', { archived: archived ? '1' : '0' }, { preserveState: true, replace: true });
}

/**
 * Inline progress editor for rows the current user may update (managers, or
 * members on their own/collaborated items). Number input commits via the
 * progress-only endpoint on blur/Enter.
 */
function InlineProgress({ projectId, itemId, value }: { projectId: number; itemId: number; value: number }) {
    const [draft, setDraft] = useState<string>(String(value));
    const [saving, setSaving] = useState(false);

    useEffect(() => setDraft(String(value)), [value]);

    const parsed = Number(draft);
    const commit = () => {
        const next = Math.max(0, Math.min(100, Math.round(parsed || 0)));
        if (next === value) {
            setDraft(String(value));
            return;
        }
        setSaving(true);
        router.patch(
            `/projects/${projectId}/work-items/${itemId}/progress`,
            { progress: next },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => router.reload({ only: ['workItems'] }),
                onError: () => setDraft(String(value)),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <Input
                type="number"
                min={0}
                max={100}
                disabled={saving}
                aria-label="Progress percentage"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        (e.target as HTMLInputElement).blur();
                        commit();
                    }
                    if (e.key === 'Escape') setDraft(String(value));
                }}
                onBlur={commit}
                className="h-7 w-14 text-right text-xs tabular-nums"
            />
            <span className="text-muted-foreground w-9 text-xs">%</span>
        </div>
    );
}

/** Debounced value: updates `delayMs` after `value` stops changing. */
function useDebounced<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
}

export default function GlobalWorkItemsIndex() {
    const { workItems, archived = false, filters, projectContexts = {}, pageTitle = 'All Work Items' } = usePage<GlobalWorkItemsPageProps>().props;
    // Editing, deletion, and archiving are role/ownership-scoped: members may
    // only act on items they own (delete/archive) or share as a collaborator
    // (progress), while admins/managers may do everything.
    const userRoles: string[] = ((usePage<any>().props.auth as any)?.roles ?? []) as string[];
    const isAdminLevel = userRoles.some((r) => ['admin', 'superadmin'].includes(r.toLowerCase()));
    const isManagerRole = !isAdminLevel && userRoles.some((r) => r.toLowerCase().includes('manager'));
    // Entry points for creating projects/items (managers may create their own).
    const canManageWorkItems = !userRoles.includes('member');
    const authUserId = Number(usePage<any>().props.auth?.user?.id ?? null);
    const isAssignee = (item: WorkItemData) => Number(item.assignee_id) === authUserId;
    const isCollaborator = (item: WorkItemData) => (item.collaborator_ids ?? []).some((id) => Number(id) === authUserId);
    // Full edit/delete/archive: admins anywhere; managers only inside
    // projects they own; members only on rows assigned to them.
    const canEditRow = (item: WorkItemData) => isAdminLevel || (isManagerRole && Number(item.project?.created_by) === authUserId);
    const canActOnRow = (item: WorkItemData) => canEditRow(item) || isAssignee(item);
    const canEditRowProgress = (item: WorkItemData) => canManageWorkItems || isAssignee(item) || isCollaborator(item);
    // View scope for managers: only items assigned to them or under projects
    // they own. Defense-in-depth alongside the backend query scope.
    const managerMayView = (item: WorkItemData) => isAssignee(item) || Number(item.project?.created_by) === authUserId;
    const [search, setSearch] = useState('');
    const [projectFilter, setProjectFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [page, setPage] = useState(0);
    const debouncedSearch = useDebounced(search, 300);
    const PAGE_SIZE = 50;
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ item: WorkItemData; context: ProjectContext } | null>(null);
    const [createContext, setCreateContext] = useState<ProjectContext | null>(null);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);

    function openEdit(item: WorkItemData) {
        const context = item.project ? projectContexts[String(item.project.id)] : undefined;
        if (!context) return;
        setEditingItem({ item, context });
        setSheetOpen(true);
    }

    function buildInitialWorkItem(item: WorkItemData): EditWorkItemData {
        return {
            id: item.id,
            title: item.title,
            description: '',
            status_id: item.status_id ?? item.status?.id ?? '',
            group_id: item.group_id ?? item.group?.id ?? '',
            assignee_id: item.assignee_id ?? item.assignee?.id ?? '',
            collaborators: [],
            priority: item.priority,
            progress: item.progress,
            start_date: item.start_date ?? null,
            due_date: item.due_date ?? '',
        };
    }

    const filteredItems = useMemo(() => {
        return workItems
            .filter((item) => !isManagerRole || managerMayView(item))
            .filter((item) => {
                const matchesSearch = !debouncedSearch.trim() || item.title.toLowerCase().includes(debouncedSearch.toLowerCase());

                const matchesProject = !projectFilter || projectFilter === 'all' || String(item.project?.id) === projectFilter;
                const matchesStatus = !statusFilter || statusFilter === 'all' || item.status?.name === statusFilter;
                const matchesPriority = !priorityFilter || priorityFilter === 'all' || item.priority === priorityFilter;

                return matchesSearch && matchesProject && matchesStatus && matchesPriority;
            });
    }, [workItems, debouncedSearch, projectFilter, statusFilter, priorityFilter, isManagerRole]);

    // Client-side pagination: render at most PAGE_SIZE rows so the table stays
    // fast regardless of how many items match.
    const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const visibleItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    // Any filter change (including settled search text) restarts paging.
    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, projectFilter, statusFilter, priorityFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Work Items" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{pageTitle}</h1>
                    <div className="flex items-center gap-2">
                        {canManageWorkItems && (
                            <Button variant="outline" size="sm" onClick={() => setCreateProjectOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Work Item
                            </Button>
                        )}
                        {canManageWorkItems && (
                            <Button variant="outline" size="sm" onClick={() => setArchivedView(!archived)}>
                                {archived ? 'View Active' : 'View Archived'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                            </div>
                            <div className="w-full sm:w-44">
                                <Select value={projectFilter} onValueChange={setProjectFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All projects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All projects</SelectItem>
                                        {filters.projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
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
                                            <SelectItem key={s.name} value={s.name}>
                                                {s.name}
                                            </SelectItem>
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
                                            <TableHead>Progress</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Assignee</TableHead>
                                            <TableHead className="sr-only">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleItems.map((item: WorkItemData) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="max-w-xs truncate leading-tight font-medium hover:underline">
                                                    <Link href={`/projects/${item.project?.id}/work-items/${item.id}?from=all`}>{item.title} </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/projects/${item.project?.id}`}
                                                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm hover:underline"
                                                    >
                                                        {item.project?.name || '—'}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.status?.name || '—'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getPriorityVariant(item.priority)}>{item.priority}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-secondary h-1.5 w-16 overflow-hidden rounded-full">
                                                            <div
                                                                className="bg-primary h-1.5 rounded-full transition-all"
                                                                style={{ width: `${Math.min(100, item.progress ?? 0)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-muted-foreground text-[10px] tabular-nums">
                                                            {Math.min(100, item.progress ?? 0)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {(() => {
                                                        const dueRef = item.due_date || item.project?.end_date || null;
                                                        const { label, className } = getDueStatus(dueRef, item.progress);
                                                        return (
                                                            <span
                                                                title={
                                                                    item.due_date
                                                                        ? `Due ${label}`
                                                                        : dueRef
                                                                          ? `No item due date — using project end date (${dueRef})`
                                                                          : 'No due date'
                                                                }
                                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                                                                    dueRef ? className : 'text-muted-foreground'
                                                                }`}
                                                            >
                                                                {label}
                                                            </span>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    <Link
                                                        href={`/users/${item.assignee?.id}`}
                                                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm hover:underline"
                                                    >
                                                        {item.assignee?.name || '—'} <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex justify-end">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" title="Actions">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/projects/${item.project?.id}/work-items/${item.id}?from=all`}>
                                                                        View
                                                                    </Link>
                                                                </DropdownMenuItem>

                                                                {canEditRow(item) && (
                                                                    <DropdownMenuItem
                                                                        disabled={!projectContexts[String(item.project?.id ?? '')]}
                                                                        onClick={() => openEdit(item)}
                                                                    >
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {item.archived
                                                                    ? canActOnRow(item) && (
                                                                          <DropdownMenuItem onClick={() => handleRestore(item.id)}>
                                                                              Restore
                                                                          </DropdownMenuItem>
                                                                      )
                                                                    : canActOnRow(item) && (
                                                                          <DropdownMenuItem onClick={() => handleArchive(item.id)}>
                                                                              Archive
                                                                          </DropdownMenuItem>
                                                                      )}
                                                                <DropdownMenuSeparator />
                                                                {canActOnRow(item) && (
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-700"
                                                                        onClick={() => handleDelete(item.project!.id, item.id)}
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-muted-foreground py-8 text-center text-sm">
                                {search || projectFilter || statusFilter || priorityFilter
                                    ? 'No work items match the current filters.'
                                    : 'No work items found.'}
                            </div>
                        )}

                        {/* Pager — only when there is more than one page */}
                        {filteredItems.length > PAGE_SIZE && (
                            <div className="mt-4 flex items-center justify-between border-t pt-3">
                                <p className="text-muted-foreground text-sm">
                                    Showing {page * PAGE_SIZE + 1}&ndash;
                                    {Math.min((page + 1) * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                                        Previous
                                    </Button>
                                    <span className="text-sm tabular-nums">
                                        Page {page + 1} of {pageCount}
                                    </span>
                                    <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit sheet — scoped to the row's own project context */}
            {editingItem && (
                <WorkItemSheet
                    open={sheetOpen}
                    onOpenChange={(open) => {
                        setSheetOpen(open);
                        if (!open) setEditingItem(null);
                    }}
                    mode="edit"
                    project={{
                        id: editingItem.context.project.id,
                        item_prefix: editingItem.context.project.item_prefix ?? '',
                    }}
                    members={editingItem.context.members}
                    statuses={editingItem.context.statuses}
                    groups={editingItem.context.groups}
                    workItemId={editingItem.item.id}
                    initialWorkItem={buildInitialWorkItem(editingItem.item)}
                    onSuccess={() => router.reload({ only: ['workItems'] })}
                />
            )}

            {/* Create sheet — pick a project first, then use that project's context */}
            <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add work item</DialogTitle>
                        <DialogDescription>Choose which project this work item belongs to.</DialogDescription>
                    </DialogHeader>
                    <Select
                        onValueChange={(value) => {
                            const context = projectContexts[value];
                            if (!context) return;
                            setCreateContext(context);
                            setCreateProjectOpen(false);
                            setSheetOpen(true);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(projectContexts).map((context) => (
                                <SelectItem key={context.project.id} value={String(context.project.id)}>
                                    {context.project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateProjectOpen(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {createContext && (
                <WorkItemSheet
                    open={sheetOpen}
                    onOpenChange={(open) => {
                        setSheetOpen(open);
                        if (!open) setCreateContext(null);
                    }}
                    mode="create"
                    project={{
                        id: createContext.project.id,
                        item_prefix: createContext.project.item_prefix ?? '',
                    }}
                    members={createContext.members}
                    statuses={createContext.statuses}
                    groups={createContext.groups}
                    onSuccess={() => router.reload({ only: ['workItems'] })}
                />
            )}
        </AppLayout>
    );
}
