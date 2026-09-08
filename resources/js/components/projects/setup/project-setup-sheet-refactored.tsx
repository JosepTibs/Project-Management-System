import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SetupProgressIndicator } from './progress-indicator';
import { SetupStepPlan } from './setup-step-plan';
import { SetupStepReview } from './setup-step-review';
import { SetupStepStructure } from './setup-step-structure';
import { SetupStepTeam } from './setup-step-team';
import { Summary } from './fields';
import { dateRange } from './utils';
import { collectSetupIssues, countIssuesPerStep, type SetupIssue } from './validation';
import { useProjectSetup } from './use-project-setup';
import { type ProjectSetupSheetProps, STEP_LABELS, type Step } from './types';

/*
 * Refactored drop-in replacement shell for project-setup-sheet.tsx.
 * State lives in useProjectSetup, validation in validation.ts, step UI in the
 * SetupStep* panels, progress strip in SetupProgressIndicator. JSX navigation
 * and submission logic sliced verbatim from the original (lines 954-1174,
 * 2518-2961) with collectIssues() swapped for the pure collectSetupIssues().
 */

export { type NestedMilestone, type StatusOption, type UserOption, type WorkItemStatusOption } from './types';

export default function ProjectSetupSheetRefactored({
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
    // Current user's role — used to decide whether the manager picker shows
    // and whether to auto-add the creator as a member (managers always are).
    // Declared before the hook so we can pass creator info into it.
    const page = usePage<{ auth?: { user?: { id: number }; roles?: string[] } }>();
    const authUserId = page.props.auth?.user?.id;
    const isAdmin = (page.props.auth?.roles ?? []).some((r) =>
        ['admin', 'superadmin'].includes((r ?? '').toLowerCase()),
    );

    const setup = useProjectSetup({
        open,
        mode,
        project,
        statusName: initialStatusName,
        statuses,
        allUsers,
        workItemStatuses,
        initialMemberIds,
        initialMilestones,
        creatorUserId: authUserId,
        creatorIsManager: authUserId !== undefined && !isAdmin,
    });

    const {
    step,
    setStep,
    maxVisited,
    goToStep,
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
    memberIds,
    managerIds,
    toggleManager,
    isManager,
    milestones,
    toggleSetValue,
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
    } = setup;

    const setupInput = {
        name,
        itemPrefix,
        startDate,
        endDate,
        projectStatuses,
        milestones,
    };

    function validateStep(targetStep: Step) {
        setErrorMessage(null);

        const issues = collectSetupIssues(setupInput).filter(
            (issue) =>
                issue.step <= targetStep &&
                issue.severity === 'error',
        );

        if (
            issues.length > 0 &&
            targetStep === 4
        ) {
            setErrorMessage(
                `${issues.length} item${
                    issues.length === 1 ? '' : 's'
                } need attention before you can finish.`,
            );

            setStep(issues[0].step);
            setActiveIssueKey(issues[0].key);

            return false;
        }

        if (
            targetStep === 2 &&
            mode === 'create' &&
            (!name.trim() ||
                !itemPrefix.trim())
        ) {
            setErrorMessage(
                'Add a project name and work item prefix before continuing.',
            );

            setStep(1);

            return false;
        }

        return true;
    }

    function goNext() {
        if (
            step === 1 &&
            !validateStep(2)
        ) {
            return;
        }

        if (
            step === 3 &&
            !validateStep(4)
        ) {
            return;
        }

        if (step < 4) {
            goToStep((step + 1) as Step);
        }
    }

    function goBack() {
        if (step > 1) {
            goToStep((step - 1) as Step);
        }
    }

    function handleSubmit() {
        setErrorMessage(null);

        const issues = collectSetupIssues(setupInput);

        const errors = issues.filter(
            (issue) =>
                issue.severity === 'error',
        );

        if (errors.length > 0) {
            setErrorMessage(
                `${errors.length} item${
                    errors.length === 1 ? '' : 's'
                } need attention before you can finish.`,
            );

            setStep(errors[0].step);
            setActiveIssueKey(errors[0].key);

            return;
        }

        const validatedMilestones =
            milestones
                .filter(
                    (milestone) =>
                        milestone.name.trim(),
                )
                .map((milestone) => ({
                    ...milestone,

                    groups: milestone.groups
                        .filter(
                            (group) =>
                                group.name.trim(),
                        )
                        .map((group) => ({
                            ...group,

                            work_items:
                                group.work_items.filter(
                                    (workItem) =>
                                        workItem.title.trim(),
                                ),
                        })),
                }));

        const payload = {
            name: name.trim(),
            item_prefix: itemPrefix.trim(),
            description,
            start_date:
                startDate || null,
            end_date:
                endDate || null,
            status_name:
                statusName || null,
            statuses: projectStatuses.map((status, index) => ({
                id: status.id && status.id > 0 ? status.id : undefined,
                name: status.name.trim(),
                color: status.color || null,
                order: index + 1,
            })),
            member_ids: memberIds,
            // First designated manager becomes the project owner; if none is
            // chosen (or the creator isn't an admin) the creator owns it.
            created_by: isAdmin ? (managerIds[0] ?? authUserId) : authUserId,
            milestones: validatedMilestones,
        } as unknown as Parameters<
            typeof router.post
        >[1];

        setProcessing(true);

        const options = {
            onError: () =>
                setProcessing(false),

            onFinish: () =>
                setProcessing(false),

            onSuccess: () => {
                onSuccess?.();
                onOpenChange(false);
            },
        };

        if (
            mode === 'edit' &&
            projectId
        ) {
            router.put(
                `/projects/${projectId}/setup`,
                payload,
                options,
            );
        } else {
            router.post(
                '/projects',
                payload,
                options,
            );
        }
    }

    function requestClose() {
        if (processing) {
            return;
        }

        if (isDirty) {
            setShowCloseConfirm(true);
        } else {
            onOpenChange(false);
        }
    }

    function jumpToIssue(issueKey: string) {
        const issue = collectSetupIssues(setupInput).find(
            (item) => item.key === issueKey,
        );

        if (!issue) {
            return;
        }

        setStep(issue.step);
        setActiveIssueKey(issue.key);
        setErrorMessage(null);
        goToStep(issue.step);
    }

    const issues = collectSetupIssues(setupInput);

    const stepIssueCounts = (
        [1, 2, 3, 4] as Step[]
    ).reduce<Record<number, number>>(
        (acc, item) => {
            acc[item] = issues.filter(
                (issue) =>
                    issue.step === item &&
                    issue.severity === 'error',
            ).length;

            return acc;
        },
        {},
    );



    function renderStepContent() {
        if (step === 1) {
            return <SetupStepStructure setup={setup} allUsers={allUsers} mode={mode} />;
        }

        if (step === 2) {
            return <SetupStepTeam setup={setup} allUsers={allUsers} mode={mode} isAdmin={isAdmin} authUserId={authUserId} />;
        }

        if (step === 3) {
            return <SetupStepPlan setup={setup} allUsers={allUsers} workItemStatuses={workItemStatuses} mode={mode} />;
        }

        return <SetupStepReview setup={setup} issues={issues} mode={mode} />;
    }

    return (
        <Sheet
            open={open}
            onOpenChange={requestClose}
        >
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-none md:w-[1020px]">
                <SheetHeader className="border-b px-6 py-4 text-left">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <SheetTitle className="truncate">
                                    {mode === 'create'
                                        ? 'Create project'
                                        : `Edit ${project.name}`}
                                </SheetTitle>

                                {isDirty && (
                                    <Badge
                                        variant="outline"
                                        className="shrink-0"
                                    >
                                        Unsaved changes
                                    </Badge>
                                )}
                            </div>

                            <SheetDescription className="mt-1">
                                {mode ===
                                'create'
                                    ? 'Set up the project now; detailed planning can stay lightweight.'
                                    : 'Update only what changed. Your existing plan stays intact.'}
                            </SheetDescription>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={requestClose}
                            aria-label="Close"
                        >
                            <span className="text-lg leading-none">
                                ×
                            </span>
                        </Button>
                    </div>

                    <SetupProgressIndicator step={step} maxVisited={maxVisited} issueCounts={stepIssueCounts} onStepSelect={goToStep} />
                </SheetHeader>

                <div className="bg-muted/20 flex-1 overflow-y-auto">
                    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <main className="min-w-0">
                            <div key={step} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                                {renderStepContent()}
                            </div>
                        </main>

                        <aside className="hidden lg:block">
                            <div className="sticky top-0 space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">
                                            Project snapshot
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-3 text-sm">
                                        <Summary
                                            label="Project"
                                            value={
                                                name ||
                                                'Untitled'
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
                                            label="Team"
                                            value={`${memberIds.length} ${
                                                memberIds.length ===
                                                1
                                                    ? 'member'
                                                    : 'members'
                                            }`}
                                        />

                                        <Summary
                                            label="Plan"
                                            value={`${milestones.length} milestones · ${totalGroups} groups · ${totalWorkItems} items`}
                                        />
                                    </CardContent>
                                </Card>

                                {step === 4 &&
                                    issues.length >
                                        0 && (
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">
                                                    Review
                                                    checks
                                                </CardTitle>
                                            </CardHeader>

                                            <CardContent className="space-y-2">
                                                {issues
                                                    .slice(
                                                        0,
                                                        5,
                                                    )
                                                    .map(
                                                        (
                                                            issue,
                                                        ) => (
                                                            <button
                                                                key={
                                                                    issue.key
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    jumpToIssue(
                                                                        issue.key,
                                                                    )
                                                                }
                                                                className="hover:bg-muted/50 w-full rounded-md border p-2 text-left text-xs"
                                                            >
                                                                <span
                                                                    className={`font-medium ${
                                                                        issue.severity ===
                                                                        'error'
                                                                            ? 'text-destructive'
                                                                            : 'text-amber-600'
                                                                    }`}
                                                                >
                                                                    {issue.severity ===
                                                                    'error'
                                                                        ? 'Fix'
                                                                        : 'Review'}{' '}
                                                                    ·{' '}
                                                                    {
                                                                        STEP_LABELS[
                                                                            issue.step
                                                                        ]
                                                                    }
                                                                </span>

                                                                <span className="text-muted-foreground mt-1 block">
                                                                    {
                                                                        issue.message
                                                                    }
                                                                </span>
                                                            </button>
                                                        ),
                                                    )}

                                                {issues.length >
                                                    5 && (
                                                    <p className="text-muted-foreground text-xs">
                                                        +{' '}
                                                        {issues.length -
                                                            5}{' '}
                                                        more
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                            </div>
                        </aside>
                    </div>
                </div>

                <SheetFooter className="bg-background border-t px-6 py-4">
                    <div className="flex w-full items-center justify-between gap-4">
                        <div className="text-muted-foreground min-w-0 text-xs">
                            <span className="hidden sm:inline">
                                Step {step} of 4 ·{' '}
                            </span>

                            {step === 3 &&
                                `${milestones.length} milestones · ${totalGroups} groups · ${totalWorkItems} items`}

                            {step === 2 &&
                                `${memberIds.length} ${
                                    memberIds.length ===
                                    1
                                        ? 'member'
                                        : 'members'
                                } selected`}

                            {step === 1 &&
                                (isDirty
                                    ? 'Changes will be saved when you finish.'
                                    : 'No changes yet.')}

                            {step === 4 &&
                                (issues.some(
                                    (issue) =>
                                        issue.severity ===
                                        'error',
                                )
                                    ? `${
                                          issues.filter(
                                              (
                                                  issue,
                                              ) =>
                                                  issue.severity ===
                                                  'error',
                                          ).length
                                      } blocking issue${
                                          issues.filter(
                                              (
                                                  issue,
                                              ) =>
                                                  issue.severity ===
                                                  'error',
                                          ).length ===
                                      1
                                          ? ''
                                          : 's'
                                      }.`
                                    : issues.length
                                      ? `${issues.length} recommendation${
                                            issues.length ===
                                            1
                                                ? ''
                                                : 's'
                                        } · ready to save.`
                                      : 'Everything is ready.')}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={requestClose}
                                disabled={
                                    processing
                                }
                            >
                                Cancel
                            </Button>

                            {step > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={
                                        goBack
                                    }
                                    disabled={
                                        processing
                                    }
                                >
                                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                                    Back
                                </Button>
                            )}

                            {step < 4 ? (
                                <Button
                                    type="button"
                                    onClick={
                                        goNext
                                    }
                                    disabled={
                                        processing
                                    }
                                >
                                    Continue
                                    <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={
                                        handleSubmit
                                    }
                                    disabled={
                                        processing ||
                                        issues.some(
                                            (
                                                issue,
                                            ) =>
                                                issue.severity ===
                                                'error',
                                        )
                                    }
                                >
                                    {processing
                                        ? 'Saving…'
                                        : mode ===
                                            'create'
                                          ? 'Create project'
                                          : 'Save changes'}
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>

            <AlertDialog
                open={showCloseConfirm}
                onOpenChange={
                    setShowCloseConfirm
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Discard unsaved
                            changes?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Your changes haven't
                            been saved. Closing
                            now will lose them.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setErrorMessage(
                                    null,
                                );
                                setActiveIssueKey(
                                    null,
                                );
                            }}
                        >
                            Keep editing
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={() => {
                                setShowCloseConfirm(
                                    false,
                                );

                                onOpenChange(
                                    false,
                                );
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

