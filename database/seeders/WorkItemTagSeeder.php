<?php

namespace Database\Seeders;

use App\Models\projects;
use App\Models\Tags;
use Illuminate\Database\Seeder;

class WorkItemTagSeeder extends Seeder
{
    public function run(): void
    {
        foreach (projects::all() as $project) {
            $tags = Tags::where('project_id', $project->id)->get();

            if ($tags->isEmpty()) {
                continue;
            }

            foreach ($project->workItems as $workItem) {
                $randomTags = $tags->random(min(3, $tags->count()));
                foreach ($randomTags as $tag) {
                    $workItem->tags()->syncWithoutDetaching([$tag->id]);
                }
            }
        }
    }
}
