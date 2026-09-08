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
 * Step 2 - Team: member picker. JSX sliced verbatim from project-setup-sheet.tsx (lines 1317-1468).
 */

export function SetupStepTeam({
    setup,
    allUsers = [],
    workItemStatuses = [],
    issues = [] as SetupIssue[],
    mode = 'create' as 'create' | 'edit',
    isAdmin = false,
    authUserId,
}: {
    setup: SetupController;
    allUsers?: UserOption[];
    workItemStatuses?: WorkItemStatusOption[];
    issues?: SetupIssue[];
    mode?: 'create' | 'edit';
    isAdmin?: boolean;
    authUserId?: number;
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
    toggleManager,
    isManager,
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
                            Build your team
                        </h3>

                        <p className="text-muted-foreground mt-1 text-sm">
                            Select the people who should have access to this project. You can change this later.
                        </p>
                    </div>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base">
                                Project members
                            </CardTitle>

                            <Badge variant="secondary">
                                {memberIds.length}{' '}
                                selected
                            </Badge>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value,
                                    )
                                }
                            />

                            {uniqueRoles.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            roleFilter ===
                                            'all'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            setRoleFilter(
                                                'all',
                                            )
                                        }
                                    >
                                        All
                                    </Button>

                                    {uniqueRoles.map(
                                        (role) => (
                                            <Button
                                                key={role}
                                                type="button"
                                                size="sm"
                                                variant={
                                                    roleFilter ===
                                                    role
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    setRoleFilter(
                                                        role,
                                                    )
                                                }
                                                className="capitalize"
                                            >
                                                {role}
                                            </Button>
                                        ),
                                    )}
                                </div>
                            )}

                            {isAdmin && (
                                <p className="text-muted-foreground text-xs">
                                    The first member marked <span className="font-medium text-foreground">Manager</span> becomes the project owner.
                                </p>
                            )}

                            <div className="divide-y rounded-lg border">
                                {filteredUsers.length ===
                                0 ? (
                                    <p className="text-muted-foreground p-6 text-center text-sm">
                                        No members found.
                                    </p>
                                ) : (
                                    filteredUsers.map(
                                        (user) => {
                                            const selected =
                                                memberIds.includes(
                                                    user.id,
                                                );

                                            return (
                                                <button
                                                    key={
                                                        user.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        toggleUser(
                                                            user.id,
                                                        )
                                                    }
                                                    className="focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 hover:bg-muted/50 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                                                    aria-pressed={selected}
                                                >
                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                            selected
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-input'
                                                        }`}
                                                    >
                                                        {selected && (
                                                            <Check className="h-3.5 w-3.5" />
                                                        )}
                                                    </span>

                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-medium">
                                                            {
                                                                user.username
                                                            }
                                                        </span>

                                                        <span className="text-muted-foreground block truncate text-xs">
                                                            {
                                                                user.email
                                                            }
                                                        </span>
                                                    </span>

                                                    {user.role && (
                                                        <Badge
                                                            variant="outline"
                                                            className="capitalize"
                                                        >
                                                            {
                                                                user.role
                                                            }
                                                        </Badge>
                                                    )}

                                                    {isAdmin && selected && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleManager(user.id);
                                                            }}
                                                            className={`flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium transition-colors ${
                                                                isManager(user.id)
                                                                    ? 'border-primary bg-primary/10 text-primary'
                                                                    : 'border-input text-muted-foreground hover:bg-muted/50'
                                                            }`}
                                                            aria-pressed={isManager(user.id)}
                                                        >
                                                            {isManager(user.id) ? 'Manager' : 'Mark manager'}
                                                        </button>
                                                    )}
                                                </button>
                                            );
                                        },
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

    );
}
