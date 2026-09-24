/**
 * Single source of truth for dependency-type visuals.
 *
 * Each work-item dependency has a type (finish_to_start, start_to_start,
 * finish_to_finish, start_to_finish). Every renderer that draws links -
 * the Gantt arrow overlay, the link popover, the toolbar legend - reads
 * from here so color, geometry and copy never drift.
 */

export type DependencyAnchor = 'start' | 'finish';

export interface DependencyStyle {
    /** Stroke / chip color for this type. */
    color: string;
    /** SVG stroke-dasharray for the visible stroke. */
    dash: string;
    /** Tiny chip label shown at the arrow elbow. */
    short: string;
    /** Human label shown in dropdowns / dialogs. */
    label: string;
    /** One-line plain-language description for the link popover. */
    description: string;
    /** Which end of the predecessor the arrow leaves from. */
    sourceEdge: DependencyAnchor;
    /** Which end of the successor the arrow arrives at. */
    destEdge: DependencyAnchor;
}

export const DEPENDENCY_STYLES: Record<string, DependencyStyle> = {
    finish_to_start: {
        color: '#6366f1',
        dash: 'none',
        short: 'F\u2192S',
        label: 'Finish \u2192 Start',
        description: 'The next task can\u2019t start until this one finishes.',
        sourceEdge: 'finish',
        destEdge: 'start',
    },
    start_to_start: {
        color: '#10b981',
        dash: 'none',
        short: 'S\u2192S',
        label: 'Start \u2192 Start',
        description: 'Both tasks must start together.',
        sourceEdge: 'start',
        destEdge: 'start',
    },
    finish_to_finish: {
        color: '#f59e0b',
        dash: 'none',
        short: 'F\u2192F',
        label: 'Finish \u2192 Finish',
        description: 'Both tasks must finish together.',
        sourceEdge: 'finish',
        destEdge: 'finish',
    },
    start_to_finish: {
        color: '#8b5cf6',
        dash: '4 3',
        short: 'S\u2192F',
        label: 'Start \u2192 Finish',
        description: 'The next task can\u2019t finish until this one starts.',
        sourceEdge: 'start',
        destEdge: 'finish',
    },
};

export const DEPENDENCY_TYPE_ORDER = [
    'finish_to_start',
    'start_to_start',
    'finish_to_finish',
    'start_to_finish',
] as const;

export type DependencyType = (typeof DEPENDENCY_TYPE_ORDER)[number];

/** Fallback style for unknown/legacy type strings. */
export function dependencyStyleOf(type: string): DependencyStyle {
    return DEPENDENCY_STYLES[type] ?? DEPENDENCY_STYLES.finish_to_start;
}

/**
 * Infer the dependency type from which bar ends the drag gesture used.
 * Drag out of the predecessor's start/finish anchor into the successor's
 * start/finish anchor.
 */
export function inferDependencyType(
    fromEdge: DependencyAnchor,
    toEdge: DependencyAnchor
): DependencyType {
    if (fromEdge === 'finish' && toEdge === 'start') return 'finish_to_start';
    if (fromEdge === 'start' && toEdge === 'start') return 'start_to_start';
    if (fromEdge === 'finish' && toEdge === 'finish') return 'finish_to_finish';
    return 'start_to_finish';
}