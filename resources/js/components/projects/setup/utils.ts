/* Shared helpers for the project setup wizard (verbatim from lines 97-133). */
import { type WorkItemStatusOption } from './types';
export function formatDate(value: string) {
    if (!value) return 'No date';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function dateRange(start: string, end: string) {
    if (!start && !end) return 'Dates not set';
    if (!start) return `Until ${formatDate(end)}`;
    if (!end) return `From ${formatDate(start)}`;

    return `${formatDate(start)} → ${formatDate(end)}`;
}

export function getWorkItemStatusName(statusId: number | null, statuses: WorkItemStatusOption[]) {
    return statuses.find((status) => status.id === statusId)?.name ?? 'No status';
}

export function generatePrefix(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => word[0].toUpperCase())
        .join('');
}

