import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import ProjectSetupSheet, {
    type NestedMilestone,
    type StatusOption,
    type UserOption,
    type WorkItemStatusOption,
} from '@/components/projects/setup/project-setup-sheet-refactored';

interface SetupPageProps extends Record<string, unknown> {
    project: {
        id: number;
        name: string;
        description: string;
        item_prefix: string;
        start_date: string | null;
        end_date: string | null;
        status_name: string | null;
    };
    allUsers: UserOption[];
    workItemStatuses: WorkItemStatusOption[];
    statuses: StatusOption[];
    memberIds: number[];
    milestones: NestedMilestone[];
}

export default function ProjectSetup() {
    const { project, allUsers, workItemStatuses, statuses, memberIds, milestones } =
        usePage<SetupPageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: 'Setup', href: `/projects/${project.id}/setup` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Setup: ${project.name}`} />
            <ProjectSetupSheet
                open
                onOpenChange={open => {
                    if (!open) {
                        router.visit(`/projects/${project.id}`);
                    }
                }}
                mode="edit"
                projectId={project.id}
                project={project}
                statusName={project.status_name ?? ''}
                statuses={statuses}
                allUsers={allUsers}
                workItemStatuses={workItemStatuses}
                initialMemberIds={memberIds}
                initialMilestones={milestones}
            />
        </AppLayout>
    );
}
