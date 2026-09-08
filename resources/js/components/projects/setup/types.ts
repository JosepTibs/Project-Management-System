/* Shared types for the project setup wizard.
 * Extracted verbatim from project-setup-sheet.tsx (lines 14-95).
 * The original file keeps its own copies until cutover.
 */
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
    id?: number;
    name: string;
    color: string;
    order?: number;
    is_initial?: boolean;
    is_final?: boolean;
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
}

export interface ProjectSetupSheetProps {
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

export const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export type Step = 1 | 2 | 3 | 4;

export const STEP_LABELS: Record<Step, string> = {
    1: 'Basics',
    2: 'Team',
    3: 'Plan',
    4: 'Review',
};
