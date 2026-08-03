<?php

namespace Database\Seeders;

use App\Models\activity_logs;
use App\Models\User;
use App\Models\work_item;
use Illuminate\Database\Seeder;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $workItems = work_item::all();
        $events = ['created', 'updated', 'deleted'];
        $subjectTypes = ['work_item', 'project', 'comment', 'milestone'];

        // Create activity logs for work items
        foreach ($workItems as $workItem) {
            // Create 2-4 activity logs per work item
            $count = rand(2, 4);
            for ($i = 0; $i < $count; $i++) {
                activity_logs::create([
                    'user_id' => $users->random()->id,
                    'subject_id' => $workItem->id,
                    'subject_type' => 'work_item',
                    'event' => fake()->randomElement($events),
                    'description' => fake()->sentence(),
                    'ip_address' => fake()->ipv4(),
                    'user_agent' => fake()->userAgent(),
                    'properties' => ['old_status' => 'todo', 'new_status' => 'in_progress'],
                    'created_at' => now()->subDays(rand(1, 30))->subHours(rand(0, 23)),
                ]);
            }
        }

        // Create some general activity logs
        foreach ($users as $user) {
            $count = rand(3, 8);
            for ($i = 0; $i < $count; $i++) {
                activity_logs::create([
                    'user_id' => $user->id,
                    'subject_id' => fake()->numberBetween(1, 100),
                    'subject_type' => fake()->randomElement($subjectTypes),
                    'event' => fake()->randomElement($events),
                    'description' => fake()->sentence(),
                    'ip_address' => fake()->ipv4(),
                    'user_agent' => fake()->userAgent(),
                    'properties' => null,
                    'created_at' => now()->subDays(rand(1, 30))->subHours(rand(0, 23)),
                ]);
            }
        }
    }
}
