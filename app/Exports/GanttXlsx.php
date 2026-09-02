<?php

namespace App\Exports;

use App\Models\projects;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Gantt timeline sheet for a single project, rendered as the classic Excel
 * "colored cells" Gantt: task rows on the left (frozen), week columns to the
 * right, bars as cell fills colored by priority, milestones as ◆ markers.
 */
class GanttXlsx
{
    /** Priority → bar fill color (matches the app's badge palette). */
    protected const PRIORITY_COLORS = [
        'critical' => 'C00000',
        'high' => 'E11D48',
        'medium' => 'F59E0B',
        'low' => '10B981',
    ];

    protected const DONE_COLOR = '9CA3AF';

    /** First timeline column (F). */
    protected const FIRST_TIMELINE_COL = 6;

    protected int $timelineCols = 0;

    /** Timeline columns: [{label, band, start, end}]. */
    protected array $columns = [];

    /** Queued bar fills: [{row, from, to, color}]. */
    protected array $bars = [];

    /** Queued milestone markers: [{row, col}]. */
    protected array $milestones = [];

    public function __construct(protected projects $project)
    {
    }

    public function build(): Spreadsheet
    {
        $project = $this->project;
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($this->sheetTitle());

        [$start, $end] = $this->resolveRange($project);
        $monthly = $start->diffInDays($end) > 365;
        $this->columns = $this->buildColumns($start, $end, $monthly);
        $this->timelineCols = count($this->columns);

        // Title & legend.
        $sheet->setCellValue('A1', $project->name . ' — Gantt');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->setCellValue('A2', 'Generated: ' . now()->format('M d, Y H:i')
            . ' · ' . $start->format('M d, Y') . ' → ' . $end->format('M d, Y')
            . ' · ' . $project->workItems->count() . ' items · ' . $project->milestones->count() . ' milestones'
            . '   |   ■ bar (priority color) · ░ completed · ◆ milestone');
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(9)
            ->setColor(new Color('FF6B7280'));

            // Month band (row 3) & period labels (row 4).
        $bandRow = 3;
        $labelRow = 4;
        $firstDataRow = 5;

        $bandKey = null;
        $bandStartCol = self::FIRST_TIMELINE_COL;
        foreach ($this->columns as $i => $col) {
            $this->cell($sheet, self::FIRST_TIMELINE_COL + $i, $labelRow)->setValue($col['label']);
            if ($bandKey === null) {
                $bandKey = $col['band'];
                $bandStartCol = self::FIRST_TIMELINE_COL + $i;
            } elseif ($col['band'] !== $bandKey) {
                $this->writeBand($sheet, $bandRow, $bandStartCol, self::FIRST_TIMELINE_COL + $i - 1, $bandKey);
                $bandKey = $col['band'];
                $bandStartCol = self::FIRST_TIMELINE_COL + $i;
            }
        }
        $this->writeBand($sheet, $bandRow, $bandStartCol, self::FIRST_TIMELINE_COL + $this->timelineCols - 1, $bandKey);

        // Field-name headers for the frozen task columns (rows 3/4 are band
        // + timeline period labels).
        foreach ([1 => 'Task', 2 => 'Assignee', 3 => 'Start', 4 => 'Due', 5 => 'Progress'] as $c => $header) {
            $this->cell($sheet, $c, $labelRow)->setValue($header);
        }

        // Task rows, nested by milestone → work item group → items. Anything
        // not under a milestone drops into labelled fallback sections.
        $row = $firstDataRow;
        $items = $project->workItems;

        $groupsByMilestone = $project->workItemGroups->groupBy(fn ($g) => $g->milestone_id ?? 0);
        $itemsByGroup = $items->groupBy(fn ($item) => $item->group_id ?? 0);
        $ungroupedItems = $itemsByGroup[0] ?? collect();
        $hasGroups = $project->workItemGroups->isNotEmpty();

        foreach ($project->milestones as $milestone) {
            $this->cell($sheet, 1, $row)->setValue('◆ ' . $milestone->name);
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $this->markMilestone($row, $milestone->target_date);
            $row++;

            foreach (($groupsByMilestone[$milestone->id] ?? []) as $group) {
                $this->writeGroup($sheet, $row, $group, $itemsByGroup[$group->id] ?? collect());
                $row += 1 + ($itemsByGroup[$group->id] ?? collect())->count();
            }
        }

        // Groups attached to no milestone.
        $looseGroups = $groupsByMilestone[0] ?? collect();
        if ($hasGroups && $looseGroups->isNotEmpty()) {
            $this->cell($sheet, 1, $row)->setValue('Groups without a milestone');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $row++;
            foreach ($looseGroups as $group) {
                $this->writeGroup($sheet, $row, $group, $itemsByGroup[$group->id] ?? collect());
                $row += 1 + ($itemsByGroup[$group->id] ?? collect())->count();
            }
        }

        // Items not in any group.
        if ($ungroupedItems->isNotEmpty()) {
            $this->cell($sheet, 1, $row)->setValue($hasGroups ? 'Ungrouped items' : 'Tasks');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $row++;
            foreach ($ungroupedItems as $item) {
                $this->writeItem($sheet, $row, $item, '        ▸ ');
                $row++;
            }
        }

        // Header styling.
        $sheet->getStyle('A4:E4')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '334155']],
        ]);
        $lastTimelineCol = self::FIRST_TIMELINE_COL + $this->timelineCols - 1;
        $sheet->getStyle($this->range(self::FIRST_TIMELINE_COL, 4, $lastTimelineCol, 4))->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '334155']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Apply bars.
        foreach ($this->bars as $bar) {
            $sheet->getStyle($this->range($bar['from'], $bar['row'], $bar['to'], $bar['row']))->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bar['color']]],
            ]);
        }

        // Apply milestone markers.
        foreach ($this->milestones as $marker) {
            $cell = $this->cell($sheet, $marker['col'], $marker['row']);
            $cell->setValue('◆');
            $cell->getStyle()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $cell->getStyle()->getFont()->setBold(true)->setSize(12);
        }

        // Light grid over the timeline area.
        if ($row > $firstDataRow && $this->timelineCols > 0) {
            $sheet->getStyle($this->range(self::FIRST_TIMELINE_COL, $firstDataRow, $lastTimelineCol, $row - 1))->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => 'hair', 'color' => ['rgb' => 'E5E7EB']]],
            ]);
        }

        $sheet->freezePane('F5');
        $sheet->getColumnDimension('A')->setWidth(38);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(11);
        $sheet->getColumnDimension('D')->setWidth(11);
        $sheet->getColumnDimension('E')->setWidth(8);
        for ($c = self::FIRST_TIMELINE_COL; $c <= $lastTimelineCol; $c++) {
            $sheet->getColumnDimensionByColumn($c)->setWidth(7);
        }

        return $spreadsheet;
    }

    /**
     * Render a group header row (bold, with a summary bar) followed by its
     * items. Returns via the caller's row tracking (items written, not count).
     */
    protected function writeGroup($sheet, int $row, $group, $groupItems): void
    {
        $this->cell($sheet, 1, $row)->setValue('    ' . $group->name);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $this->bar($row, $group->start_date, $group->end_date ?? $group->start_date, '64748B', false);
        $row++;

        foreach ($groupItems as $item) {
            $this->writeItem($sheet, $row, $item, '        ▸ ');
            $row++;
        }
    }

    protected function writeItem($sheet, int $row, $item, string $prefix): void
    {
        $done = (int) ($item->progress ?? 0) >= 100;
        $this->cell($sheet, 1, $row)->setValue($prefix . $item->title);
        $this->cell($sheet, 2, $row)->setValue($item->assignee?->name ?? '—');
        $this->cell($sheet, 3, $row)->setValue($item->start_date?->format('Y-m-d') ?? '—');
        $this->cell($sheet, 4, $row)->setValue($item->due_date?->format('Y-m-d') ?? '—');
        $this->cell($sheet, 5, $row)->setValue(((int) ($item->progress ?? 0)) . '%');
        $this->bar($row, $item->start_date, $item->due_date, $this->priorityColor($item->priority), $done);
    }

    /**
     * Timeline window: project dates → item milestone min/max → fallback.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function resolveRange(projects $project): array
    {
        $start = $project->start_date?->copy();
        $end = $project->end_date?->copy();

        foreach ($project->workItems as $item) {
            $s = $item->start_date ?? $item->due_date;
            $e = $item->due_date ?? $item->start_date;
            if ($s && (!$start || $s->lt($start))) {
                $start = $s->copy();
            }
            if ($e && (!$end || $e->gt($end))) {
                $end = $e->copy();
            }
        }
        foreach ($project->milestones as $milestone) {
            if ($milestone->target_date && (!$start || $milestone->target_date->lt($start))) {
                $start = $milestone->target_date->copy();
            }
            if ($milestone->target_date && (!$end || $milestone->target_date->gt($end))) {
                $end = $milestone->target_date->copy();
            }
        }

        $start ??= Carbon::today()->subMonth();
        $end ??= Carbon::today()->addMonths(3);
        if ($end->lte($start)) {
            $end = $start->copy()->addMonth();
        }

        return [$start, $end];
    }

    /** Weekly (Monday-based) columns, or monthly for ranges over a year. */
    protected function buildColumns(Carbon $start, Carbon $end, bool $monthly): array
    {
        $columns = [];
        if ($monthly) {
            $cursor = $start->copy()->startOfMonth();
            while ($cursor->lte($end)) {
                $columns[] = [
                    'label' => $cursor->format('M y'),
                    'band' => $cursor->format('Y'),
                    'start' => $cursor->copy()->startOfDay(),
                    'end' => $cursor->copy()->endOfMonth()->endOfDay(),
                ];
                $cursor->addMonth();
            }

            return $columns;
        }

        $cursor = $start->copy()->startOfWeek(Carbon::MONDAY);
        while ($cursor->lte($end)) {
            $columns[] = [
                'label' => $cursor->format('M d'),
                'band' => $cursor->format('F Y'),
                'start' => $cursor->copy()->startOfDay(),
                'end' => $cursor->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay(),
            ];
            $cursor->addWeek();
        }

        return $columns;
    }

    protected function priorityColor(?string $priority): string
    {
        return self::PRIORITY_COLORS[strtolower($priority ?? 'medium')] ?? self::PRIORITY_COLORS['medium'];
    }

    /** Queue a bar fill between two dates (either missing → no bar). */
    protected function bar(int $row, ?Carbon $from, ?Carbon $to, string $color, bool $done = false): void
    {
        if (!$from || !$to) {
            return;
        }
        $fromCol = $this->colForDate($from);
        $toCol = $this->colForDate($to);
        if ($fromCol === null || $toCol === null || $toCol < $fromCol) {
            return;
        }
        $this->bars[] = [
            'row' => $row,
            'from' => self::FIRST_TIMELINE_COL + $fromCol,
            'to' => self::FIRST_TIMELINE_COL + min($toCol, $this->timelineCols - 1),
            'color' => $done ? self::DONE_COLOR : $color,
        ];
    }

    /** Queue a ◆ marker in the column containing the milestone date. */
    protected function markMilestone(int $row, ?Carbon $date): void
    {
        if (!$date) {
            return;
        }
        $col = $this->colForDate($date);
        if ($col !== null) {
            $this->milestones[] = ['row' => $row, 'col' => self::FIRST_TIMELINE_COL + $col];
        }
    }

    /** Column index (0-based) within the timeline containing the date. */
    protected function colForDate(Carbon $date): ?int
    {
        foreach ($this->columns as $i => $col) {
            if ($date->between($col['start'], $col['end'])) {
                return $i;
            }
        }

        return null;
    }

    protected function writeBand($sheet, int $bandRow, int $from, int $to, string $label): void
    {
        $this->cell($sheet, $from, $bandRow)->setValue($label);
        if ($to > $from) {
            $sheet->mergeCells($this->range($from, $bandRow, $to, $bandRow));
        }
        $cell = $this->cell($sheet, $from, $bandRow);
        $cell->getStyle()->getFont()->setBold(true);
        $cell->getStyle()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }

    /**
     * PhpSpreadsheet 4+/5.x removed getCellByColumnAndRow() and friends —
     * these helpers rebuild the same ergonomics on the string-coordinate API.
     */
    protected function cell($sheet, int $col, int $row)
    {
        return $sheet->getCell(Coordinate::stringFromColumnIndex($col) . $row);
    }

    protected function range(int $fromCol, int $fromRow, int $toCol, int $toRow): string
    {
        return Coordinate::stringFromColumnIndex($fromCol) . $fromRow
            . ':' . Coordinate::stringFromColumnIndex($toCol) . $toRow;
    }

    protected function sheetTitle(): string
    {
        $name = $this->project->item_prefix ?: $this->project->name;
        $clean = preg_replace('/[:\\\\\/\?\*\[\]]/', '', $name);

        return substr('Gantt ' . $clean, 0, 31);
    }
}

