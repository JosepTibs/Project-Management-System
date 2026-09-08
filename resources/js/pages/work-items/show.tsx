import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Calendar, User as UserIcon, Users, Layers, Paperclip, Pencil, Trash2 } from 'lucide-react';
import BackButton from '@/components/navigation/back-button';
import CommentSection from '@/components/comments/comment-section';
import FileAttachmentUploader from '@/components/attachments/file-attachment-uploader';
import FileAttachmentList from '@/components/attachments/file-attachment-list';
import WorkItemSheet, { type EditWorkItemData, type Member, type WorkItemSheetOption } from '@/components/work-items/work-item-sheet';


interface Status {
    id: number;
    name: string;
}

interface Group {
    id: number;
    name: string;
}

interface Assignee {
    id: number;
    name: string;
}

interface Project {
    id: number;
    name: string;
    item_prefix: string;
}

interface AttachmentData {
    id: number;
    original_name: string;
    size: number;
    mime_type: string;
    url: string;
    download_url: string;
    uploaded_by: { id: number; name: string } | null;
    created_at: string | null;
}

interface WorkItemData {
    id: number;
    title: string;
    description: string;
    priority: string;
    due_date: string;
    progress: number;
    status_id: number;
    group_id: number;
    assignee_id: number;
    start_date: string | null;
    collaborators: number[];
    status: Status | null;
    group: Group | null;
    assignee: Assignee | null;
    project: Project | null;
}

interface DependencyItem {
    id: number;
    title: string;
    progress: number;
    type: string;
    lag: number;
    status: Status | null;
}

const DEPENDENCY_TYPE_LABELS: Record<string, string> = {
    finish_to_start: 'Finish → Start',
    start_to_start: 'Start → Start',
    start_to_finish: 'Start → Finish',
    finish_to_finish: 'Finish → Finish',
};

function dependencyTypeLabel(type: string) {
    return DEPENDENCY_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

interface ReplyData {
    id: number;
    content: string;
    created_at: string;
    user: { id: number; name: string };
}

interface CommentData {
    id: number;
    content: string;
    created_at: string;
    user: { id: number; name: string };
    replies: ReplyData[];
}

interface ShowPageProps extends Record<string, unknown> {
    backUrl: string;
    workItems: WorkItemData;
    attachments: AttachmentData[];
    comments: CommentData[];
    auth: { user: User };
    predecessors: DependencyItem[];
    successors: DependencyItem[];
    blockedStartReasons: string[];
    blockedFinishReasons: string[];
    canBypassGate: boolean;
    filters: {
        statuses: WorkItemSheetOption[];
        groups: WorkItemSheetOption[];
        members: Member[];
    };
}

// Priority now drives a left-accent badge treatment consistent with the calendar view,
// instead of shadcn's generic variant mapping (which collapses "high" and "critical"
// into visually similar default/destructive states).
const PRIORITY_STYLES: Record<string, string> = {
    critical: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    high: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
    low: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    default: 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700',
};

function getPriorityClass(priority: string) {
    return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.default;
}

function formatDate(value: string | null) {
    if (!value) return 'No due date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Non-draggable progress editor shown to users allowed to update this item's
 * progress (admins/managers, or members assigned to / collaborating on it).
 * Type a value 0-100 and press Save; commits to the progress-only endpoint.
 */
function ProgressEditor({
    projectId,
    workItemId,
    initialProgress,
}: {
    projectId: number;
    workItemId: number;
    initialProgress: number;
}) {
    const [value, setValue] = useState(String(initialProgress));
    const [saving, setSaving] = useState(false);
    // Shown value follows saves because page props stay stale under preserveState.
    const [shownProgress, setShownProgress] = useState(initialProgress);

    const parsed = Number(value);
    const isValid = value !== '' && !Number.isNaN(parsed) && parsed >= 0 && parsed <= 100;
    const changed = Math.round(parsed) !== shownProgress;

    const save = () => {
        if (!isValid || saving) return;
        const rounded = Math.round(parsed);
        setSaving(true);
        router.patch(
            `/projects/${projectId}/work-items/${workItemId}/progress`,
            { progress: rounded },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setShownProgress(rounded);
                    setValue(String(rounded));
                },
                onError: () => setValue(String(shownProgress)),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <div className="pt-1 border-t">
            <div className="flex items-center justify-between mb-1.5 pt-3">
                <span className="text-sm text-muted-foreground">Progress</span>
                <div className="flex items-center gap-1.5">
                    <Input
                        type="number"
                        min={0}
                        max={100}
                        value={value}
                        disabled={saving}
                        aria-label="Progress percentage"
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') save();
                            if (e.key === 'Escape') setValue(String(shownProgress));
                        }}
                        className="h-7 w-16 text-right tabular-nums text-sm"
                    />
                    <span className="text-sm font-medium">%</span>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        disabled={!isValid || !changed || saving}
                        onClick={save}
                    >
                        Save
                    </Button>
                </div>
            </div>
            <Progress value={shownProgress} className="h-2" />
        </div>
    );
}

