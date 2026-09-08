import { type NestedMilestone, type StatusOption, type Step } from './types';

export type SetupIssue = {
    key: string;
    step: Step;
    message: string;
    severity: 'error' | 'warning';
    fixLabel?: string;
};

export interface SetupValidationInput {
    name: string;
    itemPrefix: string;
    startDate: string;
    endDate: string;
    projectStatuses: StatusOption[];
    milestones: NestedMilestone[];
}

/* Pure validation extracted verbatim from project-setup-sheet.tsx collectIssues(). */
export function collectSetupIssues(input: SetupValidationInput): SetupIssue[] {
    const issues: SetupIssue[] = [];

    if (!input.name.trim()) {
        issues.push({
            key: 'project-name',
            step: 1,
            severity: 'error',
            message: 'Project name is required.',
        });
    }

    if (!input.itemPrefix.trim()) {
        issues.push({
            key: 'project-prefix',
            step: 1,
            severity: 'error',
            message: 'Project prefix is required.',
        });
    }

    if (
        input.startDate &&
        input.endDate &&
        input.startDate > input.endDate
    ) {
        issues.push({
            key: 'project-dates',
            step: 1,
            severity: 'error',
            message:
                'Project end date must be on or after the start date.',
        });
    }

    if (input.projectStatuses.length === 0) {
        issues.push({
            key: 'statuses-none',
            step: 1,
            severity: 'error',
            message: 'Add at least one project status.',
        });
    }

    const seenStatusNames = new Set<string>();
    input.projectStatuses.forEach((status, statusIndex) => {
        const label = status.name.trim() || `Status ${statusIndex + 1}`;

        if (!status.name.trim()) {
            issues.push({
                key: `s-${statusIndex}-name`,
                step: 1,
                severity: 'error',
                message: `${label} needs a name.`,
            });
        } else {
            const lower = status.name.trim().toLowerCase();
            if (seenStatusNames.has(lower)) {
                issues.push({
                    key: `s-${statusIndex}-duplicate`,
                    step: 1,
                    severity: 'error',
                    message: `Status "${status.name.trim()}" is duplicated.`,
                });
            }
            seenStatusNames.add(lower);
        }
    });

    input.milestones.forEach((milestone, milestoneIndex) => {
        const milestoneLabel =
            milestone.name.trim() ||
            `Milestone ${milestoneIndex + 1}`;

        if (!milestone.name.trim()) {
            issues.push({
                key: `m-${milestoneIndex}-name`,
                step: 3,
                severity: 'error',
                message: `${milestoneLabel} needs a name.`,
            });
        }

        if (
            !milestone.start_date ||
            !milestone.target_date
        ) {
            issues.push({
                key: `m-${milestoneIndex}-dates`,
                step: 3,
                severity: 'warning',
                message: `${milestoneLabel} has no complete date range yet.`,
            });
        }

        if (
            milestone.start_date &&
            milestone.target_date &&
            milestone.start_date >
                milestone.target_date
        ) {
            issues.push({
                key: `m-${milestoneIndex}-range`,
                step: 3,
                severity: 'error',
                message: `${milestoneLabel} has an invalid date range.`,
            });
        }

        milestone.groups.forEach(
            (group, groupIndex) => {
                const groupLabel =
                    group.name.trim() ||
                    `Group ${groupIndex + 1}`;

                if (!group.name.trim()) {
                    issues.push({
                        key: `g-${milestoneIndex}-${groupIndex}-name`,
                        step: 3,
                        severity: 'error',
                        message: `${groupLabel} in ${milestoneLabel} needs a name.`,
                    });
                }

                if (
                    !group.start_date ||
                    !group.end_date
                ) {
                    issues.push({
                        key: `g-${milestoneIndex}-${groupIndex}-dates`,
                        step: 3,
                        severity: 'warning',
                        message: `${groupLabel} has no complete date range yet.`,
                    });
                }

                if (
                    group.start_date &&
                    group.end_date &&
                    group.start_date >
                        group.end_date
                ) {
                    issues.push({
                        key: `g-${milestoneIndex}-${groupIndex}-range`,
                        step: 3,
                        severity: 'error',
                        message: `${groupLabel} has an invalid date range.`,
                    });
                }

                if (
                    milestone.start_date &&
                    group.start_date &&
                    group.start_date <
                        milestone.start_date
                ) {
                    issues.push({
                        key: `g-${milestoneIndex}-${groupIndex}-before-milestone`,
                        step: 3,
                        severity: 'warning',
                        message: `${groupLabel} starts before ${milestoneLabel}.`,
                    });
                }

                if (
                    milestone.target_date &&
                    group.end_date &&
                    group.end_date >
                        milestone.target_date
                ) {
                    issues.push({
                        key: `g-${milestoneIndex}-${groupIndex}-after-milestone`,
                        step: 3,
                        severity: 'warning',
                        message: `${groupLabel} ends after ${milestoneLabel}.`,
                    });
                }

                group.work_items.forEach(
                    (item, workItemIndex) => {
                        const label =
                            item.title.trim() ||
                            `Work item ${
                                workItemIndex + 1
                            }`;

                        if (!item.title.trim()) {
                            issues.push({
                                key: `w-${milestoneIndex}-${groupIndex}-${workItemIndex}-title`,
                                step: 3,
                                severity: 'error',
                                message: `${label} needs a title.`,
                            });
                        }

                        if (
                            item.start_date &&
                            item.due_date &&
                            item.start_date >
                                item.due_date
                        ) {
                            issues.push({
                                key: `w-${milestoneIndex}-${groupIndex}-${workItemIndex}-range`,
                                step: 3,
                                severity: 'error',
                                message: `${label} has an invalid date range.`,
                            });
                        }

                        if (
                            group.start_date &&
                            item.start_date &&
                            item.start_date <
                                group.start_date
                        ) {
                            issues.push({
                                key: `w-${milestoneIndex}-${groupIndex}-${workItemIndex}-before-group`,
                                step: 3,
                                severity: 'warning',
                                message: `${label} starts before ${groupLabel}.`,
                            });
                        }

                        if (
                            group.end_date &&
                            item.due_date &&
                            item.due_date >
                                group.end_date
                        ) {
                            issues.push({
                                key: `w-${milestoneIndex}-${groupIndex}-${workItemIndex}-after-group`,
                                step: 3,
                                severity: 'warning',
                                message: `${label} ends after ${groupLabel}.`,
                            });
                        }
                    },
                );
            },
        );
    });


    return issues;
}

export function countIssuesPerStep(issues: SetupIssue[]): Record<Step, number> {
    const counts: Record<Step, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    issues.forEach((issue) => {
        counts[issue.step] += 1;
    });
    return counts;
}
