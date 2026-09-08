import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
    FileText,
    FolderKanban,
    Plus,
    Target,
    Trash2,
} from 'lucide-react';
import { DateField, ErrorMessage, Summary } from './fields';
import { dateRange, formatDate, getWorkItemStatusName } from './utils';
import { type SetupController } from './use-project-setup';
import { type SetupIssue } from './validation';
import { type UserOption, type WorkItemStatusOption } from './types';

/*
 * Step 4 - Review: summary and issue checklist. JSX sliced verbatim from project-setup-sheet.tsx (lines 1782-1902).
 */

export function SetupStepReview({
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
                <div>
                    <h3 className="font-medium">
                        Review your project
                    </h3>

                    <p className="text-muted-foreground mt-1 text-sm">
                        Everything looks good? You can always change the plan and team later.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Project
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Summary
                            label="Name"
                            value={
                                name ||
                                'Untitled project'
                            }
                        />

                        <Summary
                            label="Status"
                            value={
                                statusName ||
                                'Not set'
                            }
                        />

                        <Summary
                            label="Dates"
                            value={dateRange(
                                startDate,
                                endDate,
                            )}
                        />

                        <Summary
                            label="Project prefix"
                            value={
                                itemPrefix ||
                                'Not set'
                            }
                        />

                        <Summary
                            label="Members"
                            value={`${memberIds.length} selected`}
                        />

                        <Summary
                            label="Plan"
                            value={`${milestones.length} milestones · ${totalGroups} groups · ${totalWorkItems} work items`}
                        />
                    </CardContent>
                </Card>

                {milestones.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Milestones
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-2">
                            {milestones.map(
                                (
                                    milestone,
                                    index,
                                ) => (
                                    <div
                                        key={
                                            milestone.id ??
                                            index
                                        }
                                        className="flex items-center gap-3 rounded-lg border p-3"
                                    >
                                        <Target className="text-muted-foreground h-4 w-4 shrink-0" />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {milestone.name ||
                                                    'Untitled milestone'}
                                            </p>

                                            <p className="text-muted-foreground text-xs">
                                                {dateRange(
                                                    milestone.start_date,
                                                    milestone.target_date,
                                                )}
                                            </p>
                                        </div>

                                        <Badge variant="secondary">
                                            {
                                                milestone
                                                    .groups
                                                    .length
                                            }{' '}
                                            groups
                                        </Badge>
                                    </div>
                                ),
                            )}
                        </CardContent>
                    </Card>
                )}

                {errorMessage && (
                    <ErrorMessage
                        message={errorMessage}
                    />
                )}
            </div>

    );
}
