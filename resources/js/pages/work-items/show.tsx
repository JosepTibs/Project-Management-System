import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User as UserIcon, Flag } from 'lucide-react';
import CommentSection from '@/components/comments/comment-section';

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
    workItems: WorkItemData;
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
    const { workItems: workItem, comments, auth } = usePage<ShowPageProps>().props;

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
                    <Button  variant="outline"  size="sm" onClick={() => window.history.back()} >
                         <ArrowLeft className="mr-2 h-4 w-4" />
                         Back
                     </Button>
                    <h1 className="text-2xl font-bold">{workItem.title}</h1>
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
                                    <p><Badge variant="outline">{workItem.status?.name || '—'}</Badge></p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Group</span>
                                    <p className="text-sm">{workItem.group?.name || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Flag className="h-3 w-3" /> Priority
                                    </span>
                                    <p>
                                        <Badge variant={getPriorityVariant(workItem.priority)}>
                                            {workItem.priority}
                                        </Badge>
                                    </p>
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