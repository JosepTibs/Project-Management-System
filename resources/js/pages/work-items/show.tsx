import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User as UserIcon, Flag, Paperclip, Pencil, Trash2 } from 'lucide-react';
import CommentSection from '@/components/comments/comment-section';
import FileAttachmentUploader from '@/components/attachments/file-attachment-uploader';
import FileAttachmentList from '@/components/attachments/file-attachment-list';

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
    status: Status | null;
    group: Group | null;
    assignee: Assignee | null;
    project: Project | null;
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
}

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'critical': return 'destructive' as const;
        case 'high': return 'default' as const;
        case 'medium': return 'secondary' as const;
        case 'low': return 'outline' as const;
        default: return 'outline' as const;
    }
}

export default function WorkItemShow() {
    const { backUrl, workItems: workItem, attachments, comments, auth } = usePage<ShowPageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: workItem.project?.name || 'Project', href: `/projects/${workItem.project?.id}` },
        { title: 'Work Items', href: `/projects/${workItem.project?.id}/work-items` },
        { title: workItem.title, href: `/projects/${workItem.project?.id}/work-items/${workItem.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={workItem.title} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={backUrl}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{workItem.title}</h1>
                    <div className="ml-auto flex items-center gap-2">
                        <Link href={`/projects/${workItem.project?.id}/work-items/${workItem.id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this work item?')) {
                                    router.delete(`/projects/${workItem.project?.id}/work-items/${workItem.id}`);
                                }
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Work Item Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                                    <div className="mt-1">
                                        <Badge variant="outline">{workItem.status?.name || '—'}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Group</span>
                                    <p className="text-sm">{workItem.group?.name || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Flag className="h-3 w-3" /> Priority
                                    </span>
                                    <div className="mt-1">
                                        <Badge variant={getPriorityVariant(workItem.priority)}>
                                            {workItem.priority}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <UserIcon className="h-3 w-3" /> Assignee
                                    </span>
                                    <p className="text-sm">{workItem.assignee?.name || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Due Date
                                    </span>
                                    <p className="text-sm">{workItem.due_date}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-24 bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary rounded-full h-2"
                                                style={{ width: `${workItem.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground">{workItem.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {workItem.description && (
                            <div className="mt-4 pt-4 border-t">
                                <span className="text-sm font-medium text-muted-foreground">Description</span>
                                <p className="text-sm mt-1 whitespace-pre-wrap">{workItem.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Attachments Section */}
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

                {/* Comments Section */}
                <CommentSection
                    workItemId={workItem.id}
                    comments={comments}
                    authUserId={auth.user.id}
                />
            </div>
        </AppLayout>
    );
}