<?php

namespace Database\Seeders;

use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Database\Seeder;

class LoginActivitySeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $events = ['login', 'logout'];
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        ];

        foreach ($users as $user) {
            // Create 5-10 login activities per user
            $count = rand(5, 10);
            for ($i = 0; $i < $count; $i++) {
                LoginActivity::create([
                    'user_id' => $user->id,
                    'ip_address' => fake()->ipv4(),
                    'user_agent' => fake()->randomElement($userAgents),
                    'event' => fake()->randomElement($events),
                    'created_at' => now()->subDays(rand(1, 30))->subHours(rand(0, 23)),
                ]);
            }
        }
    }
}
