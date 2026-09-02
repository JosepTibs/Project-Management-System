import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,} from '@/components/ui/sheet';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, FileText, FolderKanban, Plus, Target, Trash2,} from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,} from '@/components/ui/alert-dialog';
import { useEffect, useRef, useState, ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';

export interface UserOption {
    id: number;
    username: string;
    email: string;
    role?: string;
}

export interface WorkItemStatusOption {
    id: number;
    name: string;
}

export interface StatusOption {
    name: string;
    color: string;
}

export interface NestedWorkItem {
    id?: number;
    title: string;
    description: string;
    priority: string;
    start_date: string;
    due_date: string;
    assignee_id: number | null;
    status_id: number | null;
}

export interface NestedGroup {
    id?: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    progress: number;
    assignee_ids: number[];
    work_items: NestedWorkItem[];
}

export interface NestedMilestone {
    id?: number;
    name: string;
    description: string;
    start_date: string;
    target_date: string;
    groups: NestedGroup[];
}

interface ProjectSetupSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    projectId?: number;
    project: {
        name: string;
        description: string;
        item_prefix: string;
        start_date: string | null;
        end_date: string | null;
    };
    statusName: string;
    statuses: StatusOption[];
    allUsers: UserOption[];
    workItemStatuses: WorkItemStatusOption[];
            initialMemberIds?: number[];
    initialMilestones?: NestedMilestone[];
    initialUnlinkedWorkItems?: NestedWorkItem[];
    onSuccess?: () => void;
}

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
    1: 'Basics',
    2: 'Team',
    3: 'Plan',
    4: 'Review',
};

function formatDate(value: string) {
    if (!value) return 'No date';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}



function dateRange(start: string, end: string) {
    if (!start && !end) return 'Dates not set';
    if (!start) return `Until ${formatDate(end)}`;
    if (!end) return `From ${formatDate(start)}`;
    return `${formatDate(start)} → ${formatDate(end)}`;
}

function getWorkItemStatusName(statusId: number | null, statuses: WorkItemStatusOption[]) {
    return statuses.find(status => status.id === statusId)?.name ?? 'No status';
}

