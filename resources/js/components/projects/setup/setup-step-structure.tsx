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
 * Step 1 - Basics: project details and status list editor. JSX sliced verbatim from project-setup-sheet.tsx (lines 1178-1311).
 */

export function SetupStepStructure({
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
    prefixTouchedByUser,
    } = setup;

    return (
                <div className="space-y-6">
                    <div>
                        <p className="text-muted-foreground text-sm">
                            Start with the essentials. You can add detailed planning after the project is created.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Project details
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Project name
                                </Label>

                                <Input
                                    id="name"
                                    autoFocus
                                    value={name}
                                    onChange={(event) =>
                                        handleNameChange(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Project name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Description{' '}
                                    <span className="text-muted-foreground font-normal">
                                        (optional)
                                    </span>
                                </Label>

                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(
                                            event.target.value,
                                        )
                                    }
                                    rows={4}
                                    placeholder="What is this project trying to achieve?"
                                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="status_name">
                                        Status
                                    </Label>

                                    <select
                                        id="status_name"
                                        value={statusName}
                                        onChange={(event) =>
                                            setStatusName(
                                                event.target.value,
                                            )
                                        }
                                        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                                    >
                                        {projectStatuses.map(
                                            (status) => (
                                                <option
                                                    key={
                                                        status.id ?? status.name
                                                    }
                                                    value={
                                                        status.name
                                                    }
                                                >
                                                    {
                                                        status.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="item_prefix">
                                        Project prefix
                                        <span className="text-muted-foreground ml-1 font-normal">
                                            (e.g. WR)
                                        </span>
                                    </Label>

                                    <Input
                                        id="item_prefix"
                                        value={itemPrefix}
                                        onChange={(event) => {
                                            prefixTouchedByUser.current =
                                                true;

                                            setItemPrefix(
                                                event.target.value,
                                            );
                                        }}
                                        placeholder="WR"
                                        disabled={
                                            mode === 'edit'
                                        }
                                    />

                                    {mode === 'create' &&
                                        !prefixTouchedByUser.current && (
                                            <p className="text-muted-foreground text-xs">
                                                Auto-filled from the project name. You can edit it if you like.
                                            </p>
                                        )}
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

                    {errorMessage && (
                        <ErrorMessage
                            message={errorMessage}
                        />
                    )}
                </div>

    );
}
