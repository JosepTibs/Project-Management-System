<?php

namespace App\Http\Controllers;

use App\Models\comments;
use App\Models\file_attachment;
use App\Models\work_item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileAttachmentController extends Controller
{
    /**
     * Maximum allowed file size in kilobytes (10MB).
     */
    protected const MAX_FILE_SIZE = 10240;

    /**
     * Allowed MIME types for upload.
     */
    protected const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-zip-compressed',
        'application/json',
    ];

    /**
     * Validate and store uploaded files against an attachable model.
     *
     * @return array<int, array<string, mixed>>
     */
    private function storeFiles(Request $request, string $attachableType, int $attachableId): array
    {
        $validated = $request->validate([
            'files' => 'required|array|max:10',
            'files.*' => [
                'required',
                'file',
                'max:'.self::MAX_FILE_SIZE,
                function ($attribute, $value, $fail) {
                    $mime = $value->getMimeType();
                    if (! in_array($mime, self::ALLOWED_MIMES, true)) {
                        $fail("The file type ({$mime}) is not allowed. Allowed types: images, PDF, Word, Excel, PowerPoint, text, CSV, ZIP, JSON.");
                    }
                },
            ],
        ], [
            'files.required' => 'Please select at least one file.',
            'files.max' => 'You can upload up to 10 files at once.',
            'files.*.max' => 'Each file must be 10MB or smaller.',
        ]);

        $stored = [];

        foreach ($validated['files'] as $file) {
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension() ?: pathinfo($originalName, PATHINFO_EXTENSION);
            $storedName = Str::random(40).'.'.$extension;
            $path = $file->storeAs(
                "attachments/{$attachableType}/{$attachableId}",
                $storedName,
                'public'
            );

            $stored[] = file_attachment::create([
                'attachable_type' => $attachableType,
                'attachable_id' => $attachableId,
                'original_name' => $originalName,
                'stored_name' => $storedName,
                'path' => $path,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'uploaded_by' => auth()->id(),
            ]);
        }

        return array_map(fn (file_attachment $a) => $this->transform($a), $stored);
    }

    /**
     * Transform an attachment model into frontend-friendly data.
     *
     * @return array<string, mixed>
     */
    private function transform(file_attachment $attachment): array
    {
        return [
            'id' => $attachment->id,
            'original_name' => $attachment->original_name,
            'size' => $attachment->size,
            'mime_type' => $attachment->mime_type,
            'url' => Storage::disk('public')->url($attachment->path),
            'download_url' => route('attachments.download', $attachment),
            'uploaded_by' => [
                'id' => $attachment->uploader?->id,
                'name' => $attachment->uploader?->name,
            ],
            'created_at' => $attachment->created_at?->diffForHumans(),
        ];
    }

    /**
     * Upload files to a work item.
     *
     * @return array<string, mixed>
     */
    public function storeToWorkItem(Request $request, work_item $workItem)
    {
        // Only authenticated users who can access the project can upload
        if (! auth()->check()) {
            abort(401);
        }

        // Project members (incl. plain members) may attach files to project items.
        $this->authorize('comment.create', $workItem);

        $this->storeFiles($request, work_item::class, $workItem->id);

        return redirect()->back()->with('success', 'Files uploaded successfully.');
    }

    /**
     * Upload files to a comment.
     *
     * @return array<string, mixed>
     */
    public function storeToComment(Request $request, comments $comment)
    {
        if (! auth()->check()) {
            abort(401);
        }

        // Only members of the owning project may attach files to its comments.
        $owner = $comment->commentable;
        if (! $owner instanceof work_item) {
            abort(403);
        }
        $this->authorize('comment.create', $owner);

        $this->storeFiles($request, comments::class, $comment->id);

        return redirect()->back()->with('success', 'Files uploaded successfully.');
    }

    /**
     * Download an attachment.
     */
    public function download(file_attachment $attachment): StreamedResponse
    {
        if (! auth()->check()) {
            abort(401);
        }

        return Storage::disk('public')->download(
            $attachment->path,
            $attachment->original_name
        );
    }

    /**
     * Delete an attachment.
     *
     * @return array<string, mixed>
     */
    public function destroy(file_attachment $attachment)
    {
        if ($attachment->uploaded_by !== auth()->id()) {
            abort(403, 'You can only delete files you uploaded.');
        }

        $attachment->delete();

        return redirect()->back()->with('success', 'File deleted.');
    }
}
