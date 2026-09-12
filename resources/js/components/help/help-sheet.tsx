import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { ChevronDown, CircleHelp, ExternalLink, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { helpSections, sectionsForRoles, type HelpSection } from './help-content';

/**
 * Contextual help: a right-side drawer rendering the same manual as the /help
 * page, so users never leave their current screen to look something up.
 */

function useFilteredSections(query: string): HelpSection[] {
    const userRoles = usePage<{ auth?: { roles?: string[] } }>().props.auth?.roles;
    const visible = sectionsForRoles(helpSections, userRoles);

    const search = query.trim().toLowerCase();
    if (!search) return visible;

    return visible.filter(
        (s) => s.title.toLowerCase().includes(search) || (s.keywords ?? '').includes(search),
    );
}

function SectionBody({ section }: { section: HelpSection }) {
    const Icon = section.icon;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-md">
                    <Icon className="h-4 w-4" />
                </span>
                <h4 className="text-sm font-semibold">{section.title}</h4>
            </div>
            <div className="space-y-2">{section.body}</div>
        </div>
    );
}

export function HelpSheet({
    open,
    onOpenChange,
    initialTopic,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTopic?: string | null;
}) {
    const [query, setQuery] = useState('');
    const [openIds, setOpenIds] = useState<string[]>([]);

    const sections = useFilteredSections(query);

    // Pre-open the requested topic whenever the sheet is opened.
    useEffect(() => {
        if (open) {
            setOpenIds(initialTopic ? [initialTopic] : []);
            setQuery('');
        }
    }, [open, initialTopic]);

    // Scroll the pre-opened topic into view once rendered.
    useEffect(() => {
        if (!open || !initialTopic) return;
        const timer = window.setTimeout(() => {
            document.getElementById(`help-${initialTopic}`)?.scrollIntoView({ block: 'start' });
        }, 100);
        return () => window.clearTimeout(timer);
    }, [open, initialTopic, openIds]);

    const toggle = (id: string) =>
        setOpenIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
