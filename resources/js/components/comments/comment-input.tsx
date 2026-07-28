import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Reply } from 'lucide-react';

interface CommentInputProps {
    onSubmit: (content: string) => void;
    placeholder?: string;
    isReply?: boolean;
}

export default function CommentInput({ onSubmit, placeholder, isReply = false }: CommentInputProps) {
    const [content, setContent] = useState('');

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!content.trim()) return;
        onSubmit(content.trim());
        setContent('');
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder || (isReply ? 'Write a reply...' : 'Write a comment...')}
                className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!content.trim()}>
                {isReply ? <Reply className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                <span className="ml-1 sr-only sm:not-sr-only">{isReply ? 'Reply' : 'Send'}</span>
            </Button>
        </form>
    );
}