import { useState, useCallback, useRef } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { router } from '@inertiajs/react';
import KanbanColumn from '@/components/kanban/kanban-column';
import KanbanCard from '@/components/kanban/kanban-card';

interface KanbanCardData {
    id: number;
    title: string;
    priority: string;
    assignee_name: string | null;
    due_date: string | null;
    group_name: string | null;
}

interface KanbanColumnData {
    status: string;
    items: KanbanCardData[];
}

interface StatusData {
    id: number;
    name: string;
    color: string;
}

export default function KanbanBoard({
    columns: initialColumns,
    statuses,
}: {
    columns: KanbanColumnData[];
    statuses: StatusData[];
}) {
    const [columns, setColumns] = useState<KanbanColumnData[]>(initialColumns);
    const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null);
    const sourceColumnRef = useRef<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const findColumnByCardId = useCallback(
        (cardId: number): string | null => {
            for (const column of columns) {
                if (column.items.some((item) => item.id === cardId)) {
                    return column.status;
                }
            }
            return null;
        },
        [columns],
    );

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const card = active.data.current?.card as KanbanCardData | undefined;
        if (card) {
            setActiveCard(card);
            // Store the source column at drag start
            sourceColumnRef.current = findColumnByCardId(card.id);
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        const activeColumn = findColumnByCardId(activeId);
        let overColumn: string | null = null;

        // Check if over is a column or a card
        const overColumnData = columns.find((col) => col.status === overId);
        if (overColumnData) {
            overColumn = overColumnData.status;
        } else {
            overColumn = findColumnByCardId(overId as number);
        }

        if (!activeColumn || !overColumn || activeColumn === overColumn) return;

        setColumns((prev) => {
            const sourceCol = prev.find((col) => col.status === activeColumn);
            const destCol = prev.find((col) => col.status === overColumn);
            if (!sourceCol || !destCol) return prev;

            const activeIndex = sourceCol.items.findIndex((item) => item.id === activeId);
            if (activeIndex === -1) return prev;

            const movingItem = sourceCol.items[activeIndex];

            return prev.map((col) => {
                if (col.status === activeColumn) {
                    return {
                        ...col,
                        items: col.items.filter((item) => item.id !== activeId),
                    };
                }
                if (col.status === overColumn) {
                    return {
                        ...col,
                        items: [...col.items, movingItem],
                    };
                }
                return col;
            });
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveCard(null);

        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        // Determine destination column
        let destColumn: string | null = null;
        const overColumnData = columns.find((col) => col.status === overId);
        if (overColumnData) {
            destColumn = overColumnData.status;
        } else {
            destColumn = findColumnByCardId(overId as number);
        }

        // Reorder within the same column
        if (sourceColumnRef.current && destColumn && sourceColumnRef.current === destColumn) {
            const column = columns.find((col) => col.status === sourceColumnRef.current);
            if (!column) return;

            const activeIndex = column.items.findIndex((item) => item.id === activeId);
            const overIndex = column.items.findIndex((item) => item.id === overId);

            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                setColumns((prev) =>
                    prev.map((col) => {
                        if (col.status === sourceColumnRef.current) {
                            return {
                                ...col,
                                items: arrayMove(col.items, activeIndex, overIndex),
                            };
                        }
                        return col;
                    }),
                );
            }
            sourceColumnRef.current = null;
            return;
        }

        // Card moved to a different column - persist to backend
        if (sourceColumnRef.current && destColumn && sourceColumnRef.current !== destColumn) {
            const destStatus = statuses.find((s) => s.name === destColumn);
            if (destStatus) {
                router.patch(
                    `/work-items/${activeId}/status`,
                    { status_id: destStatus.id },
                    {
                        preserveScroll: true,
                        preserveState: true,
                        onError: (errors) => {
                            console.error('Failed to save status update:', errors);
                            window.location.reload();
                        },
                    },
                );
            }
        }

        sourceColumnRef.current = null;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                {columns.map((column) => (
                    <KanbanColumn key={column.status} column={column} id={column.status} />
                ))}
            </div>

            <DragOverlay>
                {activeCard ? (
                    <div className="opacity-90 rotate-3 shadow-lg">
                        <KanbanCard card={activeCard} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}