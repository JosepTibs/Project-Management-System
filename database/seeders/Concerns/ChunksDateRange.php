<?php

namespace Database\Seeders\Concerns;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

trait ChunksDateRange
{
    /**
     * Split [start, end] into $count contiguous, non-overlapping day windows
     * that exactly tile the range. Guarantees for every returned window:
     *
     *  - start <= end
     *  - start >= parent start
     *  - end   <= parent end
     *
     * This is the single source of truth for seeding the date hierarchy
     * (project -> milestone -> group -> work item). Because windows are
     * computed with integer floor/remainder division on inclusive day counts,
     * the hierarchy is valid by construction no matter when the seed runs.
     *
     * @return array<int, array{start: CarbonImmutable, end: CarbonImmutable}>
     */
    protected function dateWindows(CarbonInterface $start, CarbonInterface $end, int $count): array
    {
        $start = CarbonImmutable::instance($start)->startOfDay();
        $end = CarbonImmutable::instance($end)->startOfDay();
        $count = max(1, $count);

        $totalDays = (int) $start->diffInDays($end) + 1; // inclusive
        $base = intdiv($totalDays, $count);
        $remainder = $totalDays % $count;

        $windows = [];
        $cursor = $start;

        for ($i = 0; $i < $count; $i++) {
            $length = $base + ($i < $remainder ? 1 : 0);
            $winStart = $cursor->greaterThan($end) ? $end : $cursor;
            $winEnd = $winStart->addDays(max(0, $length - 1));
            if ($winEnd->greaterThan($end)) {
                $winEnd = $end;
            }
            $windows[] = ['start' => $winStart, 'end' => $winEnd];
            $cursor = $winEnd->addDay();
        }

        return $windows;
    }
}
