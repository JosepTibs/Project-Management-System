import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEPENDENCY_TYPE_ORDER, dependencyStyleOf, type DependencyType } from './dependency-style';

export interface PendingLink {
    predecessorId: number;
    successorId: number;
    predecessorTitle: string;
    successorTitle: string;
    /** Type inferred from the drag gesture (which bar ends were used). */
    inferredType: DependencyType;
    /** Client coordinates of the drop point, for popover placement. */
    x: number;
    y: number;
}

interface DependencyLinkPopoverProps {
    link: PendingLink | null;
    projectId: number;
    onClose: () => void;
    onCreated: () => void;
}

/**
 * Confirm popover shown when a link drag is dropped onto another task bar.
 * Shows both task names, preselects the gesture-inferred type, lets the user
 * override type + lag, then posts to the same endpoint the dialog uses.
 */
export default function DependencyLinkPopover({
    link,
    projectId,
    onClose,
    onCreated,
}: DependencyLinkPopoverProps) {
    const [type, setType] = useState<DependencyType>('finish_to_start');
    const [lag, setLag] = useState('0');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset to the inferred type each time a new drop happens.
    useEffect(() => {
        if (link) {
            setType(link.inferredType);
            setLag('0');
            setError(null);
            setProcessing(false);
        }
    }, [link]);

    // Close on Escape.
    useEffect(() => {
        if (!link) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [link, onClose]);

    const popoverRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({width: 300, height: 480});
    const [placed, setPlaced] = useState(false);

    // Measure the rendered popover so positioning can flip away from the
    // nearest viewport edge using real dimensions, not a hardcoded guess.
    useLayoutEffect(() => {
        const el = popoverRef.current;
        if (!el) return;

        const measure = () => {
            setSize({ width: el.offsetWidth, height: el.offsetHeight });
            setPlaced(true);
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(el);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [link]);

    // Nothing to show until a drop happens.
    // Captured in a local so the non-null narrowing survives into the
    // submit handler (which TypeScript analyses independently of this guard).
    const activeLink = link;
    if (!activeLink) return null;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (processing || !activeLink) return;

        setProcessing(true);
        setError(null);

        router.post(
            `/projects/${projectId}/dependencies`,
            {
                predecessor_id: activeLink.predecessorId,
                successor_id: activeLink.successorId,
                type,
                lag: lag === '' ? 0 : Number(lag),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setProcessing(false);
                    onCreated();
                    onClose();
                },
                onError: (errs) => {
                    setProcessing(false);
                    const first = Object.values(errs)[0];
                    setError(typeof first === 'string' ? first : 'Could not create the dependency.');
                },
            }
        );
    }

    const style = dependencyStyleOf(type);
    const MARGIN = 12;
    const flipX = activeLink.x + 16 + size.width > window.innerWidth - MARGIN;
    const flipY = activeLink.y + 12 + size.height > window.innerHeight - MARGIN;

    const rawLeft = flipX ? activeLink.x - size.width - 16 : activeLink.x + 16;
    const rawTop = flipY ? activeLink.y - size.height - 12 : activeLink.y + 12;

    const left = Math.min(Math.max(rawLeft, MARGIN), Math.max(MARGIN, window.innerWidth - size.width - MARGIN));
    const top = Math.min(Math.max(rawTop, MARGIN), Math.max(MARGIN, window.innerHeight - size.height - MARGIN));

    return (
        <>
            {/* Click-away layer */}
            <div className="fixed inset-0 z-[110]" onClick={onClose} />
            <div
                ref = {popoverRef}
                className="fixed z-[120] w-[300px] max-h-[calc(100vh-24px)] overflow-y-auto rounded-lg border bg-background shadow-xl"
                style={{left, top, visibility: placed ? 'visible' : 'hidden', }}
            >
                <form onSubmit={handleSubmit} className="space-y-3 p-4">
                    <div>
                        <p className="text-sm font-semibold">Link tasks</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{activeLink.predecessorTitle}</span>
                            {' → '}
                            <span className="font-medium text-foreground">{activeLink.successorTitle}</span>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Dependency type</Label>
                        <div className="space-y-1.5">
                            {DEPENDENCY_TYPE_ORDER.map((value) => {
                                const s = dependencyStyleOf(value);
                                const selected = type === value;
                                return (
                                    <label
                                        key={value}
                                        className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 transition-colors ${
                                            selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="dep-type"
                                            value={value}
                                            checked={selected}
                                            onChange={() => setType(value)}
                                            className="mt-1"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-1.5 text-xs font-medium">
                                                <span
                                                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                                                    style={{ backgroundColor: s.color }}
                                                />
                                                {s.short} · {s.label}
                                            </span>
                                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                {s.description}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="link-lag">Lag (days)</Label>
                        <Input
                            id="link-lag"
                            type="number"
                            min={0}
                            value={lag}
                            onChange={(e) => setLag(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    {error && <p className="text-xs text-red-600">{error}</p>}

                    <p
                        className="rounded-md px-2 py-1.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${style.color}1a`, color: style.color }}
                    >
                        Creating {style.short} · {style.label}
                        {lag !== '' && Number(lag) > 0 ? ` · +${lag}d` : ''}
                    </p>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? 'Linking…' : 'Create link'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}