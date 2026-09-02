import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from '@/components/kanban/kanban-card';

interface KanbanCardData {
    id: number;
    title: string;
    priority: string;
    assignee_name: string | null;
    due_date: string | null;
    group_name: string | null;
    assignee_id?: number | null;
    collaborator_ids?: number[];
}

interface KanbanColumnData {
    status: string;
    items: KanbanCardData[];
}

const STATUS_COLORS: Record<string, string> = {
    'To Do': '#6b7280',
    'In Progress': '#3b82f6',
    'Under Review': '#f59e0b',
    'Done': '#10b981',
};

function getStatusColor(statusName: string): string {
    return STATUS_COLORS[statusName] || '#6b7280';
}

export default function KanbanColumn({
    column,
    id,
    isCardDisabled,
}: {
    column: KanbanColumnData;
    id: string;
    /** Returns true for cards the current user may not drag. */
    isCardDisabled?: (card: KanbanCardData) => boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    const color = getStatusColor(column.status);

    return (
        <div className="w-80 min-w-[320px] flex flex-col bg-muted/30 rounded-lg">
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <h3 className="text-sm font-semibold">{column.status}</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {column.items.length}
                </span>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] transition-colors ${
                    isOver ? 'bg-primary/5 border-2 border-dashed border-primary/30 rounded-b-lg' : ''
                }`}
            >
                <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    {column.items.map((card) => (
                        <KanbanCard key={card.id} card={card} disabled={isCardDisabled?.(card) ?? false} />
                    ))}
                </SortableContext>

                {column.items.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                        Drop items here
                    </div>
                )}
            </div>
        </div>
    );
}