<?php

namespace Database\Seeders;

use App\Models\dependencies;
use App\Models\projects;
use Illuminate\Database\Seeder;

class DependencySeeder extends Seeder
{
    public function run(): void
    {
        $types = ['finish_to_start', 'start_to_start', 'start_to_finish', 'finish_to_finish'];

        foreach (projects::all() as $project) {
            $items = $project->workItems()->orderBy('id')->get();

            if ($items->count() < 2) {
                continue;
            }

            // Build a couple of sequential dependency chains so the gantt/chart views
            // have meaningful predecessor -> successor links.
            $chainCount = min(3, (int) floor($items->count() / 2));

            for ($c = 0; $c < $chainCount; $c++) {
                $chunk = $items->slice($c * 2, 2);

                if ($chunk->count() < 2) {
                    continue;
                }

                [$predecessor, $successor] = $chunk->values();

                if ($predecessor->id === $successor->id) {
                    continue;
                }

                dependencies::create([
                    'predecessor_id' => $predecessor->id,
                    'successor_id' => $successor->id,
                    'type' => $types[array_rand($types)],
                    'lag' => rand(0, 3),
                ]);
            }
        }
    }
}
