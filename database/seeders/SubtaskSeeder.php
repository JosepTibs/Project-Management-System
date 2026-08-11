<?php

namespace Database\Seeders;

use App\Models\subtasks;
use App\Models\User;
use App\Models\work_item;
use Illuminate\Database\Seeder;

class SubtaskSeeder extends Seeder
{
    public function run(): void
    {
        $priorities = ['low', 'medium', 'high', 'critical'];

        $subtaskTitles = [
            'Write unit tests',
            'Code review',
            'Update documentation',
            'QA pass',
            'Implement UI styling',
            'Fix minor bugs',
            'Refactor related code',
            'Setup environment',
        ];

        foreach (work_item::all() as $workItem) {
            $members = User::whereIn('id', function ($q) use ($workItem) {
                $q->select('user_id')
                    ->from('project_members')
                    ->where('project_id', $workItem->project_id);
            })->get();

            $count = rand(2, 4);
            $titles = $subtaskTitles;
            shuffle($titles);
            $titles = array_slice($titles, 0, $count);

            foreach ($titles as $order => $title) {
                $dueDate = $workItem->due_date
                    ? $workItem->due_date->copy()->subDays(rand(0, 3))
                    : now()->addDays(rand(1, 30));

                subtasks::create([
                    'work_item_id' => $workItem->id,
                    'assignee_id' => $members->count() ? $members->random()->id : null,
                    'title' => $title,
                    'description' => "Subtask: {$title} for {$workItem->title}.",
                    'priority' => $priorities[array_rand($priorities)],
                    'progress' => rand(0, 100),
                    'due_date' => $dueDate->format('Y-m-d'),
                    'order' => $order + 1,
                ]);
            }
        }
    }
}
