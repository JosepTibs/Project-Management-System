import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';

interface KanbanCardData {
    id: number;
    title: string;
    priority: string;
    assignee_name: string | null;
    due_date: string | null;
    group_name: string | null;
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

export default function KanbanCard({ card }: { card: KanbanCardData }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { type: 'card', card },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium leading-snug">{card.title}</p>
                <Badge variant={getPriorityVariant(card.priority)} className="shrink-0 text-[10px] h-5">
                    {card.priority}
                </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {card.assignee_name && (
                    <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {card.assignee_name}
                    </span>
                )}
                {card.due_date && (
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {card.due_date}
                    </span>
                )}
            </div>

            {card.group_name && (
                <div className="mt-2">
                    <span className="inline-block text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {card.group_name}
                    </span>
                </div>
            )}
        </div>
    );
}