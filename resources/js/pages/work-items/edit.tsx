import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, useState } from 'react';

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
    status_id: number;
    group_id: number;
    assignee_id: number;
    priority: string;
    start_date: string | null;
    due_date: string;
    progress: number;
}

interface EditWorkItemPageProps extends Record<string, unknown> {
    project: { id: number; name: string };
    workItem: WorkItemData;
    statuses: Status[];
    groups: Group[];
    members: Member[];
}

export default function EditWorkItem() {
    const { project, workItem, statuses, groups, members } = usePage<EditWorkItemPageProps>().props;

    const [title, setTitle] = useState(workItem.title);
    const [description, setDescription] = useState(workItem.description);
            const [statusId, setStatusId] = useState(workItem.status_id ? String(workItem.status_id) : '');
    const [groupId, setGroupId] = useState(workItem.group_id ? String(workItem.group_id) : 'none');
    const [assigneeId, setAssigneeId] = useState(workItem.assignee_id ? String(workItem.assignee_id) : 'none');
    const [priority, setPriority] = useState(workItem.priority);
    const [startDate, setStartDate] = useState(workItem.start_date ?? '');
    const [progress, setProgress] = useState(String(workItem.progress));
    const [dueDate, setDueDate] = useState(workItem.due_date);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: 'Work Items', href: `/projects/${project.id}/work-items` },
        { title: workItem.title, href: '#' },
    ];

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);

        router.put(`/projects/${project.id}/work-items/${workItem.id}`, {
            title,
            description,
            status_id: statusId,
            group_id: groupId === 'none' || groupId === '' ? null : Number(groupId),
            assignee_id: assigneeId === 'none' || assigneeId === '' ? null : Number(assigneeId),
            priority,
            progress: Number(progress),
            start_date: startDate || null,
            due_date: dueDate,
        }, {
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${workItem.title}`} />
            <div className="flex h-full flex-1 flex-col items-center gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4 self-start">
                    <Link href={`/projects/${project.id}/work-items/${workItem.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Work Item</h1>
                </div>

                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Work Item Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Implement login feature"
                                />
                                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                    placeholder="Describe the work item..."
                                    rows={4}
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={statusId} onValueChange={setStatusId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.status_id && <p className="text-sm text-red-600">{errors.status_id}</p>}
                                </div>

                                {/* Group */}
                                <div className="space-y-2">
                                    <Label htmlFor="group">Group</Label>
                                    <Select value={groupId} onValueChange={setGroupId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No group (ungrouped)</SelectItem>
                                            {groups.map((g) => (
                                                <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.group_id && <p className="text-sm text-red-600">{errors.group_id}</p>}
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.priority && <p className="text-sm text-red-600">{errors.priority}</p>}
                                </div>

                                {/* Assignee */}
                                <div className="space-y-2">
                                    <Label htmlFor="assignee">Assignee</Label>
                                    <Select value={assigneeId} onValueChange={setAssigneeId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Unassigned</SelectItem>
                                            {members.map((m) => (
                                                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.assignee_id && <p className="text-sm text-red-600">{errors.assignee_id}</p>}
                                </div>

                                {/* Progress */}
                                <div className="space-y-2">
                                    <Label htmlFor="progress">Progress (%)</Label>
                                    <Input
                                        id="progress"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={progress}
                                        onChange={(e) => setProgress(e.target.value)}
                                        placeholder="0"
                                    />
                                    {errors.progress && <p className="text-sm text-red-600">{errors.progress}</p>}
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                    {errors.due_date && <p className="text-sm text-red-600">{errors.due_date}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Link href={`/projects/${project.id}/work-items`}>
                                    <Button variant="outline" type="button">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}