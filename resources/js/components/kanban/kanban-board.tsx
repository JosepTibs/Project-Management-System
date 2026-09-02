import { useState, useCallback, useRef, useEffect } from 'react';
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
    /** Ownership context for member-restricted dragging. */
    assignee_id?: number | null;
    collaborator_ids?: number[];
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
    authUserId = null,
    canManage = false,
}: {
    columns: KanbanColumnData[];
    statuses: StatusData[];
    /** Logged-in user id; members may only drag their own items. */
    authUserId?: number | null;
    /** Admins/managers may move any card. */
    canManage?: boolean;
}) {
    const [columns, setColumns] = useState<KanbanColumnData[]>(initialColumns);
    const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null);
    const [disclaimer, setDisclaimer] = useState<string | null>(null);
    const sourceColumnRef = useRef<string | null>(null);
    // Keep local board state in sync when the server sends fresh props
    // (e.g. after router.reload() following a failed status save).
    useEffect(() => setColumns(initialColumns), [initialColumns]);
    const disclaimerTimerRef = useRef<number | null>(null);
    // A pressed-but-not-yet-moved pointer on a forbidden card. dnd-kit emits
    // no events for disabled cards, so attempts are detected manually to
    // trigger the "not your work item" disclaimer.
    const pressStateRef = useRef<{ title: string; x: number; y: number; handled: boolean } | null>(null);

    useEffect(
        () => () => {
            if (disclaimerTimerRef.current) window.clearTimeout(disclaimerTimerRef.current);
        },
        [],
    );

    // Members may only drag cards assigned to them or shared with them as
    // collaborators; cards lacking ownership context fail closed (not draggable).
    const canDragCard = useCallback(
        (card: KanbanCardData | null | undefined): boolean => {
            if (!card) return false;
            if (canManage) return true;
            if (authUserId == null) return false;
            return (
                Number(card.assignee_id) === Number(authUserId) ||
                (card.collaborator_ids ?? []).some((id) => Number(id) === Number(authUserId))
            );
        },
        [authUserId, canManage],
    );

    const findCardById = useCallback(
        (cardId: number): KanbanCardData | undefined => {
            for (const column of columns) {
                const found = column.items.find((item) => item.id === cardId);
                if (found) return found;
            }
            return undefined;
        },
        [columns],
    );

    const showDisclaimer = useCallback((title: string) => {
        setDisclaimer(`"${title}" is not your work item — only your own items can be moved.`);
        if (disclaimerTimerRef.current) window.clearTimeout(disclaimerTimerRef.current);
        disclaimerTimerRef.current = window.setTimeout(() => setDisclaimer(null), 3000);
    }, []);

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
        if (!card || !canDragCard(card)) return;
        setActiveCard(card);
        // Store the source column at drag start
        sourceColumnRef.current = findColumnByCardId(card.id);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
        if (!canDragCard(active.data.current?.card as KanbanCardData | undefined)) return;

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

        // Defense in depth: never reorder or persist for forbidden cards.
        if (!canDragCard(active.data.current?.card as KanbanCardData | undefined)) {
            sourceColumnRef.current = null;
            return;
        }

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
                            // Soft reload refetches props without a full page
                            // load, preserving tab/scope state and React state.
                            router.reload({ only: ['columns', 'workItems'] });
                        },
                    },
                );
            }
        }

        sourceColumnRef.current = null;
    }

    // Attempt detection for forbidden cards (they emit no dnd-kit events).
    const handlePointerDownCapture = (e: React.PointerEvent) => {
        pressStateRef.current = null;
        const el = (e.target as HTMLElement).closest('[data-card-id]');
        if (!el) return;
        const card = findCardById(Number(el.getAttribute('data-card-id')));
        if (!card || canDragCard(card)) return;
        pressStateRef.current = { title: card.title, x: e.clientX, y: e.clientY, handled: false };
    };

    const handlePointerMoveCapture = (e: React.PointerEvent) => {
        const press = pressStateRef.current;
        if (!press || press.handled) return;
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) {
            press.handled = true;
            showDisclaimer(press.title);
        }
    };

    const handleKeyDownCapture = (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = (e.target as HTMLElement).closest('[data-card-id]');
        if (!el) return;
        const card = findCardById(Number(el.getAttribute('data-card-id')));
        if (card && !canDragCard(card)) showDisclaimer(card.title);
    };

    return (
        <div className="relative h-full">
            {/* Disclaimer when a member tries to move someone else's card */}
            {disclaimer && (
                <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
                    {disclaimer}
                </div>
            )}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div
                    className="flex gap-4 overflow-x-auto pb-4 h-full"
                    onPointerDownCapture={handlePointerDownCapture}
                    onPointerMoveCapture={handlePointerMoveCapture}
                    onKeyDownCapture={handleKeyDownCapture}
                >
                    {columns.map((column) => (
                        <KanbanColumn
                            key={column.status}
                            column={column}
                            id={column.status}
                            isCardDisabled={(card) => !canDragCard(card)}
                        />
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
        </div>
    );
}