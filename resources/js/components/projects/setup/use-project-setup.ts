import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import {
    type NestedGroup,
    type NestedMilestone,
    type NestedWorkItem,
    type ProjectSetupSheetProps,
    type StatusOption,
    type UserOption,
    type WorkItemStatusOption,
    type Step,
} from './types';
import { generatePrefix } from './utils';

/*
 * State hook for the project setup wizard.
 *
 * Extracted verbatim from the body of project-setup-sheet.tsx (lines 148-699):
 * all useState/useRef/derived values and mutation handlers, parameterized on
 * the sheet props. The refactored shell consumes this single hook instead of
 * carrying the state inline.
 */
export function useProjectSetup({
    open,
    mode,
    project,
    statusName: initialStatusName,
    statuses,
    allUsers,
    workItemStatuses,
    initialMemberIds = [],
    initialMilestones = [],
    // When the creator is a manager (not admin), they are auto-added to the
    // project's member list on create. Pass both; the hook decides.
    creatorUserId,
    creatorIsManager = false,
}: Pick<
    ProjectSetupSheetProps,
    | 'open'
    | 'mode'
    | 'project'
    | 'statusName'
    | 'statuses'
    | 'allUsers'
    | 'workItemStatuses'
    | 'initialMemberIds'
    | 'initialMilestones'
> & {
    creatorUserId?: number;
    creatorIsManager?: boolean;
}) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    // Highest step the user has reached — controls which steps are clickable
    // in the progress indicator (you can always return to a visited step).
    const [maxVisited, setMaxVisited] = useState<Step>(1);

    const [name, setName] = useState(project.name ?? '');
    const [itemPrefix, setItemPrefix] = useState(project.item_prefix ?? '');
    const [description, setDescription] = useState(project.description ?? '');
    const [startDate, setStartDate] = useState(project.start_date ?? '');
    const [endDate, setEndDate] = useState(project.end_date ?? '');
    const [statusName, setStatusName] = useState(initialStatusName);
    const [projectStatuses, setProjectStatuses] = useState<StatusOption[]>(statuses);

    const [memberIds, setMemberIds] = useState<number[]>(initialMemberIds);
    // Members designated as project managers (subset of memberIds). The first
    // manager becomes the project owner (created_by) when an admin creates.
    const [managerIds, setManagerIds] = useState<number[]>([]);
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
        projectStatuses,
        memberIds,
        managerIds,
        milestones,
    });

    const isDirty =
        Boolean(initialSnapshot.current) &&
        initialSnapshot.current !== currentSnapshot;

    const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = event.target.value;

        setStartDate(newStartDate);

        if (endDate && endDate < newStartDate) {
            setEndDate('');
        }
    };

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(event.target.value);
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
            setProjectStatuses(statuses);
            // A manager creating a project is automatically one of its members.
            const seededMembers =
                mode === 'create' && creatorIsManager && creatorUserId
                    ? Array.from(new Set([...initialMemberIds, creatorUserId]))
                    : initialMemberIds;

            setMemberIds(seededMembers);
            setManagerIds([]);
            setMilestones(initialMilestones);

            setSearchTerm('');
            setRoleFilter('all');
            setErrorMessage(null);

            prefixTouchedByUser.current = false;

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
                projectStatuses: statuses,
                memberIds: initialMemberIds,
                managerIds: [],
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
        statuses,
        initialMemberIds,
        initialMilestones,
    ]);

    const uniqueRoles = [
        ...new Set(
            allUsers
                .map((user) => user.role)
                .filter((role): role is string => Boolean(role)),
        ),
    ];

    const filteredUsers: UserOption[] = allUsers.filter((user) => {
        const search = searchTerm.trim().toLowerCase();

        const matchesSearch =
            !search ||
            user.username.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search);

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const totalGroups = milestones.reduce(
        (sum, milestone) => sum + milestone.groups.length,
        0,
    );

    const totalWorkItems = milestones.reduce(
        (sum, milestone) =>
            sum +
            milestone.groups.reduce(
                (groupSum, group) => groupSum + group.work_items.length,
                0,
            ),
        0,
    );

    function toggleSetValue(
        setter: Dispatch<SetStateAction<Set<string>>>,
        key: string,
    ) {
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
        setMemberIds((previous) =>
            previous.includes(userId)
                ? previous.filter((id) => id !== userId)
                : [...previous, userId],
        );

        // If the user is removed as a member, they can't be a manager either.
        if (memberIds.includes(userId)) {
            setManagerIds((previous) => previous.filter((id) => id !== userId));
        }
    }

    // Toggle manager designation for a member. A user must be a member to be
    // a manager, so selecting manager auto-adds them to the member list.
    function toggleManager(userId: number) {
        if (!memberIds.includes(userId)) {
            setMemberIds((previous) => [...previous, userId]);
        }

        setManagerIds((previous) =>
            previous.includes(userId)
                ? previous.filter((id) => id !== userId)
                : [...previous, userId],
        );
    }

    function isManager(userId: number): boolean {
        return managerIds.includes(userId);
    }

    function addStatus() {
        setProjectStatuses((previous) => [
            ...previous,
            {
                id: undefined,
                name: '',
                color: '#6b7280',
                order: previous.length + 1,
            },
        ]);
    }

    // Move to a step, recording it as visited so the progress indicator
    // keeps it (and every earlier step) clickable for going back.
    function goToStep(target: Step) {
        setStep(target);
        setMaxVisited((prev) => (target > prev ? target : prev) as Step);
    }

    function updateStatus(index: number, field: keyof StatusOption, value: string) {
        setProjectStatuses((previous) =>
            previous.map((status, statusIndex) =>
                statusIndex === index ? { ...status, [field]: value } : status,
            ),
        );
    }

    function removeStatus(index: number) {
        const next = projectStatuses.filter(
            (_, statusIndex) => statusIndex !== index,
        );

        setProjectStatuses(next);

        // If the currently selected project status was removed, fall back to
        // the first remaining one (or clear the selection if none remain).
        if (statusName && !next.some((s) => s.name === statusName)) {
            setStatusName(next[0]?.name ?? '');
        }
    }

    function moveStatus(index: number, direction: -1 | 1) {
        setProjectStatuses((previous) => {
            const target = index + direction;
            if (target < 0 || target >= previous.length) {
                return previous;
            }
            const next = [...previous];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
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

        setMilestones((previous) => [...previous, milestone]);

        setExpandedMilestones((previous) => new Set(previous).add(String(newId)));
    }

    function updateMilestone(
        index: number,
        field: keyof NestedMilestone,
        value: string,
    ) {
        setMilestones((previous) =>
            previous.map((milestone, milestoneIndex) =>
                milestoneIndex === index
                    ? {
                          ...milestone,
                          [field]: value,
                      }
                    : milestone,
            ),
        );
    }

    function removeMilestone(index: number) {
        setMilestones((previous) =>
            previous.filter((_, milestoneIndex) => milestoneIndex !== index),
        );
    }

    function addGroup(milestoneIndex: number) {
        const newId = tempIdCounter.current--;

        const group: NestedGroup = {
            id: newId,
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

        setExpandedGroups((previous) =>
            new Set(previous).add(`${milestoneIndex}-${newId}`),
        );
    }

    function updateGroup(
        milestoneIndex: number,
        groupIndex: number,
        field: keyof NestedGroup,
        value: string | number,
    ) {
        setMilestones((previous) =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) {
                    return milestone;
                }

                return {
                    ...milestone,
                    groups: milestone.groups.map(
                        (group, nestedIndex) =>
                            nestedIndex === groupIndex
                                ? {
                                      ...group,
                                      [field]: value,
                                  }
                                : group,
                    ),
                };
            }),
        );
    }

    function toggleGroupAssignee(
        milestoneIndex: number,
        groupIndex: number,
        userId: number,
    ) {
        setMilestones((previous) =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) {
                    return milestone;
                }

                return {
                    ...milestone,
                    groups: milestone.groups.map((group, nestedIndex) => {
                        if (nestedIndex !== groupIndex) {
                            return group;
                        }

                        const has = (group.assignee_ids ?? []).includes(userId);

                        return {
                            ...group,
                            assignee_ids: has
                                ? (group.assignee_ids ?? []).filter(
                                      (id) => id !== userId,
                                  )
                                : [...(group.assignee_ids ?? []), userId],
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
                          groups: milestone.groups.filter(
                              (_, nestedIndex) => nestedIndex !== groupIndex,
                          ),
                      }
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

        setMilestones((previous) =>
            previous.map((milestone, index) => {
                if (index !== milestoneIndex) {
                    return milestone;
                }

                return {
                    ...milestone,
                    groups: milestone.groups.map(
                        (group, nestedIndex) =>
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

        setExpandedWorkItems((previous) =>
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
                            work_items: group.work_items.map(
                                (item, workItemIndexValue) =>
                                    workItemIndexValue === workItemIndex
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

    function removeWorkItem(
        milestoneIndex: number,
        groupIndex: number,
        workItemIndex: number,
    ) {
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
                                  work_items: group.work_items.filter(
                                      (_, index) => index !== workItemIndex,
                                  ),
                              }
                            : group,
                    ),
                };
            }),
        );
    }

    return {
        // step navigation
        step,
        setStep,
        maxVisited,
        goToStep,
        // basics
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
        // team
        memberIds,
        managerIds,
        toggleUser,
        toggleManager,
        isManager,
        searchTerm,
        setSearchTerm,
        roleFilter,
        setRoleFilter,
        uniqueRoles,
        filteredUsers,
        
        // plan
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
        // derived + ui state
        totalGroups,
        totalWorkItems,
        isDirty,
        processing,
        setProcessing,
        errorMessage,
        setErrorMessage,
        showCloseConfirm,
        setShowCloseConfirm,
        activeIssueKey,
        setActiveIssueKey,
        prefixTouchedByUser,
    };
}

export type SetupController = ReturnType<typeof useProjectSetup>;