import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Check, Trash2, Plus, X, Users, FolderKanban, Target, FileText, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface UserOption {
    id: number;
    username: string;
    fname: string;
    mname: string;
    lname: string;
    sname: string;
    email: string;
}

interface Member {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
}

interface Group {
    id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
}

interface Milestone {
    id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    target_date: string | null;
    order: number;
}

interface Status {
    id: number;
    name: string;
}

interface WorkItemForm {
    id?: number;
    title: string;
    description: string;
    priority: string;
    due_date: string;
    assignee_id: number | null;
    group_id: number | null;
    status_id: number | null;
}

interface SetupPageProps extends Record<string, unknown> {
    project: {
        id: number;
        name: string;
        description: string;
        item_prefix: string;
    };
    allUsers: UserOption[];
    members: Member[];
    workItemGroups: Group[];
    milestones: Milestone[];
    statuses: Status[];
    workItems: WorkItemForm[];
}

export default function ProjectSetup() {
    const { project, allUsers, members: initialMembers, workItemGroups: initialGroups, milestones: initialMilestones, statuses, workItems: initialWorkItems } = usePage<SetupPageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: 'Setup', href: `/projects/${project.id}/setup` },
    ];

    // Members state
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>(initialMembers.map(m => m.user_id));
    const [searchTerm, setSearchTerm] = useState('');

    // Groups state (track id so existing groups can be matched by DB id rather than index)
    const [groups, setGroups] = useState<{ id?: number; name: string; description: string; start_date: string; end_date: string }[]>(
        initialGroups.map(g => ({ id: g.id, name: g.name, description: g.description || '', start_date: g.start_date || '', end_date: g.end_date || '' }))
    );

    // Milestones state (track id so existing milestones can be matched by DB id)
    const [milestones, setMilestones] = useState<{ id?: number; name: string; description: string; start_date: string; target_date: string }[]>(
        initialMilestones.map(m => ({ id: m.id, name: m.name, description: m.description || '', start_date: m.start_date || '', target_date: m.target_date || '' }))
    );

    // Work items state (track id so existing work items can be matched by DB id)
    const [workItems, setWorkItems] = useState<{ id?: number; title: string; description: string; priority: string; due_date: string; assignee_id: number | null; group_id: number | null; status_id: number | null }[]>(
        initialWorkItems.map(w => ({ id: w.id, title: w.title, description: w.description || '', priority: w.priority, due_date: w.due_date || '', assignee_id: w.assignee_id, group_id: w.group_id, status_id: w.status_id }))
    );

    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const filteredUsers = allUsers.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function toggleUser(userId: number) {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    }

    function addGroup() {
        setGroups(prev => [...prev, { name: '', description: '', start_date: '', end_date: '' }]);
    }

    function updateGroup(index: number, field: string, value: string) {
        setGroups(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
    }

    function removeGroup(index: number) {
        setGroups(prev => prev.filter((_, i) => i !== index));
    }

    function addMilestone() {
        setMilestones(prev => [...prev, { name: '', description: '', start_date: '', target_date: '' }]);
    }

    function updateMilestone(index: number, field: string, value: string) {
        setMilestones(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    }

    function removeMilestone(index: number) {
        setMilestones(prev => prev.filter((_, i) => i !== index));
    }

    function addWorkItem() {
        setWorkItems(prev => [...prev, { title: '', description: '', priority: 'medium', due_date: '', assignee_id: null, group_id: null, status_id: statuses[0]?.id || null }]);
    }

    function updateWorkItem(index: number, field: string, value: any) {
        setWorkItems(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
    }

    function removeWorkItem(index: number) {
        setWorkItems(prev => prev.filter((_, i) => i !== index));
    }

    function handleSubmit() {
        setErrorMessage(null);

        const validatedGroups = groups.filter(g => g.name.trim());
        const validatedMilestones = milestones.filter(m => m.name.trim());
        const validatedWorkItems = workItems.filter(w => w.title.trim());

        // Collect warnings
        const warnings: string[] = [];

        const groupItemsNoGroup = validatedWorkItems.filter(w => !w.group_id);
        if (groupItemsNoGroup.length > 0) {
            warnings.push(`${groupItemsNoGroup.length} work item(s) have no group assigned. They won't appear in any group view.`);
        }

        const groupNoDates = validatedGroups.filter(g => !g.start_date || !g.end_date);
        if (groupNoDates.length > 0) {
            warnings.push(`${groupNoDates.length} group(s) are missing start or end dates.`);
        }

        const milestoneNoDates = validatedMilestones.filter(m => !m.start_date || !m.target_date);
        if (milestoneNoDates.length > 0) {
            warnings.push(`${milestoneNoDates.length} milestone(s) are missing start or target dates.`);
        }

        const workItemNoPriority = validatedWorkItems.filter(w => !w.priority);
        if (workItemNoPriority.length > 0) {
            warnings.push(`${workItemNoPriority.length} work item(s) are missing a priority.`);
        }

        if (warnings.length > 0) {
            setErrorMessage(warnings.join(' '));
        }

        setProcessing(true);
        router.put(`/projects/${project.id}/setup`, {
            user_ids: selectedUserIds,
            groups: validatedGroups,
            milestones: validatedMilestones,
            work_items: validatedWorkItems.map(w => ({
                ...w,
                assignee_id: w.assignee_id || null,
                group_id: w.group_id || null,
                status_id: w.status_id || null,
            })),
        }, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Setup: ${project.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Project
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Project Configuration</h1>
                        <p className="text-sm text-muted-foreground">Manage members, work item groups, milestones, and work items for <span className="font-medium">{project.name}</span></p>
                    </div>
                </div>

                {/* Section 1: Members */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-4 w-4" />
                            Members ({selectedUserIds.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {filteredUsers.map(user => {
                                const selected = selectedUserIds.includes(user.id);
                                return (
                                    <Badge
                                        key={user.id}
                                        variant={selected ? 'default' : 'outline'}
                                        className="cursor-pointer px-3 py-1.5"
                                        onClick={() => toggleUser(user.id)}
                                    >
                                        {selected && <Check className="mr-1 h-3 w-3" />}
                                        {user.username}
                                    </Badge>
                                );
                            })}
                        </div>
                        {selectedUserIds.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                                Selected: {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Section 2: Work Item Groups */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FolderKanban className="h-4 w-4" />
                                Work Item Groups ({groups.length})
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={addGroup}>
                                <Plus className="mr-1 h-3 w-3" /> Add Group
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {groups.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No groups yet. Click "Add Group" to create one.</p>
                        ) : (
                            groups.map((group, i) => (
                                <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
                                    <div className="flex-1 min-w-[150px] space-y-1">
                                        <Label className="text-xs">Name</Label>
                                        <Input value={group.name} onChange={e => updateGroup(i, 'name', e.target.value)} placeholder="Group name" />
                                    </div>
                                    <div className="flex-1 min-w-[150px] space-y-1">
                                        <Label className="text-xs">Description</Label>
                                        <Input value={group.description} onChange={e => updateGroup(i, 'description', e.target.value)} placeholder="Optional" />
                                    </div>
                                    <div className="w-36 space-y-1">
                                        <Label className="text-xs">Start</Label>
                                        <Input type="date" value={group.start_date} onChange={e => updateGroup(i, 'start_date', e.target.value)} />
                                    </div>
                                    <div className="w-36 space-y-1">
                                        <Label className="text-xs">End</Label>
                                        <Input type="date" value={group.end_date} onChange={e => updateGroup(i, 'end_date', e.target.value)} />
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeGroup(i)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Section 3: Milestones */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Target className="h-4 w-4" />
                                Milestones ({milestones.length})
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={addMilestone}>
                                <Plus className="mr-1 h-3 w-3" /> Add Milestone
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {milestones.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No milestones yet. Click "Add Milestone" to create one.</p>
                        ) : (
                            milestones.map((milestone, i) => (
                                <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
                                    <div className="flex-1 min-w-[150px] space-y-1">
                                        <Label className="text-xs">Name</Label>
                                        <Input value={milestone.name} onChange={e => updateMilestone(i, 'name', e.target.value)} placeholder="Milestone name" />
                                    </div>
                                    <div className="flex-1 min-w-[150px] space-y-1">
                                        <Label className="text-xs">Description</Label>
                                        <Input value={milestone.description} onChange={e => updateMilestone(i, 'description', e.target.value)} placeholder="Optional" />
                                    </div>
                                    <div className="w-36 space-y-1">
                                        <Label className="text-xs">Start</Label>
                                        <Input type="date" value={milestone.start_date} onChange={e => updateMilestone(i, 'start_date', e.target.value)} />
                                    </div>
                                    <div className="w-36 space-y-1">
                                        <Label className="text-xs">Target</Label>
                                        <Input type="date" value={milestone.target_date} onChange={e => updateMilestone(i, 'target_date', e.target.value)} />
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeMilestone(i)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Section 4: Work Items */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-4 w-4" />
                                Work Items ({workItems.length})
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={addWorkItem}>
                                <Plus className="mr-1 h-3 w-3" /> Add Work Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {workItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No work items yet. Click "Add Work Item" to create one.</p>
                        ) : (
                            workItems.map((item, i) => (
                                <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
                                    <div className="flex-1 min-w-[150px] space-y-1">
                                        <Label className="text-xs">Title</Label>
                                        <Input value={item.title} onChange={e => updateWorkItem(i, 'title', e.target.value)} placeholder="Item title" />
                                    </div>
                                    <div className="flex-1 min-w-[150px] space-y-1">
                                        <Label className="text-xs">Description</Label>
                                        <Input value={item.description} onChange={e => updateWorkItem(i, 'description', e.target.value)} placeholder="Description" />
                                    </div>
                                
                                    <div className="w-28 space-y-1">
                                        <Label className="text-xs">Priority</Label>
                                        <select
                                            value={item.priority}
                                            onChange={e => updateWorkItem(i, 'priority', e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                    <div className="w-36 space-y-1">
                                        <Label className="text-xs">Due Date</Label>
                                        <Input type="date" value={item.due_date} onChange={e => updateWorkItem(i, 'due_date', e.target.value)} />
                                    </div>
                                    <div className="w-40 space-y-1">
                                        <Label className="text-xs">Assignee</Label>
                                        <select
                                            value={item.assignee_id || ''}
                                            onChange={e => updateWorkItem(i, 'assignee_id', e.target.value ? Number(e.target.value) : null)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">Unassigned</option>
                                            {allUsers.filter(u => selectedUserIds.includes(u.id)).map(u => (
                                                <option key={u.id} value={u.id}>{u.username}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-40 space-y-1">
                                        <Label className="text-xs">Group</Label>
                                        <select
                                            value={item.group_id || ''}
                                            onChange={e => updateWorkItem(i, 'group_id', e.target.value ? Number(e.target.value) : null)}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">No group</option>
                                            {groups.filter(g => g.name.trim() && g.id != null).map((g, gi) => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeWorkItem(i)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Warning banner */}
                {errorMessage && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                            <div className="text-sm">{errorMessage}</div>
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link href={`/projects/${project.id}`}>
                        <Button variant="outline">Skip Setup</Button>
                    </Link>
                    <Button onClick={handleSubmit} disabled={processing}>
                        {processing ? 'Saving...' : 'Save & Go to Project'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}