export default function WorkItemShow() {
    const { backUrl, workItems: workItem, attachments, comments, auth, filters, predecessors, successors, blockedStartReasons, blockedFinishReasons, canBypassGate } = usePage<ShowPageProps>().props;
    // Role tiers: admins edit everything; managers only items inside
    // projects they own; members work via progress/status on their own items.
    const userRoles: string[] = ((auth as any)?.roles ?? []) as string[];
    const isAdmin = userRoles.some((r) => ['admin', 'superadmin'].includes(r.toLowerCase()));
    const isManager = !isAdmin && userRoles.some((r) => r.toLowerCase().includes('manager'));
    const canManageProject =
        isAdmin ||
        (isManager && Number((workItem.project as { created_by?: number } | null)?.created_by) === Number(auth.user.id));
    // Progress editing mirrors the backend selfUpdate gate: privileged users,
    // or members assigned to / collaborating on this item.
    const canEditProgress =
        canManageProject ||
        Number(workItem.assignee_id) === Number(auth.user.id) ||
        (workItem.collaborators ?? []).includes(auth.user.id);
    const isStartBlocked = !canBypassGate && blockedStartReasons.length > 0;
    const isFinishBlocked = !canBypassGate && blockedFinishReasons.length > 0;
    const [sheetOpen, setSheetOpen] = useState(false);

    const initialWorkItem: EditWorkItemData = {
        id: workItem.id,
        title: workItem.title,
        description: workItem.description,
        status_id: workItem.status_id ?? workItem.status?.id ?? '',
        group_id: workItem.group_id ?? workItem.group?.id ?? '',
        assignee_id: workItem.assignee_id ?? workItem.assignee?.id ?? '',
        collaborators: workItem.collaborators ?? [],
        priority: workItem.priority,
        progress: workItem.progress,
        start_date: workItem.start_date ?? null,
        due_date: workItem.due_date,
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: workItem.project?.name || 'Project', href: `/projects/${workItem.project?.id}` },
        { title: 'Work Items', href: `/projects/${workItem.project?.id}/work-items` },
        { title: workItem.title, href: `/projects/${workItem.project?.id}/work-items/${workItem.id}` },
    ];

    const handleDelete = () => {
        router.delete(`/projects/${workItem.project?.id}/work-items/${workItem.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={workItem.title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header: back nav, title, priority/status identity, actions */}
                <div className="flex items-start gap-3">
                    <BackButton defaultUrl={`/projects/${workItem.project?.id}/work-items`} preferred={backUrl} />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={`capitalize ${getPriorityClass(workItem.priority)}`}>
                                {workItem.priority}
                            </Badge>
                            {workItem.status && (
                                <Badge variant="secondary">{workItem.status.name}</Badge>
                            )}
                        </div>
                        <h1 className="mt-1 text-2xl font-bold leading-tight">{workItem.title}</h1>
                    </div>
                    
                    {canManageProject && (
                    <div className="flex items-center gap-2 shrink-0">
                        
                            <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                       
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                                
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this work item?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This removes "{workItem.title}" along with its comments and attachments. This can't be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                     )}
                </div>

                {/* Main split: primary content (left) + metadata sidebar (right) */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
                    {/* Primary column */}
                    <div className="flex flex-col gap-4 min-w-0">
                        {(isStartBlocked || isFinishBlocked) && (
                            <div className={`rounded-lg border p-4 text-sm ${isStartBlocked ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300' : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                                <p className="font-semibold">
                                    {isStartBlocked ? 'Blocked — this work item can\u0027t be started yet.' : 'Finish gated — this work item can\u0027t be marked Done yet.'}
                                </p>
                                <ul className="mt-1 list-disc pl-5">
                                    {(isStartBlocked ? blockedStartReasons : blockedFinishReasons).map((reason) => (
                                        <li key={reason}>{reason}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {predecessors.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Depends on ({predecessors.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {predecessors.map((dep) => {
                                        const done = dep.progress >= 100;
                                        const started = dep.progress > 0;
                                        const satisfied =
                                            dep.type === 'finish_to_start' || dep.type === 'finish_to_finish'
                                                ? done
                                                : started;
                                        return (
                                            <Link
                                                key={dep.id}
                                                href={`/projects/${workItem.project!.id}/work-items/${dep.id}`}
                                                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/40"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{dep.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dependencyTypeLabel(dep.type)}{dep.lag > 0 ? ` · +${dep.lag}d` : ''} · {dep.progress}%
                                                    </p>
                                                </div>
                                                <Badge variant={satisfied ? 'default' : 'secondary'} className={satisfied ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                    {satisfied ? 'Met' : 'Waiting'}
                                                </Badge>
                                            </Link>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {successors.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Feeds into ({successors.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {successors.map((dep) => (
                                        <Link
                                            key={dep.id}
                                            href={`/projects/${workItem.project!.id}/work-items/${dep.id}`}
                                            className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/40"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{dep.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {dependencyTypeLabel(dep.type)}{dep.lag > 0 ? ` · +${dep.lag}d` : ''} · {dep.progress}%
                                                </p>
                                            </div>
                                            <Badge variant="outline">{dep.status?.name || '—'}</Badge>
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {workItem.description && (
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{workItem.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Attachments ({attachments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FileAttachmentUploader uploadUrl={`/work-items/${workItem.id}/attachments`} />
                                {attachments.length > 0 && (
                                    <FileAttachmentList attachments={attachments} authUserId={auth.user.id} />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Comments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CommentSection
                                    workItemId={workItem.id}
                                    comments={comments}
                                    authUserId={auth.user.id}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Metadata sidebar — uniform label/value rows instead of a mixed badge/text grid */}
                    <Card className="lg:sticky lg:top-4">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground font-medium">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Layers className="h-3.5 w-3.5" />
                                    Group
                                </span>
                                <span className="text-sm font-medium text-right truncate">{workItem.group?.name || 'Independent'}</span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <UserIcon className="h-3.5 w-3.5" />
                                    Assignee
                                </span>
                                <span className="text-sm font-medium text-right truncate">{workItem.assignee?.name || '—'}</span>
                            </div>

                            {workItem.collaborators?.length > 0 && (
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" />
                                        Collaborators
                                    </span>
                                    <span className="text-sm font-medium">{workItem.collaborators.length}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Due date
                                </span>
                                <span className="text-sm font-medium text-right">{formatDate(workItem.due_date)}</span>
                            </div>

                            {canEditProgress ? (
                                <ProgressEditor
                                    projectId={workItem.project!.id}
                                    workItemId={workItem.id}
                                    initialProgress={workItem.progress}
                                />
                            ) : (
                                <div className="pt-1 border-t">
                                    <div className="flex items-center justify-between mb-1.5 pt-3">
                                        <span className="text-sm text-muted-foreground">Progress</span>
                                        <span className="text-sm font-medium">{workItem.progress}%</span>
                                    </div>
                                    <Progress value={workItem.progress} className="h-2" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <WorkItemSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                mode="edit"
                project={{ id: workItem.project!.id, item_prefix: workItem.project!.item_prefix }}
                members={filters.members}
                statuses={filters.statuses}
                groups={filters.groups}
                workItemId={workItem.id}
                initialWorkItem={initialWorkItem}
                onSuccess={() => setSheetOpen(false)}
            />
        </AppLayout>
    );
}