import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText, ImageIcon, FileArchive, FileSpreadsheet, File as FileIcon } from 'lucide-react';

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

interface FileAttachmentListProps {
    attachments: AttachmentData[];
    authUserId?: number;
    canDelete?: boolean;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-600" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return <FileArchive className="h-4 w-4 text-amber-600" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

export default function FileAttachmentList({ attachments, authUserId, canDelete = true }: FileAttachmentListProps) {
    if (attachments.length === 0) return null;

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this file?')) {
            router.delete(`/attachments/${id}`, { preserveScroll: true });
        }
    }

    return (
        <div className="space-y-2">
            {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    {getFileIcon(attachment.mime_type)}
                    <a href={attachment.download_url} className="flex-1 min-w-0 truncate hover:underline" title={attachment.original_name}>
                        {attachment.original_name}
                    </a>
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(attachment.size)}</span>
                    <a href={attachment.download_url} title="Download">
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            <Download className="h-3 w-3" />
                        </Button>
                    </a>
                    {canDelete && authUserId === attachment.uploaded_by?.id && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(attachment.id)}
                            title="Delete"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
}