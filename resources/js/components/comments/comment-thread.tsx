import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Edit2, Trash2, ChevronDown, ChevronRight, Paperclip } from 'lucide-react';
import CommentInput from './comment-input';
import FileAttachmentList from '@/components/attachments/file-attachment-list';
import FileAttachmentUploader from '@/components/attachments/file-attachment-uploader';

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

interface CommentThreadProps {
    comment: CommentData;
    authUserId: number;
}

export default function CommentThread({ comment, authUserId }: CommentThreadProps) {
    const [showReplies, setShowReplies] = useState(true);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    function handleReply(content: string) {
        router.post(`/comments/${comment.id}/reply`, { content }, {
            preserveScroll: true,
            onSuccess: () => setShowReplyInput(false),
        });
    }

    function startEdit(id: number, currentContent: string) {
        setEditingId(id);
        setEditContent(currentContent);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditContent('');
    }

    function saveEdit(id: number) {
        if (!editContent.trim()) return;
        router.patch(`/comments/${id}`, { content: editContent.trim() }, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this comment?')) {
            router.delete(`/comments/${id}`, { preserveScroll: true });
        }
    }

    function getInitials(name: string): string {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function renderContent(item: { id: number; content: string; user: UserData }) {
        const isEditing = editingId === item.id;

        if (isEditing) {
            return (
                <div className="flex gap-2 mt-1">
                    <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                    <Button size="sm" variant="default" onClick={() => saveEdit(item.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                </div>
            );
        }

        return <p className="text-sm mt-1">{item.content}</p>;
    }

    function renderActions(item: { id: number; user: UserData; content: string }) {
        if (item.user.id !== authUserId) return null;

        return (
            <div className="flex gap-1 ml-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => startEdit(item.id, item.content)}
                    title="Edit"
                >
                    <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Main Comment */}
            <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials(comment.user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.user.name}</span>
                        <span className="text-xs text-muted-foreground">{comment.created_at}</span>
                        {renderActions(comment)}
                    </div>
                    {renderContent(comment)}

                    {/* Attachments on comment */}
                    {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2">
                            <FileAttachmentList attachments={comment.attachments} authUserId={authUserId} />
                        </div>
                    )}

                    {/* Attach files button */}
                    <div className="mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setShowUploader(!showUploader)}
                        >
                            <Paperclip className="h-3 w-3 mr-1" />
                            {showUploader ? 'Hide' : 'Attach files'}
                        </Button>
                        {showUploader && (
                            <div className="mt-2">
                                <FileAttachmentUploader uploadUrl={`/comments/${comment.id}/attachments`} />
                            </div>
                        )}
                    </div>

                    {/* Reply button & toggle */}
                    <div className="flex gap-3 mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setShowReplyInput(!showReplyInput)}
                        >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Reply
                        </Button>
                        {comment.replies.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => setShowReplies(!showReplies)}
                            >
                                {showReplies ? (
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                )}
                                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </Button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {showReplyInput && (
                        <div className="mt-2 ml-4">
                            <CommentInput onSubmit={handleReply} isReply />
                        </div>
                    )}
                </div>
            </div>

            {/* Replies */}
            {showReplies && comment.replies.length > 0 && (
                <div className="ml-11 space-y-3 border-l-2 border-muted pl-4">
                    {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs">{getInitials(reply.user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{reply.user.name}</span>
                                    <span className="text-xs text-muted-foreground">{reply.created_at}</span>
                                    {renderActions(reply)}
                                </div>
                                {renderContent(reply)}

                                {/* Attachments on reply */}
                                {reply.attachments && reply.attachments.length > 0 && (
                                    <div className="mt-2">
                                        <FileAttachmentList attachments={reply.attachments} authUserId={authUserId} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}