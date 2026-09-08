import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; 
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, FileText, FolderKanban, Plus, Target, Trash2} from 'lucide-react';
import { DateField, ErrorMessage, Summary } from './fields';
import { dateRange, formatDate, getWorkItemStatusName } from './utils';
import { type SetupController } from './use-project-setup';
import { type SetupIssue } from './validation';
import { type NestedGroup, type NestedWorkItem, PRIORITIES, type UserOption, type WorkItemStatusOption} from './types';

/*
 * Step 3 - Plan: milestone/group/work-item tree. JSX and nested render helpers sliced verbatim
 * from project-setup-sheet.tsx (lines 1474-1777, 1907-2137, 2140-2516).
 */

export function SetupStepPlan({
    setup,
    allUsers = [],
    workItemStatuses = [],
    issues = [] as SetupIssue[],
    mode = 'create' as 'create' | 'edit',
}: {
    setup: SetupController;
    allUsers?: UserOption[];
    workItemStatuses?: WorkItemStatusOption[];
    issues?: SetupIssue[];
    mode?: 'create' | 'edit';
}) {
    const {
    step,
    name,
    handleNameChange,
    itemPrefix,
    setItemPrefix,
    description,
    setDescription,
    startDate,
    handleStartDateChange,
    endDate,
    handleEndDateChange,
    statusName,
    setStatusName,
    projectStatuses,
    addStatus,
    updateStatus,
    removeStatus,
    moveStatus,
    memberIds,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    uniqueRoles,
    filteredUsers,
    toggleUser,
    milestones,
    expandedMilestones,
    setExpandedMilestones,
    expandedGroups,
    setExpandedGroups,
    expandedWorkItems,
    setExpandedWorkItems,
    addMilestone,
    updateMilestone,
    removeMilestone,
    addGroup,
    updateGroup,
    toggleGroupAssignee,
    removeGroup,
    addWorkItem,
    updateWorkItem,
    removeWorkItem,
    toggleSetValue,
    totalGroups,
    totalWorkItems,
    isDirty,
    processing,
    errorMessage,
    setErrorMessage,
    showCloseConfirm,
    setShowCloseConfirm,
    activeIssueKey,
    setActiveIssueKey,
    } = setup;

    return (
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-medium">
                                Plan the work
                            </h3>

                            <p className="text-muted-foreground mt-1 text-sm">
                                Organize the project into milestones, groups, and work items.
                            </p>
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            onClick={addMilestone}
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add milestone
                        </Button>
                    </div>

                    {milestones.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                <div className="bg-muted mb-3 rounded-full p-3">
                                    <Target className="text-muted-foreground h-5 w-5" />
                                </div>

                                <h3 className="font-medium">
                                    No milestones yet
                                </h3>

                                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                                    You can create the project without a plan and add milestones later, or start building the plan now.
                                </p>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-4"
                                    onClick={
                                        addMilestone
                                    }
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Add your first
                                    milestone
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {milestones.map(
                                (
                                    milestone,
                                    milestoneIndex,
                                ) => {
                                    const milestoneKey =
                                        String(
                                            milestone.id ??
                                                `m-${milestoneIndex}`,
                                        );

                                    const expanded =
                                        expandedMilestones.has(
                                            milestoneKey,
                                        );

                                    return (
                                        <Collapsible
                                            key={
                                                milestoneKey
                                            }
                                            open={
                                                expanded
                                            }
                                            onOpenChange={() =>
                                                toggleSetValue(
                                                    setExpandedMilestones,
                                                    milestoneKey,
                                                )
                                            }
                                        >
                                            <Card>
                                                <CollapsibleTrigger
                                                    asChild
                                                >
                                                    <button
                                                        type="button"
                                                        className="hover:bg-muted/30 flex w-full items-center gap-3 p-4 text-left transition-colors"
                                                    >
                                                        <Target className="text-muted-foreground h-4 w-4 shrink-0" />

                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate font-medium">
                                                                {milestone.name ||
                                                                    'Untitled milestone'}
                                                            </span>

                                                            <span className="text-muted-foreground mt-0.5 block text-xs">
                                                                {dateRange(
                                                                    milestone.start_date,
                                                                    milestone.target_date,
                                                                )}{' '}
                                                                ·{' '}
                                                                {
                                                                    milestone
                                                                        .groups
                                                                        .length
                                                                }{' '}
                                                                {milestone
                                                                    .groups
                                                                    .length ===
                                                                1
                                                                    ? 'group'
                                                                    : 'groups'}
                                                            </span>
                                                        </span>

                                                        <ChevronDown
                                                            className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                                                                expanded
                                                                    ? 'rotate-180'
                                                                    : ''
                                                            }`}
                                                        />
                                                    </button>
                                                </CollapsibleTrigger>

                                                <CollapsibleContent>
                                                    <CardContent className="border-t p-4">
                                                        <div className="space-y-5">
                                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                                <div className="space-y-2 lg:col-span-2">
                                                                    <Label htmlFor={`milestone-${milestoneIndex}-name`}>
                                                                        Name
                                                                    </Label>

                                                                    <Input
                                                                        id={`milestone-${milestoneIndex}-name`}
                                                                        value={
                                                                            milestone.name
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            updateMilestone(
                                                                                milestoneIndex,
                                                                                'name',
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="Website launch"
                                                                    />
                                                                </div>

                                                                <DateField
                                                                    label="Start"
                                                                    value={
                                                                        milestone.start_date
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        updateMilestone(
                                                                            milestoneIndex,
                                                                            'start_date',
                                                                            value,
                                                                        )
                                                                    }
                                                                />

                                                                <DateField
                                                                    label="Target"
                                                                    value={
                                                                        milestone.target_date
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        updateMilestone(
                                                                            milestoneIndex,
                                                                            'target_date',
                                                                            value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label htmlFor={`milestone-${milestoneIndex}-description`}>
                                                                    Description{' '}
                                                                    <span className="text-muted-foreground font-normal">
                                                                        (optional)
                                                                    </span>
                                                                </Label>

                                                                <textarea
                                                                    id={`milestone-${milestoneIndex}-description`}
                                                                    value={
                                                                        milestone.description
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateMilestone(
                                                                            milestoneIndex,
                                                                            'description',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    rows={
                                                                        3
                                                                    }
                                                                    placeholder="Add context or acceptance criteria..."
                                                                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                                                                />
                                                            </div>

                                                            <div className="flex items-center justify-between border-t pt-4">
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        Groups
                                                                    </p>

                                                                    <p className="text-muted-foreground text-xs">
                                                                        Break this milestone into areas of work.
                                                                    </p>
                                                                </div>

                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        addGroup(
                                                                            milestoneIndex,
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus className="mr-1.5 h-4 w-4" />
                                                                    Add
                                                                    group
                                                                </Button>
                                                            </div>

                                                            {milestone.groups.length ===
                                                            0 ? (
                                                                <p className="text-muted-foreground rounded-lg border border-dashed p-5 text-center text-sm">
                                                                    No groups yet. Add one when you're ready.
                                                                </p>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {milestone.groups.map(
                                                                        (
                                                                            group,
                                                                            groupIndex,
                                                                        ) =>
                                                                            renderGroup(
                                                                                milestoneIndex,
                                                                                group,
                                                                                groupIndex,
                                                                            ),
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="flex justify-end border-t pt-4">
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                                                            Remove
                                                                            milestone
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Remove
                                                                                milestone?
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                “
                                                                                {milestone.name ||
                                                                                    'Untitled milestone'}
                                                                                ”
                                                                                and
                                                                                its{' '}
                                                                                {milestone.groups.length}{' '}
                                                                                group
                                                                                {milestone.groups.length === 1 ? '' : 's'}{' '}
                                                                                and
                                                                                work
                                                                                items
                                                                                will
                                                                                be
                                                                                removed
                                                                                from
                                                                                this
                                                                                draft.
                                                                                This
                                                                                can’t
                                                                                be
                                                                                undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>
                                                                                Cancel
                                                                            </AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                onClick={() =>
                                                                                    removeMilestone(
                                                                                        milestoneIndex,
                                                                                    )
                                                                                }
                                                                            >
                                                                                Remove
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </CollapsibleContent>
                                            </Card>
                                        </Collapsible>
                                    );
                                },
                            )}
                        </div>
                    )}

                    {errorMessage && (
                        <ErrorMessage
                            message={errorMessage}
                        />
                    )}
                </div>
    );

    function renderGroup(
        milestoneIndex: number,
        group: NestedGroup,
        groupIndex: number,
    ) {
        const groupKey = `${milestoneIndex}-${
            group.id ?? `g-${groupIndex}`
        }`;

        const expanded =
            expandedGroups.has(groupKey);

        return (
            <Collapsible
                key={groupKey}
                open={expanded}
                onOpenChange={() =>
                    toggleSetValue(
                        setExpandedGroups,
                        groupKey,
                    )
                }
            >
                <div className="border-l-primary/40 bg-card rounded-lg border border-l-4 transition-colors">
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="bg-muted/40 hover:bg-muted/60 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                        >
                            <FolderKanban className="text-primary h-4 w-4 shrink-0" />

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                    {group.name ||
                                        'Untitled group'}
                                </span>

                                <span className="text-muted-foreground block text-xs">
                                    {
                                        group
                                            .work_items
                                            .length
                                    }{' '}
                                    {group
                                        .work_items
                                        .length ===
                                    1
                                        ? 'work item'
                                        : 'work items'}{' '}
                                    ·{' '}
                                    {dateRange(
                                        group.start_date,
                                        group.end_date,
                                    )}
                                </span>
                            </span>

                            <ChevronDown
                                className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                                    expanded
                                        ? 'rotate-180'
                                        : ''
                                }`}
                            />
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>

                        <div className="space-y-5 border-t p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="min-w-0 space-y-2 lg:col-span-2">
                                    <Label htmlFor={`group-${milestoneIndex}-${groupIndex}-name`}>Name</Label>

                                    <Input
                                        id={`group-${milestoneIndex}-${groupIndex}-name`}
                                        value={
                                            group.name
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateGroup(
                                                milestoneIndex,
                                                groupIndex,
                                                'name',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Frontend"
                                    />
                                </div>

                                <DateField
                                    label="Start"
                                    value={
                                        group.start_date
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        updateGroup(
                                            milestoneIndex,
                                            groupIndex,
                                            'start_date',
                                            value,
                                        )
                                    }
                                />

                                <DateField
                                    label="End"
                                    value={
                                        group.end_date
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        updateGroup(
                                            milestoneIndex,
                                            groupIndex,
                                            'end_date',
                                            value,
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`group-${milestoneIndex}-${groupIndex}-description`}>
                                    Description{' '}
                                    <span className="text-muted-foreground font-normal">
                                        (optional)
                                    </span>
                                </Label>

                                <textarea
                                    id={`group-${milestoneIndex}-${groupIndex}-description`}
                                    value={
                                        group.description
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateGroup(
                                            milestoneIndex,
                                            groupIndex,
                                            'description',
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    rows={3}
                                    placeholder="Add context or acceptance criteria..."
                                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <div>
                                    <p className="text-sm font-medium">
                                        Work items
                                    </p>

                                    <p className="text-muted-foreground text-xs">
                                        Tasks belonging to this group.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        addWorkItem(
                                            milestoneIndex,
                                            groupIndex,
                                        )
                                    }
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Add work item
                                </Button>
                            </div>

                            {group.work_items.length ===
                            0 ? (
                                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                                    No work items yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {group.work_items.map(
                                        (
                                            item,
                                            workItemIndex,
                                        ) =>
                                            renderWorkItem(
                                                milestoneIndex,
                                                groupIndex,
                                                item,
                                                workItemIndex,
                                            ),
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end border-t pt-3">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                            Remove group
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Remove group?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                “
                                                {group.name || 'Untitled group'}
                                                ”
                                                and its{' '}
                                                {group.work_items.length} work
                                                item
                                                {group.work_items.length === 1 ? '' : 's'}{' '}
                                                will be removed from this
                                                draft. This can’t be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={() =>
                                                    removeGroup(
                                                        milestoneIndex,
                                                        groupIndex,
                                                    )
                                                }
                                            >
                                                Remove
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
        const workItemKey = `${milestoneIndex}-${groupIndex}-${
            item.id ?? `w-${workItemIndex}`
        }`;

        const expanded =
            expandedWorkItems.has(
                workItemKey,
            );

        const assignee = allUsers.find(
            (user) =>
                user.id === item.assignee_id,
        );

        return (
            <Collapsible
                key={workItemKey}
                open={expanded}
                onOpenChange={() =>
                    toggleSetValue(
                        setExpandedWorkItems,
                        workItemKey,
                    )
                }
            >
                <div className="bg-background/60 ml-4 rounded-md border transition-colors ">
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="hover:bg-muted/40 flex w-full items-center gap-2.5 p-2.5 text-left transition-colors"
                        >
                            <FileText className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />

                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                    {item.title ||
                                        'Untitled work item'}
                                </span>

                                <span className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 text-xs">
                                    <span className="capitalize">
                                        {
                                            item.priority
                                        }
                                    </span>

                                    <span>·</span>

                                    <span>
                                        {
                                            assignee?.username ??
                                            'Unassigned'
                                        }
                                    </span>

                                    <span>·</span>

                                    <span>
                                        {getWorkItemStatusName(
                                            item.status_id,
                                            workItemStatuses,
                                        )}
                                    </span>
                                </span>
                            </span>

                            <ChevronDown
                                className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                                    expanded
                                        ? 'rotate-180'
                                        : ''
                                }`}
                            />
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <div className="space-y-4 border-t p-4">
                            <div className="space-y-2 w-1/2">
                                <Label htmlFor={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-title`}>
                                    Title
                                </Label>

                                <Input
                                    id={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-title`}
                                    value={
                                        item.title
                                    }
                                    autoFocus={
                                        item.title ===
                                        ''
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateWorkItem(
                                            milestoneIndex,
                                            groupIndex,
                                            workItemIndex,
                                            'title',
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="What needs to be done?"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-description`}>
                                    Description{' '}
                                    <span className="text-muted-foreground font-normal">
                                        (optional)
                                    </span>
                                </Label>

                                <textarea
                                    id={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-description`}
                                    value={
                                        item.description
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateWorkItem(
                                            milestoneIndex,
                                            groupIndex,
                                            workItemIndex,
                                            'description',
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    rows={3}
                                    placeholder="Add context or acceptance criteria..."
                                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-priority`}>
                                        Priority
                                    </Label>

                                    <select
                                        id={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-priority`}
                                        value={
                                            item.priority
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateWorkItem(
                                                milestoneIndex,
                                                groupIndex,
                                                workItemIndex,
                                                'priority',
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        {PRIORITIES.map(
                                            (
                                                priority,
                                            ) => (
                                                <option
                                                    key={
                                                        priority
                                                    }
                                                    value={
                                                        priority
                                                    }
                                                >
                                                    {priority
                                                        .charAt(
                                                            0,
                                                        )
                                                        .toUpperCase() +
                                                        priority.slice(
                                                            1,
                                                        )}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-status`}>
                                        Status
                                    </Label>

                                    <select
                                        id={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-status`}
                                        value={
                                            item.status_id ??
                                            ''
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateWorkItem(
                                                milestoneIndex,
                                                groupIndex,
                                                workItemIndex,
                                                'status_id',
                                                event
                                                    .target
                                                    .value
                                                    ? Number(
                                                          event
                                                              .target
                                                              .value,
                                                      )
                                                    : null,
                                            )
                                        }
                                        className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">
                                            No status
                                        </option>

                                        {Array.from(
                                            new Map(
                                                workItemStatuses.map(
                                                    (status) => [
                                                        status.name,
                                                        status,
                                                    ],
                                                ),
                                            ).values(),
                                        ).map((status) => (
                                            <option
                                                key={status.id}
                                                value={status.id}
                                            >
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-assignee`}>
                                        Assignee
                                    </Label>

                                    <select
                                        id={`workitem-${milestoneIndex}-${groupIndex}-${workItemIndex}-assignee`}
                                        value={
                                            item.assignee_id ??
                                            ''
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateWorkItem(
                                                milestoneIndex,
                                                groupIndex,
                                                workItemIndex,
                                                'assignee_id',
                                                event
                                                    .target
                                                    .value
                                                    ? Number(
                                                          event
                                                              .target
                                                              .value,
                                                      )
                                                    : null,
                                            )
                                        }
                                        className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">
                                            Unassigned
                                        </option>

                                        {allUsers
                                            .filter(
                                                (
                                                    user,
                                                ) =>
                                                    memberIds.includes(
                                                        user.id,
                                                    ),
                                            )
                                            .map(
                                                (
                                                    user,
                                                ) => (
                                                    <option
                                                        key={
                                                            user.id
                                                        }
                                                        value={
                                                            user.id
                                                        }
                                                    >
                                                        {
                                                            user.username
                                                        }
                                                    </option>
                                                ),
                                            )}
                                    </select>
                                </div>

                                <DateField
                                    label="Start"
                                    value={
                                        item.start_date
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        updateWorkItem(
                                            milestoneIndex,
                                            groupIndex,
                                            workItemIndex,
                                            'start_date',
                                            value,
                                        )
                                    }
                                />

                                <DateField
                                    label="Due"
                                    value={
                                        item.due_date
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        updateWorkItem(
                                            milestoneIndex,
                                            groupIndex,
                                            workItemIndex,
                                            'due_date',
                                            value,
                                        )
                                    }
                                />

                            </div>

                            <div className="flex justify-end border-t pt-3">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                            Remove work item
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Remove work item?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                “
                                                {item.title ||
                                                    'Untitled work item'}
                                                ”
                                                will be removed from this
                                                draft. This can’t be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={() =>
                                                    removeWorkItem(
                                                        milestoneIndex,
                                                        groupIndex,
                                                        workItemIndex,
                                                    )
                                                }
                                            >
                                                Remove
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        );
    }
}
