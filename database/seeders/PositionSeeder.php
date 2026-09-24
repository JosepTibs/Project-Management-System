<?php

namespace Database\Seeders;

use App\Models\Position;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PositionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Quality Analyst', 'Soft Dev', 'Network', 'Database', 'Technicals'] as $name) {
            Position::firstOrCreate(['name' => $name]);
        }
    }
}