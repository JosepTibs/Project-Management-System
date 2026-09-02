import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WorkItemOption {
    id: number;
    title: string;
}

interface AddDependencyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: number;
    workItems: WorkItemOption[];
    onCreated?: () => void;
}

export const DEPENDENCY_TYPES = [
    { value: 'finish_to_start', label: 'Finish → Start' },
    { value: 'start_to_start', label: 'Start → Start' },
    { value: 'start_to_finish', label: 'Start → Finish' },
    { value: 'finish_to_finish', label: 'Finish → Finish' },
] as const;

export default function AddDependencyDialog({
    open,
    onOpenChange,
    projectId,
    workItems,
    onCreated,
}: AddDependencyDialogProps) {
    const [predecessorId, setPredecessorId] = useState('');
    const [successorId, setSuccessorId] = useState('');
    const [type, setType] = useState('finish_to_start');
    const [lag, setLag] = useState('0');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function reset() {
        setPredecessorId('');
        setSuccessorId('');
        setType('finish_to_start');
        setLag('0');
        setError(null);
        setProcessing(false);
    }

    const canSubmit =
        predecessorId !== '' &&
        successorId !== '' &&
        Number(predecessorId) !== Number(successorId);
function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || processing) return;

        setProcessing(true);
        setError(null);

        router.post(
            `/projects/${projectId}/dependencies`,
            {
                predecessor_id: Number(predecessorId),
                successor_id: Number(successorId),
                type,
                lag: lag === '' ? 0 : Number(lag),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setProcessing(false);
                    reset();
                    onOpenChange(false);
                    onCreated?.();
                },
                onError: (errs) => {
                    setProcessing(false);
                    const first = Object.values(errs)[0];
                    setError(typeof first === 'string' ? first : 'Could not create the dependency.');
                },
            }
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) reset();
                onOpenChange(o);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add dependency</DialogTitle>
                    <DialogDescription>
                        Link one work item to another and choose how they relate.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Predecessor</Label>
                        <Select value={predecessorId} onValueChange={setPredecessorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select predecessor" />
                            </SelectTrigger>
                            <SelectContent>
                                {workItems.map((w) => (
                                    <SelectItem
                                        key={w.id}
                                        value={String(w.id)}
                                        disabled={String(w.id) === successorId}
                                    >
                                        {w.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Successor</Label>
                        <Select value={successorId} onValueChange={setSuccessorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select successor" />
                            </SelectTrigger>
                            <SelectContent>
                                {workItems.map((w) => (
                                    <SelectItem
                                        key={w.id}
                                        value={String(w.id)}
                                        disabled={String(w.id) === predecessorId}
                                    >
                                        {w.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Dependency type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPENDENCY_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Lag (days)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={lag}
                                onChange={(e) => setLag(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!canSubmit || processing}>
                            {processing ? 'Saving...' : 'Add dependency'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}