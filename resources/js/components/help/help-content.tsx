import { Bell, ClipboardList, FolderKanban, LayoutDashboard, LifeBuoy, ListChecks, MessageSquare, Rocket, Users, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { isAdminLevel, isManager } from '@/lib/roles';

/**
 * Single source of truth for the in-app manual ("How to use").
 *
 * Both the /help page and the contextual HelpSheet render from this array,
 * so content never drifts between them. Add a section here and it appears
 * in both places — no other registration needed.
 */

export interface HelpSection {
    /** Stable id — used for deep links (/help#setup-wizard, HelpSheet initialTopic). */
    id: string;
    title: string;
    icon: LucideIcon;
    /** Extra words matched by the search box (body is JSX, so we don't parse it). */
    keywords?: string;
    /** When set, only users matching these role tiers see the section: 'admin' | 'manager'. */
    roles?: Array<'admin' | 'manager'>;
    body: ReactNode;
}

export const helpSections: HelpSection[] = [
    {
        id: 'getting-started',
        title: 'Getting started',
        icon: Rocket,
        keywords: 'overview basics introduction navigation sidebar dashboard projects work items theme dark',
        body: (
            <>
                <p className="text-muted-foreground text-sm">
                    The PHCCI Project Management System helps teams plan projects, track work
                    items, and keep everyone notified about deadlines.
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    <li>
                        <strong>Dashboard</strong> — your daily overview: workload, charts, recent
                        activity, and what needs attention.
                    </li>
                    <li>
                        <strong>Projects</strong> — browse all projects you own or are a member
                        of, in table or card view.
                    </li>
                    <li>
                        <strong>Work Items</strong> — every task assigned to you or in your
                        projects, with progress tracking and filters.
                    </li>
                    <li>
                        <strong>Project page</strong> — open a project to see its Overview, Kanban
                        board, Gantt chart, Calendar, and Documents.
                    </li>
                </ul>
                <p className="text-muted-foreground text-sm">
                    Use the theme toggle (top-right) to switch between light, dark, and system
                    appearance.
                </p>
            </>
        ),
    },
    {
        id: 'dashboard',
        title: 'Using the dashboard',
        icon: LayoutDashboard,
        keywords: 'dashboard stats charts tabs overview activity workload trend due today overdue completion',
        body: (
            <>
                <p className="text-muted-foreground text-sm">
                    The dashboard has tabs so you only see one set of information at a time:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    <li>
                        <strong>Overview</strong> — key numbers (work items, completion, due dates)
                        and charts for workload and trends.
                    </li>
                    <li>
                        <strong>Projects</strong> — cards for each project with completion
                        progress, member count, and task count.
                    </li>
                    <li>
                        <strong>Activity</strong> (admins) — a timeline of recent system events.
                    </li>
                </ul>
                <p className="text-muted-foreground text-sm">
                    Numbers like &ldquo;due today&rdquo; and &ldquo;overdue&rdquo; are computed
                    from work item due dates — keep them accurate and the dashboard stays useful.
                </p>
            </>
        ),
    },
    {
        id: 'setup-wizard',
        title: 'Creating a project (setup wizard)',
        icon: ListChecks,
        roles: ['admin', 'manager'],
        keywords: 'create project setup wizard basics team plan review steps milestones groups prefix unsaved',
        body: (
            <>
                <p className="text-muted-foreground text-sm">
                    Click <strong>Add project</strong> to open the 4-step setup wizard. Any step
                    you have already visited stays clickable in the progress bar at the top —
                    jump back and forward freely.
                </p>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                    <li>
                        <strong>Basics</strong> — project name, description, status, prefix
                        (auto-filled from the name; used to number work items), and start/end
                        dates.
                    </li>
                    <li>
                        <strong>Team</strong> — search and select members. Admins can also mark a
                        member as <strong>Manager</strong>; the first manager becomes the project
                        owner.
                    </li>
                    <li>
                        <strong>Plan</strong> — build the plan as Milestones → Groups → Work
                        items. Each level supports dates, priority, assignees, and status.
                    </li>
                    <li>
                        <strong>Review</strong> — a summary with a checklist of anything blocking
                        you. Click an issue to jump straight to it.
                    </li>
                </ol>
                <p className="text-muted-foreground text-sm">
                    The <strong>Unsaved changes</strong> badge appears once you edit something. If
                    you close with unsaved work, you will be asked to confirm first. Steps with
                    problems show a <strong>red badge</strong> in the progress bar — you can keep
                    working on other steps and come back.
                </p>
            </>
        ),
    },
    {
        id: 'work-items',
        title: 'Working with work items',
        icon: ClipboardList,
        keywords: 'work item task progress priority status assignee due date archive complete collaborator delete',
        body: (
            <>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    <li>
                        Create work items from a project (or the Work Items page); give each a
                        title, priority, status, assignee, and due date.
                    </li>
                    <li>
                        <strong>Progress</strong> can be updated inline (0–100%) from lists and
                        the work item page; progress bars reflect it everywhere.
                    </li>
                    <li>
                        <strong>Collaborators</strong> can be added to a work item — they can
                        update progress too, not just the assignee.
                    </li>
                    <li>
                        <strong>Archive</strong> hides a work item without deleting it; restore it
                        any time.
                    </li>
                    <li>Deleting is protected with a confirmation dialog — read it carefully.</li>
                </ul>
            </>
        ),
    },
    {
        id: 'views',
        title: 'Kanban, Gantt & Calendar',
        icon: FolderKanban,
        keywords: 'kanban board drag drop gantt chart calendar timeline view dependencies fullscreen month',
        body: (
            <>
                <p className="text-muted-foreground text-sm">
                    Every project offers three ways to see the same work — switch between them
                    with the view selector on the project page:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    <li>
                        <strong>Kanban</strong> — drag cards between status columns to update
                        them. Members can only move cards assigned to them (you will see a notice
                        if a card is not yours).
                    </li>
                    <li>
                        <strong>Gantt</strong> — a timeline of milestones, groups, and work items.
                        Supports fullscreen and (for managers) dependency links between items.
                    </li>
                    <li>
                        <strong>Calendar</strong> — due dates and milestones on a month grid; use
                        the arrows to change months.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'team-managers',
        title: 'Members, roles & managers',
        icon: Users,
        roles: ['admin', 'manager'],
        keywords: 'members team manager owner roles admin permissions access delegate owner',
        body: (
            <>
                <p className="text-muted-foreground text-sm">There are three access tiers:</p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    <li>
                        <strong>Admin / Superadmin</strong> — full access: manage users, all
                        projects, and activity logs.
                    </li>
                    <li>
                        <strong>Manager</strong> — full control of the projects they own (or were
                        made owner of), including planning and members.
                    </li>
                    <li>
                        <strong>Member</strong> — sees projects they are a member of; can update
                        the progress of their own work items.
                    </li>
                </ul>
                <p className="text-muted-foreground text-sm">
                    When an <strong>admin</strong> creates a project, they can mark a member as{' '}
                    <strong>Manager</strong> — the first manager becomes the project owner. When
                    a <strong>manager</strong> creates a project, they are added as a member
                    automatically and own it.
                </p>
            </>
        ),
    },
    {
        id: 'comments-attachments',
        title: 'Comments & attachments',
        icon: MessageSquare,
        keywords: 'comments replies attachments files upload delete mention discuss history',
        body: (
            <>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    <li>
                        Open a work item to discuss it — comments support replies, and you can
                        delete your own.
                    </li>
                    <li>
                        Attach files to a work item for context (specs, screenshots, documents).
                        Deleting an attachment asks for confirmation.
                    </li>
                    <li>
                        Everything is timestamped so the history of a decision stays visible.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'notifications',
        title: 'Notifications & reminders',
        icon: Bell,
        keywords: 'notifications bell reminders digest due date schedule daily 8am admin unread',
        body: (
            <>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    <li>
                        <strong>Bell icon</strong> — your notifications live here; unread ones are
                        highlighted. Click one to jump to what it is about.
                    </li>
                    <li>
                        <strong>Reminders</strong> run daily at 8:00 AM (Asia/Manila): members get
                        reminders for their own items based on their reminder settings; managers
                        get a summary for items in their projects.
                    </li>
                    <li>
                        <strong>Admins</strong> receive a single <strong>Daily Digest</strong>{' '}
                        instead of individual reminders: due today, overdue, due this week, and
                        what was completed yesterday.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        icon: LifeBuoy,
        keywords: 'problems fix errors lost changes did not receive notification drag permission refresh url',
        body: (
            <>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    <li>
                        <strong>Cannot drag a Kanban card?</strong> Members can only move their
                        own (or collaborated) cards — ask a manager to reassign it.
                    </li>
                    <li>
                        <strong>No notification arrived?</strong> Reminders run daily at 8:00 AM —
                        check back after the schedule runs, or verify your reminder settings in
                        your profile.
                    </li>
                    <li>
                        <strong>Lost changes in the wizard?</strong> The wizard warns you before
                        closing with unsaved work; the red badges show which steps still need
                        attention.
                    </li>
                    <li>
                        <strong>Something looks wrong?</strong> Try refreshing — views remember
                        their tab/state in the URL, so you land where you were.
                    </li>
                </ul>
            </>
        ),
    },
];

/**
 * Role-aware filter: sections without `roles` are for everyone; otherwise the
 * viewer must match at least one tier (same detection as the rest of the app).
 */
export function sectionsForRoles(
    sections: HelpSection[],
    userRoles: string[] | undefined | null,
): HelpSection[] {
    return sections.filter((section) => {
        if (!section.roles || section.roles.length === 0) return true;
        if (section.roles.includes('admin') && isAdminLevel(userRoles)) return true;
        if (section.roles.includes('manager') && (isAdminLevel(userRoles) || isManager(userRoles))) {
            return true;
        }
        return false;
    });
}

export function findSection(
    sections: HelpSection[],
    id: string | null | undefined,
): HelpSection | undefined {
    if (!id) return undefined;
    return sections.find((s) => s.id === id);
}
