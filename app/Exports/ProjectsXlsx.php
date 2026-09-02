<?php

namespace App\Exports;

use App\Models\projects;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Summary sheet of the (role-scoped) projects list. Mirrors the columns of
 * the projects table view so exports match what the user sees on screen.
 */
class ProjectsXlsx
{
    protected string $scopeNote;

    /**
     * @param Collection<int, projects> $projects
     */
    public function __construct(protected $projects, ?string $scopeNote = null)
    {
        $this->scopeNote = $scopeNote ?? 'All visible projects';
    }

    public function build(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Projects');

        $sheet->setCellValue('A1', 'Projects');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $sheet->setCellValue('A2', 'Generated: ' . now()->format('M d, Y H:i') . ' · '
            . $this->projects->count() . ' projects · ' . $this->scopeNote);
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10)
            ->setColor(new Color('FF6B7280'));

        $headers = ['Name', 'Prefix', 'Status', 'Members', 'Work Items', 'Progress', 'Start', 'Due', 'Created By', 'Archived'];
        $sheet->fromArray($headers, null, 'A4');
        $sheet->getStyle('A4:J4')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '334155']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);

        $row = 5;
        foreach ($this->projects as $project) {
            $status = $project->status?->name ?? '—';
            $sheet->fromArray([
                $project->name,
                $project->item_prefix,
                $status,
                $project->members_count ?? 0,
                $project->work_items_count ?? 0,
                (int) round((float) ($project->completion_percentage ?? 0)) / 100,
                $project->start_date?->format('Y-m-d') ?? '—',
                $project->end_date?->format('Y-m-d') ?? '—',
                $project->creator?->name ?? 'Unknown',
                $project->archived_at !== null ? 'Yes' : 'No',
            ], null, 'A' . $row);

            // Progress as a real percentage cell.
            $sheet->getStyle('F' . $row)->getNumberFormat()->setFormatCode('0%');

            // Subtle status coloring, mirroring the app badges.
            $statusColor = match (true) {
                $project->archived_at !== null => 'FFE5E7EB',
                str_contains(strtolower($status), 'complet') => 'FFD1FAE5',
                str_contains(strtolower($status), 'risk') || str_contains(strtolower($status), 'hold') => 'FFFEF3C7',
                default => null,
            };
            if ($statusColor) {
                $sheet->getStyle('C' . $row)->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => substr($statusColor, 2)]],
                ]);
            }

            $row++;
        }

        $lastRow = max($row - 1, 4);
        $sheet->freezePane('A5');
        $sheet->setAutoFilter('A4:J' . $lastRow);
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return $spreadsheet;
    }
}
