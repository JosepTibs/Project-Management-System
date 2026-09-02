import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FormEvent, useEffect, useState, ChangeEvent } from 'react';

export interface Member {
    id: number;
    name: string;
}

export interface WorkItemSheetOption {
    id: number;
    name: string;
}

export interface EditWorkItemData {
    id?: number;
    title: string;
    description: string;
    status_id: number | string;
    group_id: number | string;
    assignee_id: number | string;
    collaborators: number[];
    priority: string;
    progress: number | string;
    start_date: string | null;
    due_date: string;
}

interface WorkItemSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: 'create' | 'edit';
    project: { id: number; item_prefix: string };
    members: Member[];
    statuses: WorkItemSheetOption[];
    groups: WorkItemSheetOption[];
    workItemId?: number;
    initialWorkItem?: EditWorkItemData;
    onSuccess?: () => void;
}

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function WorkItemSheet({
    open,
    onOpenChange,
    mode = 'create',
    project,
    members,
    statuses,
    groups,
    workItemId,
    initialWorkItem,
    onSuccess,
}: WorkItemSheetProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [statusId, setStatusId] = useState('');
    const [groupId, setGroupId] = useState('');
    const [priority, setPriority] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [collaborators, setCollaborators] = useState<number[]>([]);
    const [progress, setProgress] = useState('0');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);


        const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
    
        // If current end date is before the new start date, clear it
        if (dueDate && dueDate < newStartDate) {
          setDueDate('');
        }
        };
    
        const handleDueDateChange = (e: ChangeEvent<HTMLInputElement>) => {
          setDueDate(e.target.value);
        };
        
    // Reset (create) or pre-fill (edit) the form when the sheet opens.
    useEffect(() => {
        if (!open) return;

        if (mode === 'edit' && initialWorkItem) {
            setTitle(initialWorkItem.title ?? '');
            setDescription(initialWorkItem.description ?? '');
            setStatusId(String(initialWorkItem.status_id ?? ''));
            setGroupId(initialWorkItem.group_id ? String(initialWorkItem.group_id) : 'none');
            setPriority(initialWorkItem.priority ?? '');
            setAssigneeId(initialWorkItem.assignee_id ? String(initialWorkItem.assignee_id) : 'none');
            setCollaborators(initialWorkItem.collaborators ?? []);
            setProgress(String(initialWorkItem.progress ?? 0));
            setStartDate(initialWorkItem.start_date ?? '');
            setDueDate(initialWorkItem.due_date ?? '');
        } else {
            setTitle('');
            setDescription('');
            setStatusId('');
            setGroupId('');
            setPriority('');
            setAssigneeId('');
            setCollaborators([]);
            setProgress('0');
            setStartDate('');
            setDueDate('');
        }

        setErrors({});
        setProcessing(false);
    }, [open, mode]);

    function toggleCollaborator(id: number) {
        setCollaborators((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            title,
            description,
            status_id: statusId,
            group_id: groupId === 'none' || groupId === '' ? null : Number(groupId),
            assignee_id: assigneeId === 'none' || assigneeId === '' ? null : Number(assigneeId),
            collaborators,
            priority,
            progress: Number(progress),
            start_date: startDate || null,
            due_date: dueDate,
        };

        const options = {
            onError: (errs: Record<string, string>) => {
                setErrors(errs);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
                onOpenChange(false);
                onSuccess?.();
            },
        };

        if (mode === 'edit' && workItemId) {
            router.put(`/projects/${project.id}/work-items/${workItemId}`, payload, options);
        } else {
            router.post(`/projects/${project.id}/work-items`, payload, options);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{mode === 'edit' ? 'Edit Work Item' : 'Create Work Item'}</SheetTitle>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-mono uppercase">{project?.item_prefix}</span> — new item
                    </p>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Work item title"
                        />
                        {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                    </div>
{/* Status */}
                    <div className="space-y-2">
                        <Label>Status</Label>
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
                        <Label>Group</Label>
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
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {PRIORITIES.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.priority && <p className="text-sm text-red-600">{errors.priority}</p>}
                    </div>

                    {/* Assignee */}
                    <div className="space-y-2">
                        <Label>Assignee</Label>
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

                    {/* Collaborators */}
                    <div className="space-y-2">
                        <Label>Collaborators</Label>
                        <div className="border rounded-md p-3 space-y-2">
                            {members.map((m) => (
                                <label key={m.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={collaborators.includes(m.id)}
                                        onCheckedChange={() => toggleCollaborator(m.id)}
                                    />
                                    {m.name}
                                </label>
                            ))}
                            {members.length === 0 && (
                                <p className="text-sm text-muted-foreground">No members available.</p>
                            )}
                        </div>
                        {errors.collaborators && <p className="text-sm text-red-600">{errors.collaborators}</p>}
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

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                            />
                            {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={dueDate}
                                onChange={handleDueDateChange}
                                min={startDate}
                                disabled={!startDate}
                            />
                            {errors.due_date && <p className="text-sm text-red-600">{errors.due_date}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Describe the work item..."
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                        />
                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                    </div>

                    <SheetFooter className="pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? (mode === 'edit' ? 'Saving...' : 'Creating...')
                                : (mode === 'edit' ? 'Save Changes' : 'Create Work Item')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}