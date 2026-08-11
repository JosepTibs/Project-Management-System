import { useState, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, CheckSquare, Square } from 'lucide-react';
import type { WorkItem, Status, Group, Member } from '@/pages/projects/show';

interface WorkItemsTableViewProps {
    workItems: WorkItem[];
    projectId: number;
    projectName: string;
    statuses: Status[];
    groups: Group[];
    members: Member[];
}

export function WorkItemsTableView({
    workItems,
    projectId,
    projectName,
    statuses,
    groups,
    members
}: WorkItemsTableViewProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkProgress, setBulkProgress] = useState('');

    const filteredItems = useMemo(() => {
        return workItems.filter((item) => {
            const matchesSearch = !search.trim() ||
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.description?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = !statusFilter || statusFilter === 'all' || String(item.status?.id) === statusFilter;
            const matchesGroup = !groupFilter || groupFilter === 'all' || String(item.group_id) === groupFilter;
            const matchesPriority = !priorityFilter || priorityFilter === 'all' || item.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesGroup && matchesPriority;
        });
    }, [workItems, search, statusFilter, groupFilter, priorityFilter]);

    function toggleSelect(id: number) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
        );
    }

    function toggleSelectAll() {
        if (selectedIds.length === filteredItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map((item) => item.id));
        }
    }

    function handleBulkProgress() {
        if (!bulkProgress || selectedIds.length === 0) return;

        router.patch(
            `/projects/${projectId}/work-items/bulk-progress`,
            {
                work_item_ids: selectedIds,
                progress: Number(bulkProgress),
            },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setBulkProgress('');
                },
            }
        );
    }

    function handleDelete(itemId: number, title: string) {
        if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            router.delete(`/projects/${projectId}/work-items/${itemId}`, { preserveScroll: true });
        }
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search work items..."
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
                                    {statuses.map((s) => (
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
                                    {groups.map((g) => (
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

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                                {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Progress %"
                                    value={bulkProgress}
                                    onChange={(e) => setBulkProgress(e.target.value)}
                                    className="w-32"
                                />
                                <Button onClick={handleBulkProgress} disabled={!bulkProgress}>
                                    Update Progress
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                        <TableHead className="w-12">
                                            <button onClick={toggleSelectAll} className="flex items-center justify-center">
                                                {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                                                    <CheckSquare className="h-4 w-4" />
                                                ) : (
                                                    <Square className="h-4 w-4" />
                                                )}
                                            </button>
                                        </TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assignee</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <button onClick={() => toggleSelect(item.id)} className="flex items-center justify-center">
                                                    {selectedIds.includes(item.id) ? (
                                                        <CheckSquare className="h-4 w-4" />
                                                    ) : (
                                                        <Square className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/projects/${projectId}/work-items/${item.id}`}
                                                    className="hover:underline"
                                                >
                                                    {item.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.priority === 'critical' ? 'destructive' : item.priority === 'high' ? 'default' : item.priority === 'medium' ? 'secondary' : 'outline'}>
                                                    {item.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {item.status && (
                                                    <Badge variant="outline">{item.status.name}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.assignee?.name || '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.due_date}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-secondary rounded-full h-1.5">
                                                        <div
                                                            className="bg-primary rounded-full h-1.5"
                                                            style={{ width: `${item.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground w-8">
                                                        {item.progress}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/projects/${projectId}/work-items/${item.id}/edit`}>
                                                        <Button variant="ghost" size="sm" title="Edit">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        title="Delete"
                                                        onClick={() => handleDelete(item.id, item.title)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            {search || statusFilter || groupFilter || priorityFilter
                                ? 'No work items match the current filters.'
                                : 'No work items yet. Create your first work item!'}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Work Item Button */}
            <div className="flex justify-end">
                <Link href={`/projects/${projectId}/work-items/create`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Work Item
                    </Button>
                </Link>
            </div>
        </div>
    );
}
