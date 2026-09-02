import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, FileText, FolderKanban, Plus, Target, Trash2 } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

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
    work_items: NestedWorkItem[];
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
    return statuses.find((status) => status.id === statusId)?.name ?? 'No status';
}

function generatePrefix(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0].toUpperCase())
        .join('');
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

    const handleStartDateChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        setStartDate(value);

        if (endDate && endDate < value) {
            setEndDate('');
        }
    };

    const handleNameChange = (value: string) => {
        setName(value);

        if (mode === 'create' && !prefixTouchedByUser.current) {
            setItemPrefix(generatePrefix(value));
        }
    };

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
            setActiveIssueKey(null);

            setExpandedMilestones(new Set());
            setExpandedGroups(new Set());
            setExpandedWorkItems(new Set());

            prefixTouchedByUser.current = false;

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

    const uniqueRoles = [...new Set(allUsers.map((user) => user.role).filter((role): role is string => Boolean(role)))];

    const filteredUsers = allUsers.filter((user) => {
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch = !search || user.username.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const projectMembers = allUsers.filter((user) => memberIds.includes(user.id));

    const totalGroups = milestones.reduce((sum, milestone) => sum + milestone.groups.length, 0);

    const totalWorkItems = milestones.reduce(
        (sum, milestone) =>
            sum + milestone.groups.reduce((groupSum, group) => groupSum + group.work_items.length, 0) + (milestone.work_items?.length ?? 0),
        0,
    );

    function toggleSetValue(setter: Dispatch<SetStateAction<Set<string>>>, key: string) {
        setter((previous) => {
            const next = new Set(previous);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    }

    function toggleUser(userId: number) {
        setMemberIds((previous) => (previous.includes(userId) ? previous.filter((id) => id !== userId) : [...previous, userId]));
    }

    function addMilestone() {
        const id = tempIdCounter.current--;

        const milestone: NestedMilestone = {
            id,
            name: '',
            description: '',
            start_date: '',
            target_date: '',
            groups: [],
            work_items: [],
        };

        setMilestones((previous) => [...previous, milestone]);

        setExpandedMilestones((previous) => new Set(previous).add(String(id)));
    }

    function updateMilestone(index: number, field: keyof NestedMilestone, value: string) {
        setMilestones((previous) =>
            previous.map((milestone, milestoneIndex) => (milestoneIndex === index ? { ...milestone, [field]: value } : milestone)),
        );
    }

    function removeMilestone(index: number) {
        setMilestones((previous) => previous.filter((_, milestoneIndex) => milestoneIndex !== index));
    }

    function addGroup(milestoneIndex: number) {
        const id = tempIdCounter.current--;

        const group: NestedGroup = {
            id,
            name: '',
            description: '',
            start_date: '',
            end_date: '',
            assignee_ids: [],
            work_items: [],
        };

        setMilestones((previous) =>
            previous.map((milestone, index) =>
                index === milestoneIndex
                    ? {
                          ...milestone,
                          groups: [...milestone.groups, group],
                      }
                    : milestone,
            ),
        );

        setExpandedGroups((previous) => new Set(previous).add(`${milestoneIndex}-${id}`));
    }

    function updateGroup(milestoneIndex: number, groupIndex: number, field: keyof NestedGroup, value: string | number) {
        setMilestones((previous) =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) return milestone;

                return {
                    ...milestone,
                    groups: milestone.groups.map((group, nestedIndex) => (nestedIndex === groupIndex ? { ...group, [field]: value } : group)),
                };
            }),
        );
    }

    function toggleGroupAssignee(milestoneIndex: number, groupIndex: number, userId: number) {
        setMilestones((previous) =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) return milestone;

                return {
                    ...milestone,
                    groups: milestone.groups.map((group, nestedIndex) => {
                        if (nestedIndex !== groupIndex) return group;

                        const current = group.assignee_ids ?? [];
                        const has = current.includes(userId);

                        return {
                            ...group,
                            assignee_ids: has ? current.filter((id) => id !== userId) : [...current, userId],
                        };
                    }),
                };
            }),
        );
    }

    function removeGroup(milestoneIndex: number, groupIndex: number) {
        setMilestones((previous) =>
            previous.map((milestone, index) =>
                index === milestoneIndex
                    ? {
                          ...milestone,
                          groups: milestone.groups.filter((_, nestedIndex) => nestedIndex !== groupIndex),
                      }
                    : milestone,
            ),
        );
    }

    function createWorkItem(): NestedWorkItem {
        return {
            id: tempIdCounter.current--,
            title: '',
            description: '',
            priority: 'medium',
            start_date: '',
            due_date: '',
            assignee_id: null,
            status_id: workItemStatuses[0]?.id ?? null,
        };
    }

    function addWorkItem(milestoneIndex: number, groupIndex: number) {
        const workItem = createWorkItem();

        setMilestones((previous) =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) return milestone;

                return {
                    ...milestone,
                    groups: milestone.groups.map((group, nestedIndex) =>
                        nestedIndex === groupIndex
                            ? {
                                  ...group,
                                  work_items: [...group.work_items, workItem],
                              }
                            : group,
                    ),
                };
            }),
        );

        setExpandedWorkItems((previous) => new Set(previous).add(`${milestoneIndex}-${groupIndex}-${workItem.id}`));
    }

    function updateWorkItem(
        milestoneIndex: number,
        groupIndex: number,
        workItemIndex: number,
        field: keyof NestedWorkItem,
        value: string | number | null,
    ) {
        setMilestones((previous) =>
            previous.map((milestone, milestoneIndexValue) => {
                if (milestoneIndexValue !== milestoneIndex) {
                    return milestone;
                }

                return {
                    ...milestone,
                    groups: milestone.groups.map((group, groupIndexValue) => {
                        if (groupIndexValue !== groupIndex) {
                            return group;
                        }

                        return {
                            ...group,
                            work_items: group.work_items.map((item, itemIndex) =>
                                itemIndex === workItemIndex
                                    ? {
                                          ...item,
                                          [field]: value,
                                      }
                                    : item,
                            ),
                        };
                    }),
                };
            }),
        );
    }

    function removeWorkItem(milestoneIndex: number, groupIndex: number, workItemIndex: number) {
        setMilestones((previous) =>
            previous.map((milestone, milestoneIndexValue) => {
                if (milestoneIndexValue !== milestoneIndex) {
                    return milestone;
                }

                return {
                    ...milestone,
                    groups: milestone.groups.map((group, groupIndexValue) =>
                        groupIndexValue === groupIndex
                            ? {
                                  ...group,
                                  work_items: group.work_items.filter((_, index) => index !== workItemIndex),
                              }
                            : group,
                    ),
                };
            }),
        );
    }

    function addMilestoneWorkItem(milestoneIndex: number) {
        const workItem = createWorkItem();

        setMilestones((previous) =>
            previous.map((milestone, index) =>
                index === milestoneIndex
                    ? {
                          ...milestone,
                          work_items: [...(milestone.work_items ?? []), workItem],
                      }
                    : milestone,
            ),
        );

        setExpandedWorkItems((previous) => new Set(previous).add(`${milestoneIndex}-milestone-${workItem.id}`));
    }

    function updateMilestoneWorkItem(milestoneIndex: number, workItemIndex: number, field: keyof NestedWorkItem, value: string | number | null) {
        setMilestones((previous) =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) return milestone;

                return {
                    ...milestone,
                    work_items: (milestone.work_items ?? []).map((item, itemIndex) =>
                        itemIndex === workItemIndex ? { ...item, [field]: value } : item,
                    ),
                };
            }),
        );
    }

    function removeMilestoneWorkItem(milestoneIndex: number, workItemIndex: number) {
        setMilestones((previous) =>
            previous.map((milestone, index) =>
                index === milestoneIndex
                    ? {
                          ...milestone,
                          work_items: (milestone.work_items ?? []).filter((_, itemIndex) => itemIndex !== workItemIndex),
                      }
                    : milestone,
            ),
        );
    }

    type Issue = {
        key: string;
        step: Step;
        message: string;
        severity: 'error' | 'warning';
    };

    function collectIssues(): Issue[] {
        const issues: Issue[] = [];

        if (!name.trim()) {
            issues.push({
                key: 'project-name',
                step: 1,
                severity: 'error',
                message: 'Project name is required.',
            });
        }

        if (!itemPrefix.trim()) {
            issues.push({
                key: 'project-prefix',
                step: 1,
                severity: 'error',
                message: 'Project prefix is required.',
            });
        }

        if (startDate && endDate && startDate > endDate) {
            issues.push({
                key: 'project-dates',
                step: 1,
                severity: 'error',
                message: 'Project end date must be on or after the start date.',
            });
        }

        milestones.forEach((milestone, milestoneIndex) => {
            const milestoneLabel = milestone.name.trim() || `Milestone ${milestoneIndex + 1}`;

            if (!milestone.name.trim()) {
                issues.push({
                    key: `m-${milestoneIndex}-name`,
                    step: 3,
                    severity: 'error',
                    message: `${milestoneLabel} needs a name.`,
                });
            }

            if (!milestone.start_date || !milestone.target_date) {
                issues.push({
                    key: `m-${milestoneIndex}-dates`,
                    step: 3,
                    severity: 'warning',
                    message: `${milestoneLabel} has no complete date range yet.`,
                });
            }

            if (milestone.start_date && milestone.target_date && milestone.start_date > milestone.target_date) {
                issues.push({
                    key: `m-${milestoneIndex}-range`,
                    step: 3,
                    severity: 'error',
                    message: `${milestoneLabel} has an invalid date range.`,
                });
            }

            milestone.groups.forEach((group, groupIndex) => {
                const groupLabel = group.name.trim() || `Group ${groupIndex + 1}`;

                if (!group.name.trim()) {
                    issues.push({
                        key: `g-${milestoneIndex}-${groupIndex}-name`,
                        step: 3,
                        severity: 'error',
                        message: `${groupLabel} in ${milestoneLabel} needs a name.`,
                    });
                }

                if (!group.start_date || !group.end_date) {
                    issues.push({
                        key: `g-${milestoneIndex}-${groupIndex}-dates`,
                        step: 3,
                        severity: 'warning',
                        message: `${groupLabel} has no complete date range yet.`,
                    });
                }

                if (group.start_date && group.end_date && group.start_date > group.end_date) {
                    issues.push({
                        key: `g-${milestoneIndex}-${groupIndex}-range`,
                        step: 3,
                        severity: 'error',
                        message: `${groupLabel} has an invalid date range.`,
                    });
                }

                group.work_items.forEach((item, workItemIndex) => {
                    const label = item.title.trim() || `Work item ${workItemIndex + 1}`;

                    if (!item.title.trim()) {
                        issues.push({
                            key: `w-${milestoneIndex}-${groupIndex}-${workItemIndex}-title`,
                            step: 3,
                            severity: 'error',
                            message: `${label} needs a title.`,
                        });
                    }

                    if (item.start_date && item.due_date && item.start_date > item.due_date) {
                        issues.push({
                            key: `w-${milestoneIndex}-${groupIndex}-${workItemIndex}-range`,
                            step: 3,
                            severity: 'error',
                            message: `${label} has an invalid date range.`,
                        });
                    }
                });
            });

            (milestone.work_items ?? []).forEach((item, workItemIndex) => {
                const label = item.title.trim() || `Ungrouped work item ${workItemIndex + 1}`;

                if (!item.title.trim()) {
                    issues.push({
                        key: `wm-${milestoneIndex}-${workItemIndex}-title`,
                        step: 3,
                        severity: 'error',
                        message: `${label} needs a title.`,
                    });
                }

                if (item.start_date && item.due_date && item.start_date > item.due_date) {
                    issues.push({
                        key: `wm-${milestoneIndex}-${workItemIndex}-range`,
                        step: 3,
                        severity: 'error',
                        message: `${label} has an invalid date range.`,
                    });
                }
            });
        });

        return issues;
    }

    function validateStep(targetStep: Step) {
        setErrorMessage(null);

        const issues = collectIssues().filter((issue) => issue.step <= targetStep && issue.severity === 'error');

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

        if (step < 4) {
            setStep((previous) => (previous + 1) as Step);
        }
    }

    function goBack() {
        if (step > 1) {
            setStep((previous) => (previous - 1) as Step);
        }
    }

    function handleSubmit() {
        setErrorMessage(null);

        const issues = collectIssues();
        const errors = issues.filter((issue) => issue.severity === 'error');

        if (errors.length > 0) {
            setErrorMessage(`${errors.length} item${errors.length === 1 ? '' : 's'} need attention before you can finish.`);

            setStep(errors[0].step);
            setActiveIssueKey(errors[0].key);

            return;
        }

        const validatedMilestones = milestones
            .filter((milestone) => milestone.name.trim())
            .map((milestone) => ({
                ...milestone,
                work_items: (milestone.work_items ?? []).filter((item) => item.title.trim()),
                groups: milestone.groups
                    .filter((group) => group.name.trim())
                    .map((group) => ({
                        ...group,
                        work_items: group.work_items.filter((item) => item.title.trim()),
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
            onError: (errors: Record<string, string>) => {
                setProcessing(false);
                const messages = Object.values((errors as Record<string, string>) || {}).flat();
                setErrorMessage(messages.length > 0 ? messages.join(' ') : 'Something went wrong while saving. Please try again.');
            },
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                onSuccess?.();
                onOpenChange(false);
            },
        };

        if (mode === 'edit' && projectId) {
            router.put(`/projects/${projectId}/setup`, payload, options);
        } else {
            router.post('/projects', payload, options);
        }
    }

    function requestClose() {
        if (processing) return;

        if (isDirty) {
            setShowCloseConfirm(true);
        } else {
            onOpenChange(false);
        }
    }

    function jumpToIssue(issueKey: string) {
        const issue = collectIssues().find((item) => item.key === issueKey);

        if (!issue) return;

        setStep(issue.step);
        setActiveIssueKey(issue.key);
        setErrorMessage(null);
    }

    const issues = collectIssues();

    const stepIssueCounts = ([1, 2, 3, 4] as Step[]).reduce<Record<number, number>>((acc, currentStep) => {
        acc[currentStep] = issues.filter((issue) => issue.step === currentStep && issue.severity === 'error').length;

        return acc;
    }, {});

    function renderBasics() {
        return (
            <Section title="Project details" description="The essentials for your project.">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project name</Label>

                        <Input
                            id="name"
                            autoFocus
                            value={name}
                            onChange={(event) => handleNameChange(event.target.value)}
                            placeholder="e.g. Website redesign"
                            className="h-10"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Status">
                            <select
                                id="status_name"
                                value={statusName}
                                onChange={(event) => setStatusName(event.target.value)}
                                className={selectClass}
                            >
                                {statuses.map((status) => (
                                    <option key={status.name} value={status.name}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label={
                                <>
                                    Project prefix
                                    <span className="text-muted-foreground ml-1 font-normal">(e.g. WR)</span>
                                </>
                            }
                        >
                            <Input
                                id="item_prefix"
                                value={itemPrefix}
                                onChange={(event) => {
                                    prefixTouchedByUser.current = true;

                                    setItemPrefix(event.target.value);
                                }}
                                placeholder="WR"
                                disabled={mode === 'edit'}
                                className="h-10"
                            />

                            {mode === 'create' && !prefixTouchedByUser.current && (
                                <p className="text-muted-foreground text-xs">Automatically generated from the project name.</p>
                            )}
                        </Field>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>

                        <textarea
                            id="description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={3}
                            placeholder="What is this project trying to achieve?"
                            className={textareaClass}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Start date">
                            <Input id="start_date" type="date" value={startDate} onChange={handleStartDateChange} className="h-10" />
                        </Field>

                        <Field label="End date">
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(event) => setEndDate(event.target.value)}
                                min={startDate}
                                disabled={!startDate}
                                className="h-10"
                            />
                        </Field>
                    </div>
                </div>
            </Section>
        );
    }

    function renderTeam() {
        return (
            <Section
                title="Project team"
                description="Choose who should have access to this project. You can change this later."
                action={<Badge variant="secondary">{memberIds.length} selected</Badge>}
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="h-10"
                    />

                    {uniqueRoles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            <FilterButton active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>
                                All
                            </FilterButton>

                            {uniqueRoles.map((role) => (
                                <FilterButton key={role} active={roleFilter === role} onClick={() => setRoleFilter(role)}>
                                    {role}
                                </FilterButton>
                            ))}
                        </div>
                    )}

                    <div className="divide-y overflow-hidden rounded-lg border">
                        {filteredUsers.length === 0 ? (
                            <p className="text-muted-foreground p-8 text-center text-sm">No members found.</p>
                        ) : (
                            filteredUsers.map((user) => {
                                const selected = memberIds.includes(user.id);

                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => toggleUser(user.id)}
                                        className="hover:bg-muted/40 flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
                                    >
                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                                            }`}
                                        >
                                            {selected && <Check className="h-3 w-3" />}
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{user.username}</span>

                                            <span className="text-muted-foreground block truncate text-xs">{user.email}</span>
                                        </span>

                                        {user.role && (
                                            <Badge variant="outline" className="hidden capitalize sm:inline-flex">
                                                {user.role}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </Section>
        );
    }

    function renderPlan() {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold">Project plan</h2>
                        <p className="text-muted-foreground mt-0.5 text-xs">Organize the work into milestones, groups, and tasks.</p>
                    </div>

                    <Button type="button" size="sm" onClick={addMilestone}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add milestone
                    </Button>
                </div>

                {milestones.length === 0 ? (
                    <EmptyState
                        icon={<Target className="text-muted-foreground h-5 w-5" />}
                        title="No milestones yet"
                        description="You can create the project without a plan and add milestones later."
                        action={
                            <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add milestone
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-2.5">
                        {milestones.map((milestone, milestoneIndex) => {
                            const key = String(milestone.id ?? `m-${milestoneIndex}`);

                            const expanded = expandedMilestones.has(key);

                            return (
                                <Collapsible key={key} open={expanded} onOpenChange={() => toggleSetValue(setExpandedMilestones, key)}>
                                    <div className="bg-background overflow-hidden rounded-lg border">
                                        <CollapsibleTrigger asChild>
                                            <button
                                                type="button"
                                                className="hover:bg-muted/40 flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors"
                                            >
                                                <span className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                                                    <Target className="text-primary h-3.5 w-3.5" />
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium">
                                                        {milestone.name || 'Untitled milestone'}
                                                    </span>

                                                    <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                                                        {dateRange(milestone.start_date, milestone.target_date)} · {milestone.groups.length}{' '}
                                                        {milestone.groups.length === 1 ? 'group' : 'groups'}
                                                    </span>
                                                </span>

                                                <ChevronDown
                                                    className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                                                        expanded ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </button>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <div className="border-t px-3.5 py-4 sm:px-4">
                                                <div className="space-y-5">
                                                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px_150px]">
                                                        <Field label="Name">
                                                            <Input
                                                                value={milestone.name}
                                                                onChange={(event) => updateMilestone(milestoneIndex, 'name', event.target.value)}
                                                                placeholder="Website launch"
                                                            />
                                                        </Field>

                                                        <DateField
                                                            label="Start"
                                                            min={startDate}
                                                            max={endDate}
                                                            value={milestone.start_date}
                                                            onChange={(value) => updateMilestone(milestoneIndex, 'start_date', value)}
                                                        />

                                                        <DateField
                                                            label="Target"
                                                            min={milestone.start_date || startDate}
                                                            max={endDate}
                                                            value={milestone.target_date}
                                                            onChange={(value) => updateMilestone(milestoneIndex, 'target_date', value)}
                                                        />
                                                    </div>

                                                    <Field
                                                        label={
                                                            <>
                                                                Description <span className="text-muted-foreground font-normal">(optional)</span>
                                                            </>
                                                        }
                                                    >
                                                        <textarea
                                                            value={milestone.description}
                                                            onChange={(event) => updateMilestone(milestoneIndex, 'description', event.target.value)}
                                                            rows={2}
                                                            placeholder="Add context or acceptance criteria..."
                                                            className={textareaClass}
                                                        />
                                                    </Field>

                                                    <div className="space-y-2">
                                                        <SubsectionHeader
                                                            title="Groups"
                                                            description="Break this milestone into areas of work."
                                                            action={
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => addGroup(milestoneIndex)}
                                                                >
                                                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                                    Add group
                                                                </Button>
                                                            }
                                                        />

                                                        {milestone.groups.length === 0 ? (
                                                            <EmptyInline text="No groups yet." />
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {milestone.groups.map((group, groupIndex) =>
                                                                    renderGroup(milestoneIndex, milestone, group, groupIndex),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <SubsectionHeader
                                                            title="Direct work"
                                                            description="Tasks that don't need a group."
                                                            action={
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => addMilestoneWorkItem(milestoneIndex)}
                                                                >
                                                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                                    Add task
                                                                </Button>
                                                            }
                                                        />

                                                        {(milestone.work_items ?? []).length === 0 ? (
                                                            <EmptyInline text="No direct work items." />
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {(milestone.work_items ?? []).map((item, index) =>
                                                                    renderMilestoneWorkItem(milestoneIndex, milestone, item, index),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-end border-t pt-3">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => removeMilestone(milestoneIndex)}
                                                        >
                                                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                                            Remove milestone
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            );
                        })}
                    </div>
                )}

                {errorMessage && <ErrorMessage message={errorMessage} />}
            </div>
        );
    }

    function renderReview() {
        const errorCount = issues.filter((issue) => issue.severity === 'error').length;

        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-sm font-semibold">Review</h2>

                    <p className="text-muted-foreground mt-0.5 text-xs">Check the details before saving.</p>
                </div>

                {errorCount > 0 && (
                    <ErrorMessage message={`${errorCount} item${errorCount === 1 ? '' : 's'} need attention before you can finish.`} />
                )}

                <Section title="Project">
                    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                        <Summary label="Name" value={name || 'Untitled project'} />

                        <Summary label="Status" value={statusName || 'Not set'} />

                        <Summary label="Dates" value={dateRange(startDate, endDate)} />

                        <Summary label="Prefix" value={itemPrefix || 'Not set'} />

                        <Summary label="Team" value={`${memberIds.length} ${memberIds.length === 1 ? 'member' : 'members'}`} />

                        <Summary label="Plan" value={`${milestones.length} milestones · ${totalGroups} groups · ${totalWorkItems} items`} />
                    </div>
                </Section>

                {milestones.length > 0 && (
                    <Section title="Milestones">
                        <div className="space-y-1.5">
                            {milestones.map((milestone, index) => (
                                <div key={milestone.id ?? index} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                                    <Target className="text-muted-foreground h-4 w-4 shrink-0" />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{milestone.name || 'Untitled milestone'}</p>

                                        <p className="text-muted-foreground truncate text-xs">
                                            {dateRange(milestone.start_date, milestone.target_date)}
                                        </p>
                                    </div>

                                    <span className="text-muted-foreground hidden text-xs sm:block">{milestone.groups.length} groups</span>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {issues.length > 0 && (
                    <Section title="Checks">
                        <div className="space-y-1.5">
                            {issues.slice(0, 5).map((issue) => (
                                <button
                                    key={issue.key}
                                    type="button"
                                    onClick={() => jumpToIssue(issue.key)}
                                    className="hover:bg-muted/40 w-full rounded-md border px-3 py-2 text-left"
                                >
                                    <span className={`text-xs font-medium ${issue.severity === 'error' ? 'text-destructive' : 'text-amber-600'}`}>
                                        {issue.severity === 'error' ? 'Fix' : 'Review'} · {STEP_LABELS[issue.step]}
                                    </span>

                                    <span className="text-muted-foreground mt-0.5 block text-xs">{issue.message}</span>
                                </button>
                            ))}

                            {issues.length > 5 && <p className="text-muted-foreground pt-1 text-xs">+ {issues.length - 5} more</p>}
                        </div>
                    </Section>
                )}
            </div>
        );
    }

    function renderGroup(milestoneIndex: number, milestone: NestedMilestone, group: NestedGroup, groupIndex: number) {
        const key = `${milestoneIndex}-${group.id ?? `g-${groupIndex}`}`;
        const expanded = expandedGroups.has(key);

        return (
            <Collapsible key={key} open={expanded} onOpenChange={() => toggleSetValue(setExpandedGroups, key)}>
                <div className="bg-muted/20 overflow-hidden rounded-md border">
                    <CollapsibleTrigger asChild>
                        <button type="button" className="hover:bg-muted/40 flex w-full items-center gap-2.5 px-3 py-2.5 text-left">
                            <FolderKanban className="text-primary h-4 w-4 shrink-0" />

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{group.name || 'Untitled group'}</span>

                                <span className="text-muted-foreground block truncate text-xs">
                                    {group.work_items.length} {group.work_items.length === 1 ? 'work item' : 'work items'} ·{' '}
                                    {dateRange(group.start_date, group.end_date)}
                                </span>
                            </span>

                            <ChevronDown className={`text-muted-foreground h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <div className="bg-background space-y-4 border-t px-3 py-3.5 sm:px-4">
                            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_145px_145px]">
                                <Field label="Name">
                                    <Input
                                        value={group.name}
                                        onChange={(event) => updateGroup(milestoneIndex, groupIndex, 'name', event.target.value)}
                                        placeholder="Frontend"
                                    />
                                </Field>

                                <DateField
                                    label="Start"
                                    min={milestone.start_date || startDate}
                                    max={milestone.target_date || endDate}
                                    value={group.start_date}
                                    onChange={(value) => updateGroup(milestoneIndex, groupIndex, 'start_date', value)}
                                />

                                <DateField
                                    label="End"
                                    min={group.start_date || milestone.start_date || startDate}
                                    max={milestone.target_date || endDate}
                                    value={group.end_date}
                                    onChange={(value) => updateGroup(milestoneIndex, groupIndex, 'end_date', value)}
                                />
                            </div>

                            <Field
                                label={
                                    <>
                                        Description <span className="text-muted-foreground font-normal">(optional)</span>
                                    </>
                                }
                            >
                                <textarea
                                    value={group.description}
                                    onChange={(event) => updateGroup(milestoneIndex, groupIndex, 'description', event.target.value)}
                                    rows={2}
                                    placeholder="Add context..."
                                    className={textareaClass}
                                />
                            </Field>

                            <div className="space-y-2">
                                <div>
                                    <Label className="text-xs">Team assigned</Label>

                                    <p className="text-muted-foreground mt-0.5 text-xs">People working on this group.</p>
                                </div>

                                <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2.5">
                                    {projectMembers.length === 0 ? (
                                        <p className="text-muted-foreground px-1 py-2 text-xs">Add project members on the Team step first.</p>
                                    ) : (
                                        projectMembers.map((user) => (
                                            <label key={user.id} className="hover:bg-muted/40 flex items-center gap-2 rounded px-1.5 py-1 text-sm">
                                                <Checkbox
                                                    checked={(group.assignee_ids ?? []).includes(user.id)}
                                                    onCheckedChange={() => toggleGroupAssignee(milestoneIndex, groupIndex, user.id)}
                                                />

                                                <span className="truncate">{user.username}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-3">
                                <SubsectionHeader
                                    title="Work items"
                                    description="Tasks belonging to this group."
                                    action={
                                        <Button type="button" size="sm" variant="outline" onClick={() => addWorkItem(milestoneIndex, groupIndex)}>
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            Add task
                                        </Button>
                                    }
                                />

                                {group.work_items.length === 0 ? (
                                    <EmptyInline text="No work items yet." />
                                ) : (
                                    <div className="space-y-1.5">
                                        {group.work_items.map((item, index) =>
                                            renderWorkItem(milestoneIndex, groupIndex, item, index, milestone, group),
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end border-t pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeGroup(milestoneIndex, groupIndex)}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
        milestone: NestedMilestone,
        group: NestedGroup,
    ) {
        const key = `${milestoneIndex}-${groupIndex}-${item.id ?? `w-${workItemIndex}`}`;
        const expanded = expandedWorkItems.has(key);
        const assignee = allUsers.find((user) => user.id === item.assignee_id);

        return (
            <Collapsible key={key} open={expanded} onOpenChange={() => toggleSetValue(setExpandedWorkItems, key)}>
                <div className="bg-background ml-2 overflow-hidden rounded-md border">
                    <CollapsibleTrigger asChild>
                        <button type="button" className="hover:bg-muted/40 flex w-full items-center gap-2.5 px-3 py-2 text-left">
                            <FileText className="text-muted-foreground h-3.5 w-3.5 shrink-0" />

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-medium">{item.title || 'Untitled work item'}</span>

                                <span className="text-muted-foreground block truncate text-[11px]">
                                    <span className="capitalize">{item.priority}</span>
                                    {' · '}
                                    {assignee?.username ?? 'Unassigned'}
                                    {' · '}
                                    {getWorkItemStatusName(item.status_id, workItemStatuses)}
                                </span>
                            </span>

                            <ChevronDown className={`text-muted-foreground h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <WorkItemForm
                            item={item}
                            memberIds={memberIds}
                            allUsers={allUsers}
                            workItemStatuses={workItemStatuses}
                            dateBounds={{
                                min: group.start_date || milestone.start_date || startDate,
                                max: group.end_date || milestone.target_date || endDate,
                            }}
                            onChange={(field, value) => updateWorkItem(milestoneIndex, groupIndex, workItemIndex, field, value)}
                            onRemove={() => removeWorkItem(milestoneIndex, groupIndex, workItemIndex)}
                        />
                    </CollapsibleContent>
                </div>
            </Collapsible>
        );
    }

    function renderMilestoneWorkItem(milestoneIndex: number, milestone: NestedMilestone, item: NestedWorkItem, workItemIndex: number) {
        const key = `${milestoneIndex}-milestone-${item.id ?? `w-${workItemIndex}`}`;
        const expanded = expandedWorkItems.has(key);
        const assignee = allUsers.find((user) => user.id === item.assignee_id);

        return (
            <Collapsible key={key} open={expanded} onOpenChange={() => toggleSetValue(setExpandedWorkItems, key)}>
                <div className="border-primary/40 bg-primary/[0.025] overflow-hidden rounded-md border border-dashed">
                    <CollapsibleTrigger asChild>
                        <button type="button" className="hover:bg-primary/5 flex w-full items-center gap-2.5 px-3 py-2.5 text-left">
                            <FileText className="text-primary h-3.5 w-3.5 shrink-0" />

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-medium">{item.title || 'Untitled work item'}</span>

                                <span className="text-muted-foreground block truncate text-[11px]">
                                    <span className="capitalize">{item.priority}</span>
                                    {' · '}
                                    {assignee?.username ?? 'Unassigned'}
                                    {' · '}
                                    {getWorkItemStatusName(item.status_id, workItemStatuses)}
                                </span>
                            </span>

                            <Badge variant="outline" className="hidden shrink-0 text-[10px] sm:inline-flex">
                                Ungrouped
                            </Badge>

                            <ChevronDown className={`text-muted-foreground h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <WorkItemForm
                            item={item}
                            memberIds={memberIds}
                            allUsers={allUsers}
                            workItemStatuses={workItemStatuses}
                            dateBounds={{
                                min: milestone.start_date || startDate,
                                max: milestone.target_date || endDate,
                            }}
                            onChange={(field, value) => updateMilestoneWorkItem(milestoneIndex, workItemIndex, field, value)}
                            onRemove={() => removeMilestoneWorkItem(milestoneIndex, workItemIndex)}
                        />
                    </CollapsibleContent>
                </div>
            </Collapsible>
        );
    }

    function renderStepContent() {
        if (step === 1) {
            return renderBasics();
        }

        if (step === 2) {
            return renderTeam();
        }

        if (step === 3) {
            return renderPlan();
        }

        return renderReview();
    }

    const footerMessage =
        step === 3
            ? `${milestones.length} milestones · ${totalGroups} groups · ${totalWorkItems} items`
            : step === 2
              ? `${memberIds.length} ${memberIds.length === 1 ? 'member' : 'members'} selected`
              : step === 1
                ? isDirty
                    ? 'Changes will be saved when you finish.'
                    : 'No changes yet.'
                : issues.some((issue) => issue.severity === 'error')
                  ? `${issues.filter((issue) => issue.severity === 'error').length} blocking issue${
                        issues.filter((issue) => issue.severity === 'error').length === 1 ? '' : 's'
                    }.`
                  : 'Everything is ready.';

    return (
        <Sheet open={open} onOpenChange={requestClose}>
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[780px]">
                <SheetHeader className="border-b px-5 py-4 text-left sm:px-6">
                    <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <SheetTitle className="truncate text-base">
                                    {mode === 'create' ? 'Create project' : `Edit ${project.name}`}
                                </SheetTitle>

                                {isDirty && (
                                    <Badge variant="outline" className="hidden shrink-0 text-[10px] sm:inline-flex">
                                        Unsaved changes
                                    </Badge>
                                )}
                            </div>

                            <SheetDescription className="mt-1 max-w-xl text-xs">
                                {mode === 'create'
                                    ? 'Set up the essentials now. You can expand the plan later.'
                                    : 'Update the project without disturbing your existing plan.'}
                            </SheetDescription>
                        </div>

                        <Button type="button" variant="ghost" size="icon" className="-mt-1 -mr-2 shrink-0" onClick={requestClose} aria-label="Close">
                            <span className="text-lg leading-none">×</span>
                        </Button>
                    </div>

                    <div className="mt-4 flex items-center" aria-label="Project setup progress">
                        {([1, 2, 3, 4] as Step[]).map((item, index) => {
                            const active = item === step;
                            const complete = item < step;
                            const count = stepIssueCounts[item] ?? 0;

                            return (
                                <div key={item} className="flex flex-1 items-center">
                                    <button
                                        type="button"
                                        disabled={item > step}
                                        onClick={() => {
                                            if (item <= step) {
                                                setStep(item);
                                            }
                                        }}
                                        className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                                            active ? 'text-foreground' : complete ? 'text-foreground' : 'text-muted-foreground'
                                        } ${item > step ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                                                complete || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {complete ? <Check className="h-3 w-3" /> : item}
                                        </span>

                                        <span className="hidden sm:inline">{STEP_LABELS[item]}</span>

                                        {count > 0 && item <= step && <span className="text-[10px] text-amber-600">{count}</span>}
                                    </button>

                                    {index < 3 && <div className={`mx-2 h-px flex-1 ${complete ? 'bg-primary/40' : 'bg-border'}`} />}
                                </div>
                            );
                        })}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-2xl px-5 py-5 sm:px-6 sm:py-6">{renderStepContent()}</div>
                </div>

                <SheetFooter className="bg-background border-t px-5 py-3.5 sm:px-6">
                    <div className="flex w-full items-center justify-between gap-3">
                        <p className="text-muted-foreground min-w-0 truncate text-xs">
                            <span className="hidden sm:inline">Step {step} of 4 · </span>
                            {footerMessage}
                        </p>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <Button type="button" variant="ghost" size="sm" onClick={requestClose} disabled={processing}>
                                Cancel
                            </Button>

                            {step > 1 && (
                                <Button type="button" variant="outline" size="sm" onClick={goBack} disabled={processing}>
                                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                                    Back
                                </Button>
                            )}

                            {step < 4 ? (
                                <Button type="button" size="sm" onClick={goNext} disabled={processing}>
                                    Continue
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={processing || issues.some((issue) => issue.severity === 'error')}
                                >
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

                        <AlertDialogDescription>Your changes haven't been saved. Closing now will lose them.</AlertDialogDescription>
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

function WorkItemForm({
    item,
    memberIds,
    allUsers,
    workItemStatuses,
    dateBounds,
    onChange,
    onRemove,
}: {
    item: NestedWorkItem;
    memberIds: number[];
    allUsers: UserOption[];
    workItemStatuses: WorkItemStatusOption[];
    dateBounds: { min: string; max: string };
    onChange: (field: keyof NestedWorkItem, value: string | number | null) => void;
    onRemove: () => void;
}) {
    const members = allUsers.filter((user) => memberIds.includes(user.id));

    return (
        <div className="bg-muted/10 space-y-4 border-t px-3 py-3.5 sm:px-4">
            <Field label="Title">
                <Input
                    value={item.title}
                    autoFocus={!item.title}
                    onChange={(event) => onChange('title', event.target.value)}
                    placeholder="What needs to be done?"
                />
            </Field>

            <Field
                label={
                    <>
                        Description <span className="text-muted-foreground font-normal">(optional)</span>
                    </>
                }
            >
                <textarea
                    value={item.description}
                    onChange={(event) => onChange('description', event.target.value)}
                    rows={2}
                    placeholder="Add context..."
                    className={textareaClass}
                />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
                <SelectField
                    label="Priority"
                    value={item.priority}
                    onChange={(value) => onChange('priority', value)}
                    options={PRIORITIES.map((priority) => ({
                        value: priority,
                        label: priority.charAt(0).toUpperCase() + priority.slice(1),
                    }))}
                />

                <SelectField
                    label="Status"
                    value={item.status_id?.toString() ?? ''}
                    onChange={(value) => onChange('status_id', value ? Number(value) : null)}
                    options={[
                        {
                            value: '',
                            label: 'No status',
                        },
                        ...Array.from(new Map(workItemStatuses.map((status) => [status.id, status])).values()).map((status) => ({
                            value: status.id.toString(),
                            label: status.name,
                        })),
                    ]}
                />

                <SelectField
                    label="Assignee"
                    value={item.assignee_id?.toString() ?? ''}
                    onChange={(value) => onChange('assignee_id', value ? Number(value) : null)}
                    options={[
                        {
                            value: '',
                            label: 'Unassigned',
                        },
                        ...members.map((user) => ({
                            value: user.id.toString(),
                            label: user.username,
                        })),
                    ]}
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <DateField
                    label="Start"
                    min={dateBounds.min}
                    max={dateBounds.max}
                    value={item.start_date}
                    onChange={(value) => onChange('start_date', value)}
                />

                <DateField
                    label="Due"
                    min={item.start_date || dateBounds.min}
                    max={dateBounds.max}
                    value={item.due_date}
                    onChange={(value) => onChange('due_date', value)}
                />
            </div>

            <div className="flex justify-end border-t pt-2">
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onRemove}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remove
                </Button>
            </div>
        </div>
    );
}

function Section({
    title,
    description,
    action,
    children,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Card className="shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-4 py-3.5 sm:px-5">
                <div>
                    <CardTitle className="text-sm">{title}</CardTitle>

                    {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
                </div>

                {action}
            </CardHeader>

            <CardContent className="border-t px-4 py-4 sm:px-5">{children}</CardContent>
        </Card>
    );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
        </div>
    );
}

function DateField({
    label,
    value,
    onChange,
    min,
    max,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
}) {
    return (
        <Field label={label}>
            <Input type="date" value={value} min={min || undefined} max={max || undefined} onChange={(event) => onChange(event.target.value)} />
        </Field>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: {
        value: string;
        label: string;
    }[];
}) {
    return (
        <Field label={label}>
            <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <Button type="button" size="sm" variant={active ? 'secondary' : 'ghost'} onClick={onClick} className="h-7 px-2.5 text-xs">
            {children}
        </Button>
    );
}

function SubsectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs font-medium">{title}</p>

                {description && <p className="text-muted-foreground mt-0.5 text-[11px]">{description}</p>}
            </div>

            {action}
        </div>
    );
}

function EmptyInline({ text }: { text: string }) {
    return (
        <div className="rounded-md border border-dashed px-3 py-3 text-center">
            <p className="text-muted-foreground text-xs">{text}</p>
        </div>
    );
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center rounded-lg border border-dashed px-6 py-10 text-center">
            <div className="bg-muted mb-3 rounded-full p-2.5">{icon}</div>

            <h3 className="text-sm font-medium">{title}</h3>

            <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-5">{description}</p>

            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">{label}</p>

            <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
        </div>
    );
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

            <p className="text-xs">{message}</p>
        </div>
    );
}

const selectClass =
    'border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-2.5 py-1 text-sm shadow-sm outline-none focus-visible:ring-1';

const textareaClass =
    'border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1';