export default function ProjectSetupSheet({
    open,
    onOpenChange,
    mode,
    projectId,
    project,
    statusName: initialStatusName,
    statuses,
    allUsers,
    workItemStatuses,
        initialMemberIds = [],
    initialMilestones = [],
    initialUnlinkedWorkItems = [],
    onSuccess,
}: ProjectSetupSheetProps) {
    const [step, setStep] = useState<Step>(1);
    const [name, setName] = useState(project.name ?? '');
    const [itemPrefix, setItemPrefix] = useState(project.item_prefix ?? '');
    const [description, setDescription] = useState(project.description ?? '');
    const [startDate, setStartDate] = useState(project.start_date ?? '');
    const [endDate, setEndDate] = useState(project.end_date ?? '');
    const [statusName, setStatusName] = useState(initialStatusName);

    const [memberIds, setMemberIds] = useState<number[]>(initialMemberIds);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

        const [milestones, setMilestones] = useState<NestedMilestone[]>(initialMilestones);
    const [unlinkedWorkItems, setUnlinkedWorkItems] = useState<NestedWorkItem[]>(initialUnlinkedWorkItems);
    const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [expandedWorkItems, setExpandedWorkItems] = useState<Set<string>>(new Set());

    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [activeIssueKey, setActiveIssueKey] = useState<string | null>(null);
        const tempIdCounter = useRef(-1);
    const hasSyncedOpenState = useRef(false);
    const prefixTouchedByUser = useRef(false);
    const initialSnapshot = useRef('');
    const currentSnapshot = JSON.stringify({
        name,
        itemPrefix,
        description,
        startDate,
        endDate,
        statusName,
        memberIds,
        milestones,
    });
    const isDirty = Boolean(initialSnapshot.current) && initialSnapshot.current !== currentSnapshot;

    const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    // If current end date is before the new start date, clear it
    if (endDate && endDate < newStartDate) {
      setEndDate('');
    }
    };

    const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
      setEndDate(e.target.value);
    };
    
    // Sync the form when the sheet is opened, but don't reset an active edit session.
    useEffect(() => {
        if (!open) {
            hasSyncedOpenState.current = false;
            return;
        }

        if (!hasSyncedOpenState.current) {
            setStep(1);
            setName(project.name ?? '');
            setItemPrefix(project.item_prefix ?? '');
            setDescription(project.description ?? '');
            setStartDate(project.start_date ?? '');
            setEndDate(project.end_date ?? '');
            setStatusName(initialStatusName);
            setMemberIds(initialMemberIds);
            setMilestones(initialMilestones);
            setSearchTerm('');
            setRoleFilter('all');
            setErrorMessage(null);
            setExpandedMilestones(new Set());
            setExpandedGroups(new Set());
            setExpandedWorkItems(new Set());
            initialSnapshot.current = JSON.stringify({
                name: project.name ?? '',
                itemPrefix: project.item_prefix ?? '',
                description: project.description ?? '',
                startDate: project.start_date ?? '',
                endDate: project.end_date ?? '',
                statusName: initialStatusName,
                memberIds: initialMemberIds,
                milestones: initialMilestones,
            });
            hasSyncedOpenState.current = true;
        }
    }, [
        open,
        project.name,
        project.item_prefix,
        project.description,
        project.start_date,
        project.end_date,
        initialStatusName,
        initialMemberIds,
        initialMilestones,
    ]);

    const uniqueRoles = [...new Set(allUsers.map(user => user.role).filter((role): role is string => Boolean(role)))];
    const filteredUsers = allUsers.filter(user => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            user.username.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const totalGroups = milestones.reduce((sum, milestone) => sum + milestone.groups.length, 0);
    const totalWorkItems = milestones.reduce(
        (sum, milestone) => sum + milestone.groups.reduce((groupSum, group) => groupSum + group.work_items.length, 0),
        0,
    );

    function toggleSetValue(setter: Dispatch<SetStateAction<Set<string>>>, key: string) {
        setter(previous => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function toggleUser(userId: number) {
        setMemberIds(previous =>
            previous.includes(userId)
                ? previous.filter(id => id !== userId)
                : [...previous, userId],
        );
    }

    function addMilestone() {
        const newId = tempIdCounter.current--;
        const milestone: NestedMilestone = {
            id: newId,
            name: '',
            description: '',
            start_date: '',
            target_date: '',
            groups: [],
        };

        setMilestones(previous => [...previous, milestone]);
        setExpandedMilestones(previous => new Set(previous).add(String(newId)));
    }

    function updateMilestone(index: number, field: keyof NestedMilestone, value: string) {
        setMilestones(previous =>
            previous.map((milestone, milestoneIndex) =>
                milestoneIndex === index ? { ...milestone, [field]: value } : milestone,
            ),
        );
    }

    function removeMilestone(index: number) {
        setMilestones(previous => previous.filter((_, milestoneIndex) => milestoneIndex !== index));
    }

    function addGroup(milestoneIndex: number) {
        const newId = tempIdCounter.current--;
        const group: NestedGroup = {
            id: newId,
            name: '',
            description: '',
            start_date: '',
            end_date: '',
            progress: 0,
            assignee_ids: [],
            work_items: [],
        };

        setMilestones(previous =>
            previous.map((milestone, index) =>
                index === milestoneIndex
                    ? { ...milestone, groups: [...milestone.groups, group] }
                    : milestone,
            ),
        );
        setExpandedGroups(previous => new Set(previous).add(`${milestoneIndex}-${newId}`));
    }

    function updateGroup(
        milestoneIndex: number,
        groupIndex: number,
        field: keyof NestedGroup,
        value: string | number,
    ) {
        setMilestones(previous =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) return milestone;
                return {
                    ...milestone,
                    groups: milestone.groups.map((group, nestedIndex) =>
                        nestedIndex === groupIndex ? { ...group, [field]: value } : group,
                    ),
                };
            }),
        );
    }

    function toggleGroupAssignee(milestoneIndex: number, groupIndex: number, userId: number) {
        setMilestones(previous =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) return milestone;
                return {
                    ...milestone,
                    groups: milestone.groups.map((group, nestedIndex) => {
                        if (nestedIndex !== groupIndex) return group;
                        const has = (group.assignee_ids ?? []).includes(userId);
                        return {
                            ...group,
                            assignee_ids: has
                                ? (group.assignee_ids ?? []).filter((id) => id !== userId)
                                : [...(group.assignee_ids ?? []), userId],
                        };
                    }),
                };
            }),
        );
    }

    function removeGroup(milestoneIndex: number, groupIndex: number) {
        setMilestones(previous =>
            previous.map((milestone, index) =>
                index === milestoneIndex
                    ? { ...milestone, groups: milestone.groups.filter((_, nestedIndex) => nestedIndex !== groupIndex) }
                    : milestone,
            ),
        );
    }

    function addWorkItem(milestoneIndex: number, groupIndex: number) {
        const newId = tempIdCounter.current--;
        const workItem: NestedWorkItem = {
            id: newId,
            title: '',
            description: '',
            priority: 'medium',
            start_date: '',
            due_date: '',
            assignee_id: null,
            status_id: workItemStatuses[0]?.id ?? null,
        };

        setMilestones(previous =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) return milestone;
                return {
                    ...milestone,
                    groups: milestone.groups.map((group, nestedIndex) =>
                        nestedIndex === groupIndex
                            ? { ...group, work_items: [...group.work_items, workItem] }
                            : group,
                    ),
                };
            }),
        );

        setExpandedWorkItems(previous =>
            new Set(previous).add(`${milestoneIndex}-${groupIndex}-${newId}`),
        );
    }

    function updateWorkItem(
        milestoneIndex: number,
        groupIndex: number,
        workItemIndex: number,
        field: keyof NestedWorkItem,
        value: string | number | null,
    ) {
        setMilestones(previous =>
            previous.map((milestone, milestoneIndexValue) => {
                if (milestoneIndexValue !== milestoneIndex) return milestone;
                return {
                    ...milestone,
                    groups: milestone.groups.map((group, groupIndexValue) => {
                        if (groupIndexValue !== groupIndex) return group;
                        return {
                            ...group,
                            work_items: group.work_items.map((item, workItemIndexValue) =>
                                workItemIndexValue === workItemIndex ? { ...item, [field]: value } : item,
                            ),
                        };
                    }),
                };
            }),
        );
    }

    function removeWorkItem(milestoneIndex: number, groupIndex: number, workItemIndex: number) {
        setMilestones(previous =>
            previous.map((milestone, milestoneIndexValue) => {
                if (milestoneIndexValue !== milestoneIndex) return milestone;
                return {
                    ...milestone,
                    groups: milestone.groups.map((group, groupIndexValue) =>
                        groupIndexValue === groupIndex
                            ? { ...group, work_items: group.work_items.filter((_, index) => index !== workItemIndex) }
                            : group,
                    ),
                };
            }),
        );
    }

    type Issue = { key: string; step: Step; message: string; severity: 'error' | 'warning'; fixLabel?: string };

    function collectIssues(): Issue[] {
        const issues: Issue[] = [];
        if (!name.trim()) issues.push({ key: 'project-name', step: 1, severity: 'error', message: 'Project name is required.' });
        if (!itemPrefix.trim()) issues.push({ key: 'project-prefix', step: 1, severity: 'error', message: 'Project prefix is required.' });
        if (startDate && endDate && startDate > endDate) issues.push({ key: 'project-dates', step: 1, severity: 'error', message: 'Project end date must be on or after the start date.' });

        milestones.forEach((milestone, mi) => {
            const mLabel = milestone.name.trim() || `Milestone ${mi + 1}`;
            if (!milestone.name.trim()) issues.push({ key: `m-${mi}-name`, step: 3, severity: 'error', message: `${mLabel} needs a name.` });
            if (!milestone.start_date || !milestone.target_date) issues.push({ key: `m-${mi}-dates`, step: 3, severity: 'warning', message: `${mLabel} has no complete date range yet.` });
            if (milestone.start_date && milestone.target_date && milestone.start_date > milestone.target_date) issues.push({ key: `m-${mi}-range`, step: 3, severity: 'error', message: `${mLabel} has an invalid date range.` });

            milestone.groups.forEach((group, gi) => {
                const gLabel = group.name.trim() || `Group ${gi + 1}`;
                if (!group.name.trim()) issues.push({ key: `g-${mi}-${gi}-name`, step: 3, severity: 'error', message: `${gLabel} in ${mLabel} needs a name.` });
                if (!group.start_date || !group.end_date) issues.push({ key: `g-${mi}-${gi}-dates`, step: 3, severity: 'warning', message: `${gLabel} has no complete date range yet.` });
                if (group.start_date && group.end_date && group.start_date > group.end_date) issues.push({ key: `g-${mi}-${gi}-range`, step: 3, severity: 'error', message: `${gLabel} has an invalid date range.` });
                if (milestone.start_date && group.start_date && group.start_date < milestone.start_date) issues.push({ key: `g-${mi}-${gi}-before-milestone`, step: 3, severity: 'warning', message: `${gLabel} starts before ${mLabel}.` });
                if (milestone.target_date && group.end_date && group.end_date > milestone.target_date) issues.push({ key: `g-${mi}-${gi}-after-milestone`, step: 3, severity: 'warning', message: `${gLabel} ends after ${mLabel}.` });

                group.work_items.forEach((item, wi) => {
                    const label = item.title.trim() || `Work item ${wi + 1}`;
                    if (!item.title.trim()) issues.push({ key: `w-${mi}-${gi}-${wi}-title`, step: 3, severity: 'error', message: `${label} needs a title.` });
                    if (item.start_date && item.due_date && item.start_date > item.due_date) issues.push({ key: `w-${mi}-${gi}-${wi}-range`, step: 3, severity: 'error', message: `${label} has an invalid date range.` });
                    if (group.start_date && item.start_date && item.start_date < group.start_date) issues.push({ key: `w-${mi}-${gi}-${wi}-before-group`, step: 3, severity: 'warning', message: `${label} starts before ${gLabel}.` });
                    if (group.end_date && item.due_date && item.due_date > group.end_date) issues.push({ key: `w-${mi}-${gi}-${wi}-after-group`, step: 3, severity: 'warning', message: `${label} ends after ${gLabel}.` });
                });
            });
        });
        return issues;
    }

    function validateStep(targetStep: Step) {
        setErrorMessage(null);
        const issues = collectIssues().filter(issue => issue.step <= targetStep && issue.severity === 'error');
        if (issues.length > 0 && targetStep === 4) {
            setErrorMessage(`${issues.length} item${issues.length === 1 ? '' : 's'} need attention before you can finish.`);
            setStep(issues[0].step);
            setActiveIssueKey(issues[0].key);
            return false;
        }
        if (targetStep === 2 && mode === 'create' && (!name.trim() || !itemPrefix.trim())) {
            setErrorMessage('Add a project name and work item prefix before continuing.');
            setStep(1);
            return false;
        }
        return true;
    }

    function goNext() {
        if (step === 1 && !validateStep(2)) return;
        if (step === 3 && !validateStep(4)) return;
        if (step < 4) setStep(previous => (previous + 1) as Step);
    }

    function goBack() {
        if (step > 1) setStep(previous => (previous - 1) as Step);
    }

    function handleSubmit() {
        setErrorMessage(null);
        const issues = collectIssues();
        const errors = issues.filter(issue => issue.severity === 'error');
        if (errors.length > 0) {
            setErrorMessage(`${errors.length} item${errors.length === 1 ? '' : 's'} need attention before you can finish.`);
            setStep(errors[0].step);
            setActiveIssueKey(errors[0].key);
            return;
        }

        const validatedMilestones = milestones
            .filter(milestone => milestone.name.trim())
            .map(milestone => ({
                ...milestone,
                groups: milestone.groups
                    .filter(group => group.name.trim())
                    .map(group => ({
                        ...group,
                        work_items: group.work_items.filter(workItem => workItem.title.trim()),
                    })),
            }));

        const payload = {
            name: name.trim(),
            item_prefix: itemPrefix.trim(),
            description,
            start_date: startDate || null,
            end_date: endDate || null,
            status_name: statusName || null,
            member_ids: memberIds,
            milestones: validatedMilestones,
        } as unknown as Parameters<typeof router.post>[1];

        setProcessing(true);

        const options = {
            onError: () => setProcessing(false),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                onSuccess?.();
                onOpenChange(false);
            },
        };

        if (mode === 'edit' && projectId) router.put(`/projects/${projectId}/setup`, payload, options);
        else router.post('/projects', payload, options);
    }

    function requestClose() {
        if (processing) return;
        if (isDirty) setShowCloseConfirm(true);
        else onOpenChange(false);
    }

    function jumpToIssue(issueKey: string) {
        const issue = collectIssues().find(item => item.key === issueKey);
        if (!issue) return;
        setStep(issue.step);
        setActiveIssueKey(issue.key);
        setErrorMessage(null);
    }

    const issues = collectIssues();
    const stepIssueCounts = ([1, 2, 3, 4] as Step[]).reduce<Record<number, number>>((acc, item) => {
        acc[item] = issues.filter(issue => issue.step === item && issue.severity === 'error').length;
        return acc;
    }, {});

    function renderStepContent() {
        if (step === 1) {
            return (
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Start with the essentials. You can add detailed planning after the project is created.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Project details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project name</Label>
                                <Input
                                    id="name"
                                    autoFocus
                                    value={name}
                                    onChange={event => setName(event.target.value)}
                                    placeholder="Placeholder"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={event => setDescription(event.target.value)}
                                    rows={4}
                                    placeholder="What is this project trying to achieve?"
                                    className="flex min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="status_name">Status</Label>
                                    <select
                                        id="status_name"
                                        value={statusName}
                                        onChange={event => setStatusName(event.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {statuses.map(status => (
                                            <option key={status.name} value={status.name}>{status.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="item_prefix">
                                        Project prefix
                                        <span className="ml-1 font-normal text-muted-foreground">(e.g. WR)</span>
                                    </Label>
                                    <Input
                                        id="item_prefix"
                                        value={itemPrefix}
                                        onChange={event => setItemPrefix(event.target.value)}
                                        placeholder="WR"
                                        disabled={mode === 'edit'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start date</Label>
                                    <Input id="start_date" type="date" value={startDate} onChange={handleStartDateChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End date</Label>
                                    <Input id="end_date" type="date" value={endDate} onChange={handleEndDateChange} min={startDate} disabled={!startDate} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {errorMessage && <ErrorMessage message={errorMessage} />}
                </div>
            );
        }

        if (step === 2) {
            return (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-medium">Build your team</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select the people who should have access to this project. You can change this later.
                        </p>
                    </div>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base">Project members</CardTitle>
                            <Badge variant="secondary">{memberIds.length} selected</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={event => setSearchTerm(event.target.value)}
                            />

                            {uniqueRoles.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={roleFilter === 'all' ? 'default' : 'outline'}
                                        onClick={() => setRoleFilter('all')}
                                    >
                                        All
                                    </Button>
                                    {uniqueRoles.map(role => (
                                        <Button
                                            key={role}
                                            type="button"
                                            size="sm"
                                            variant={roleFilter === role ? 'default' : 'outline'}
                                            onClick={() => setRoleFilter(role)}
                                            className="capitalize"
                                        >
                                            {role}
                                        </Button>
                                    ))}
                                </div>
                            )}

                            <div className="divide-y rounded-lg border">
                                {filteredUsers.length === 0 ? (
                                    <p className="p-6 text-center text-sm text-muted-foreground">No members found.</p>
                                ) : (
                                    filteredUsers.map(user => {
                                        const selected = memberIds.includes(user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleUser(user.id)}
                                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                                            >
                                                <span
                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                                                    }`}
                                                >
                                                    {selected && <Check className="h-3.5 w-3.5" />}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium">{user.username}</span>
                                                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                                                </span>
                                                {user.role && <Badge variant="outline" className="capitalize">{user.role}</Badge>}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        if (step === 3) {
            return (
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-medium">Plan the work</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Start with milestones. Open one only when you need to add groups or work items.
                            </p>
                        </div>
                        <Button type="button" size="sm" onClick={addMilestone}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add milestone
                        </Button>
                    </div>

                    {milestones.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                <div className="mb-3 rounded-full bg-muted p-3">
                                    <Target className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium">No milestones yet</h3>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    You can create the project without a plan and add milestones later, or start building the plan now.
                                </p>
                                <Button type="button" variant="outline" className="mt-4" onClick={addMilestone}>
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Add your first milestone
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {milestones.map((milestone, milestoneIndex) => {
                                const milestoneKey = String(milestone.id ?? `m-${milestoneIndex}`);
                                const expanded = expandedMilestones.has(milestoneKey);

                                return (
                                    <Collapsible
                                        key={milestoneKey}
                                        open={expanded}
                                        onOpenChange={() => toggleSetValue(setExpandedMilestones, milestoneKey)}
                                    >
                                        <Card>
                                            <CollapsibleTrigger asChild>
                                                <button type="button" className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30">
                                                    <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate font-medium">
                                                            {milestone.name || 'Untitled milestone'}
                                                        </span>
                                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                                            {dateRange(milestone.start_date, milestone.target_date)} · {milestone.groups.length} {milestone.groups.length === 1 ? 'group' : 'groups'}
                                                        </span>
                                                    </span>
                                                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                                <CardContent className="border-t p-4">
                                                    <div className="space-y-5">
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                                                            <div className="space-y-2">
                                                                <Label>Name</Label>
                                                                <Input
                                                                    value={milestone.name}
                                                                    onChange={event => updateMilestone(milestoneIndex, 'name', event.target.value)}
                                                                    placeholder="Website launch"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
                                                                <Input
                                                                    value={milestone.description}
                                                                    onChange={event => updateMilestone(milestoneIndex, 'description', event.target.value)}
                                                                    placeholder="Optional"
                                                                />
                                                            </div>
                                                            <DateField label="Start" value={milestone.start_date} onChange={value => updateMilestone(milestoneIndex, 'start_date', value)} />
                                                            <DateField label="Target" value={milestone.target_date} onChange={value => updateMilestone(milestoneIndex, 'target_date', value)} />
                                                        </div>

                                                        <div className="flex items-center justify-between border-t pt-4">
                                                            <div>
                                                                <p className="text-sm font-medium">Groups</p>
                                                                <p className="text-xs text-muted-foreground">Break this milestone into areas of work.</p>
                                                            </div>
                                                            <Button type="button" size="sm" variant="outline" onClick={() => addGroup(milestoneIndex)}>
                                                                <Plus className="mr-1.5 h-4 w-4" />
                                                                Add group
                                                            </Button>
                                                        </div>

                                                        {milestone.groups.length === 0 ? (
                                                            <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                                                                No groups yet. Add one when you're ready.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {milestone.groups.map((group, groupIndex) => renderGroup(
                                                                    milestoneIndex,
                                                                    group,
                                                                    groupIndex,
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="flex justify-end border-t pt-4">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => removeMilestone(milestoneIndex)}
                                                            >
                                                                <Trash2 className="mr-1.5 h-4 w-4" />
                                                                Remove milestone
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Card>
                                    </Collapsible>
                                );
                            })}
                        </div>
                    )}

                    {errorMessage && <ErrorMessage message={errorMessage} />}
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="font-medium">Review your project</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Everything looks good? You can always change the plan and team later.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Project</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Summary label="Name" value={name || 'Untitled project'} />
                        <Summary label="Status" value={statusName || 'Not set'} />
                        <Summary label="Dates" value={dateRange(startDate, endDate)} />
                        <Summary label="Project prefix" value={itemPrefix || 'Not set'} />
                        <Summary label="Members" value={`${memberIds.length} selected`} />
                        <Summary label="Plan" value={`${milestones.length} milestones · ${totalGroups} groups · ${totalWorkItems} work items`} />
                    </CardContent>
                </Card>

                {milestones.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Milestones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {milestones.map((milestone, index) => (
                                <div key={milestone.id ?? index} className="flex items-center gap-3 rounded-lg border p-3">
                                    <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{milestone.name || 'Untitled milestone'}</p>
                                        <p className="text-xs text-muted-foreground">{dateRange(milestone.start_date, milestone.target_date)}</p>
                                    </div>
                                    <Badge variant="secondary">{milestone.groups.length} groups</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {errorMessage && <ErrorMessage message={errorMessage} />}
            </div>
        );
    }

    function renderGroup(milestoneIndex: number, group: NestedGroup, groupIndex: number) {
        const groupKey = `${milestoneIndex}-${group.id ?? `g-${groupIndex}`}`;
        const expanded = expandedGroups.has(groupKey);

        return (
            <Collapsible
                key={groupKey}
                open={expanded}
                onOpenChange={() => toggleSetValue(setExpandedGroups, groupKey)}
            >
                <div className="rounded-lg border">
                    <CollapsibleTrigger asChild>
                        <button type="button" className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/30">
                            <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{group.name || 'Untitled group'}</span>
                                <span className="block text-xs text-muted-foreground">
                                    {group.work_items.length} {group.work_items.length === 1 ? 'work item' : 'work items'} · {dateRange(group.start_date, group.end_date)}
                                </span>
                            </span>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <div className="space-y-4 border-t p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2 lg:col-span-2">
                                    <Label>Name</Label>
                                    <Input value={group.name} onChange={event => updateGroup(milestoneIndex, groupIndex, 'name', event.target.value)} placeholder="Frontend" />
                                </div>
                                <DateField label="Start" value={group.start_date} onChange={value => updateGroup(milestoneIndex, groupIndex, 'start_date', value)} />
                                <DateField label="End" value={group.end_date} onChange={value => updateGroup(milestoneIndex, groupIndex, 'end_date', value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
                                <Input value={group.description} onChange={event => updateGroup(milestoneIndex, groupIndex, 'description', event.target.value)} placeholder="Optional" />
                            </div>

                            <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Team assigned</Label>
                                    <p className="text-xs text-muted-foreground">People working on this group.</p>
                                    <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border p-3">
                                        {allUsers.filter(user => memberIds.includes(user.id)).map((user) => (
                                            <label key={user.id} className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={(group.assignee_ids ?? []).includes(user.id)}
                                                    onCheckedChange={() => toggleGroupAssignee(milestoneIndex, groupIndex, user.id)}
                                                />
                                                <span className="truncate">{user.username}</span>
                                            </label>
                                        ))}
                                        {allUsers.filter(user => memberIds.includes(user.id)).length === 0 && (
                                            <p className="text-sm text-muted-foreground">Add project members on the Team step first.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Progress <span className="font-normal text-muted-foreground">({group.work_items.length === 0 ? 'manual' : 'from work items'})</span></Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={group.progress ?? 0}
                                        disabled={group.work_items.length > 0}
                                        onChange={event => updateGroup(milestoneIndex, groupIndex, 'progress', Number(event.target.value))}
                                        placeholder="0"
                                        title={group.work_items.length > 0 ? 'Progress is calculated from the group\u0027s work items.' : 'Set progress manually for this group.'}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {group.work_items.length > 0
                                            ? 'Calculated from the average of the work items below.'
                                            : 'Set manually when a group has no work items.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <div>
                                    <p className="text-sm font-medium">Work items</p>
                                    <p className="text-xs text-muted-foreground">Add tasks only when you need them.</p>
                                </div>
                                <Button type="button" size="sm" variant="outline" onClick={() => addWorkItem(milestoneIndex, groupIndex)}>
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Add work item
                                </Button>
                            </div>

                            {group.work_items.length === 0 ? (
                                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                    No work items yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {group.work_items.map((item, workItemIndex) => renderWorkItem(
                                        milestoneIndex,
                                        groupIndex,
                                        item,
                                        workItemIndex,
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end border-t pt-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeGroup(milestoneIndex, groupIndex)}
                                >
                                    <Trash2 className="mr-1.5 h-4 w-4" />
                                    Remove group
                                </Button>
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        );
    }

    function renderWorkItem(
        milestoneIndex: number,
        groupIndex: number,
        item: NestedWorkItem,
        workItemIndex: number,
    ) {
        const workItemKey = `${milestoneIndex}-${groupIndex}-${item.id ?? `w-${workItemIndex}`}`;
        const expanded = expandedWorkItems.has(workItemKey);
        const assignee = allUsers.find(user => user.id === item.assignee_id);

        return (
            <Collapsible
                key={workItemKey}
                open={expanded}
                onOpenChange={() => toggleSetValue(setExpandedWorkItems, workItemKey)}
            >
                <div className="rounded-lg border bg-background">
                    <CollapsibleTrigger asChild>
                        <button type="button" className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/30">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{item.title || 'Untitled work item'}</span>
                                <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                                    <span className="capitalize">{item.priority}</span>
                                    <span>·</span>
                                    <span>{assignee?.username ?? 'Unassigned'}</span>
                                    <span>·</span>
                                    <span>{getWorkItemStatusName(item.status_id, workItemStatuses)}</span>
                                </span>
                            </span>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <div className="space-y-4 border-t p-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={item.title}
                                    autoFocus={item.title === ''}
                                    onChange={event => updateWorkItem(milestoneIndex, groupIndex, workItemIndex, 'title', event.target.value)}
                                    placeholder="What needs to be done?"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
                                <textarea
                                    value={item.description}
                                    onChange={event => updateWorkItem(milestoneIndex, groupIndex, workItemIndex, 'description', event.target.value)}
                                    rows={3}
                                    placeholder="Add context or acceptance criteria..."
                                    className="flex min-h-20 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <select
                                        value={item.priority}
                                        onChange={event => updateWorkItem(milestoneIndex, groupIndex, workItemIndex, 'priority', event.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        {PRIORITIES.map(priority => (
                                            <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <select
                                        value={item.status_id ?? ''}
                                        onChange={event => updateWorkItem(milestoneIndex, groupIndex, workItemIndex, 'status_id', event.target.value ? Number(event.target.value) : null)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">No status</option>
                                        {workItemStatuses.map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Assignee</Label>
                                    <select
                                        value={item.assignee_id ?? ''}
                                        onChange={event => updateWorkItem(milestoneIndex, groupIndex, workItemIndex, 'assignee_id', event.target.value ? Number(event.target.value) : null)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Unassigned</option>
                                        {allUsers.filter(user => memberIds.includes(user.id)).map(user => (
                                            <option key={user.id} value={user.id}>{user.username}</option>
                                        ))}
                                    </select>
                                </div>

                                <DateField label="Start" value={item.start_date} onChange={value => updateWorkItem(milestoneIndex, groupIndex, workItemIndex, 'start_date', value)} />
                                <DateField label="Due" value={item.due_date} onChange={value => updateWorkItem(milestoneIndex, groupIndex, workItemIndex, 'due_date', value)} />
                            </div>

                            <div className="flex justify-end border-t pt-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeWorkItem(milestoneIndex, groupIndex, workItemIndex)}
                                >
                                    <Trash2 className="mr-1.5 h-4 w-4" />
                                    Remove work item
                                </Button>
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        );
    }

    return (
        <Sheet open={open} onOpenChange={requestClose}>
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-none md:w-[1020px]">
                <SheetHeader className="border-b px-6 py-4 text-left">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <SheetTitle className="truncate">{mode === 'create' ? 'Create project' : `Edit ${project.name}`}</SheetTitle>
                                {isDirty && <Badge variant="outline" className="shrink-0">Unsaved changes</Badge>}
                            </div>
                            <SheetDescription className="mt-1">
                                {mode === 'create' ? 'Set up the project now; detailed planning can stay lightweight.' : 'Update only what changed. Your existing plan stays intact.'}
                            </SheetDescription>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={requestClose} aria-label="Close">
                            <span className="text-lg leading-none">×</span>
                        </Button>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Project setup progress">
                        {([1, 2, 3, 4] as Step[]).map(item => {
                            const active = item === step;
                            const complete = item < step;
                            const count = stepIssueCounts[item] ?? 0;
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => item <= step && setStep(item)}
                                    disabled={item > step}
                                    className={`relative rounded-lg border px-3 py-2 text-left transition ${active ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'} ${item > step ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${complete || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            {complete ? <Check className="h-3.5 w-3.5" /> : item}
                                        </span>
                                        <span className="text-sm font-medium">{STEP_LABELS[item]}</span>
                                    </div>
                                    {count > 0 && item <= step && <span className="absolute right-2 top-2 text-[11px] font-medium text-amber-600">{count} issue{count === 1 ? '' : 's'}</span>}
                                </button>
                            );
                        })}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto bg-muted/20">
                    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <main className="min-w-0">{renderStepContent()}</main>

                        <aside className="hidden lg:block">
                            <div className="sticky top-0 space-y-4">
                                <Card>
                                    <CardHeader className="pb-3"><CardTitle className="text-sm">Project snapshot</CardTitle></CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <Summary label="Project" value={name || 'Untitled'} />
                                        <Summary label="Dates" value={dateRange(startDate, endDate)} />
                                        <Summary label="Team" value={`${memberIds.length} ${memberIds.length === 1 ? 'member' : 'members'}`} />
                                        <Summary label="Plan" value={`${milestones.length} milestones · ${totalGroups} groups · ${totalWorkItems} items`} />
                                    </CardContent>
                                </Card>

                                {step === 4 && issues.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3"><CardTitle className="text-sm">Review checks</CardTitle></CardHeader>
                                        <CardContent className="space-y-2">
                                            {issues.slice(0, 5).map(issue => (
                                                <button key={issue.key} type="button" onClick={() => jumpToIssue(issue.key)} className="w-full rounded-md border p-2 text-left text-xs hover:bg-muted/50">
                                                    <span className={`font-medium ${issue.severity === 'error' ? 'text-destructive' : 'text-amber-600'}`}>{issue.severity === 'error' ? 'Fix' : 'Review'} · {STEP_LABELS[issue.step]}</span>
                                                    <span className="mt-1 block text-muted-foreground">{issue.message}</span>
                                                </button>
                                            ))}
                                            {issues.length > 5 && <p className="text-xs text-muted-foreground">+ {issues.length - 5} more</p>}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>

                <SheetFooter className="border-t bg-background px-6 py-4">
                    <div className="flex w-full items-center justify-between gap-4">
                        <div className="min-w-0 text-xs text-muted-foreground">
                            <span className="hidden sm:inline">Step {step} of 4 · </span>
                            {step === 3 && `${milestones.length} milestones · ${totalGroups} groups · ${totalWorkItems} items`}
                            {step === 2 && `${memberIds.length} ${memberIds.length === 1 ? 'member' : 'members'} selected`}
                            {step === 1 && (isDirty ? 'Changes will be saved when you finish.' : 'No changes yet.')}
                            {step === 4 && (issues.some(issue => issue.severity === 'error') ? `${issues.filter(issue => issue.severity === 'error').length} blocking issue${issues.filter(issue => issue.severity === 'error').length === 1 ? '' : 's'}.` : issues.length ? `${issues.length} recommendation${issues.length === 1 ? '' : 's'} · ready to save.` : 'Everything is ready.')}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <Button type="button" variant="outline" onClick={requestClose} disabled={processing}>
                                Cancel
                            </Button>
                            {step > 1 && <Button type="button" variant="ghost" onClick={goBack} disabled={processing}><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button>}
                            {step < 4 ? (
                                <Button type="button" onClick={goNext} disabled={processing}>Continue<ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                            ) : (
                                <Button type="button" onClick={handleSubmit} disabled={processing || issues.some(issue => issue.severity === 'error')}>
                                    {processing ? 'Saving…' : mode === 'create' ? 'Create project' : 'Save changes'}
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>

                        <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
                Your changes haven't been saved. Closing now will lose them.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel
                onClick={() => {
                    setErrorMessage(null);
                    setActiveIssueKey(null);
                }}
            >
                Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
                onClick={() => {
                    setShowCloseConfirm(false);
                    onOpenChange(false);
                }}
            >
                Discard changes
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
        </Sheet>
    );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input type="date" value={value} onChange={event => onChange(event.target.value)} />
        </div>
    );
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    );
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">{message}</p>
        </div>
    );
}