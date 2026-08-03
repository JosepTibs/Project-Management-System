import { useRef, useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, ImageIcon, Paperclip } from 'lucide-react';

interface FileAttachmentUploaderProps {
    uploadUrl: string;
}

const MAX_FILES = 10;
const MAX_SIZE_MB = 10;

export default function FileAttachmentUploader({ uploadUrl }: FileAttachmentUploaderProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFiles(files: FileList | null) {
        if (!files) return;
        setError(null);

        const validFiles = Array.from(files).slice(0, MAX_FILES);
        const oversized = validFiles.find((file) => file.size > MAX_SIZE_MB * 1024 * 1024);

        if (oversized) {
            setError(`${oversized.name} exceeds the ${MAX_SIZE_MB}MB limit.`);
            return;
        }

        setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, MAX_FILES));
    }

    function formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (selectedFiles.length === 0 || uploading) return;

        setUploading(true);
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('files[]', file));

        router.post(uploadUrl, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedFiles([]);
                setUploading(false);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string | undefined;
                setError(firstError || 'Upload failed. Please try again.');
                setUploading(false);
            },
        });
    }

    function fileIcon(file: File) {
        return file.type.startsWith('image/')
            ? <ImageIcon className="h-4 w-4" />
            : <FileText className="h-4 w-4" />;
    }

    return (
        <div>
            <div
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    handleFiles(e.dataTransfer.files);
                }}
            >
                <Paperclip className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm">
                    <span className="font-medium text-foreground">Click to upload</span>{' '}
                    <span className="text-muted-foreground">or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Up to {MAX_FILES} files, max {MAX_SIZE_MB}MB each (images, PDF, Word, Excel, PowerPoint, text, ZIP, JSON)
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        handleFiles(e.target.files);
                        e.target.value = '';
                    }}
                />
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                            {fileIcon(file)}
                            <span className="flex-1 min-w-0 truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
                                title="Remove"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}

                    <Button type="button" onClick={handleSubmit} disabled={uploading} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                    </Button>
                </div>
            )}
        </div>
    );
}