import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import CommentInput from './comment-input';
import CommentThread from './comment-thread';

interface UserData {
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

interface ReplyData {
    id: number;
    content: string;
    created_at: string;
    user: UserData;
    attachments?: AttachmentData[];
}

interface CommentData {
    id: number;
    content: string;
    created_at: string;
    user: UserData;
    replies: ReplyData[];
    attachments?: AttachmentData[];
}

interface CommentSectionProps {
    workItemId: number;
    comments: CommentData[];
    authUserId: number;
}

export default function CommentSection({ workItemId, comments, authUserId }: CommentSectionProps) {
    function handleNewComment(content: string) {
        router.post(`/work-items/${workItemId}/comments`, { content }, {
            preserveScroll: true,
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Comments ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* New Comment Input */}
                <CommentInput onSubmit={handleNewComment} />

                {comments.length > 0 && <Separator />}

                {/* Comments List */}
                <div className="space-y-6">
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <CommentThread
                                key={comment.id}
                                comment={comment}
                                authUserId={authUserId}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No comments yet. Be the first to comment!
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}