<?php

namespace App\Traits;

use App\Models\activity_logs;
use Illuminate\Http\Request;

trait LogsActivity
{
    //
    public static function bootLogsActivity()
    {
        foreach (['created', 'updated', 'deleted'] as $event) {
            static::$event(function ($model) use ($event) {
                $model->logActivity($event);
            });
        }
    }
    public function logActivity(string $event): void
    {
        $request = request();

        activity_logs::create([
            'user_id' => auth()->id(),
            'subject_type' => self::class,
            'subject_id' => $this->getKey(),
            'event' => $event,
            'description' => $this->getActivityDescription($event),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'properties' => $this->getActivityProperties($event),
            'created_at' => now(),
        ]);
    }
    public function getActivityDescription(string $event): string
    {

        

        $modelName = class_basename($this);
        $displayName = $this->getDisplayName();

        return match($event) {
            'created' => "Created {$modelName}: {$displayName}",
            'updated' => "Updated {$modelName}: {$displayName}",
            'deleted' => "Deleted {$modelName}: {$displayName}",
        };
    }

    private function getDisplayName(): string
    {
        // For User model, show username or email
        if ($this instanceof \App\Models\User) {
            $username = $this->getAttribute('username');
            $email = $this->getAttribute('email');
            
            if ($username) {
                return $username;
            }
            
            if ($email) {
                return $email;
            }
            
            return (string) $this->getKey();
        }
        
        // For Project model
        if ($this instanceof \App\Models\projects) {
            return $this->name ?? (string) $this->getKey();
        }
        
        // For Work Item model
        if ($this instanceof \App\Models\work_item) {
            return $this->title ?? (string) $this->getKey();
        }
        
        // For other models, try common name attributes
        if ($this->getAttribute('name')) {
            return $this->getAttribute('name');
        }
        
        if ($this->getAttribute('title')) {
            return $this->getAttribute('title');
        }
        
        if ($this->getAttribute('username')) {
            return $this->getAttribute('username');
        }
        
        // Fallback to ID
        return (string) $this->getKey();
    }
    public function getActivityProperties(string $event): array
    {
        if($event === 'updated'){
            return ['old' => $this->getOriginal(),
                    'new'=> $this ->getAttributes(),
                    ];
        }
        return ['data'=> $this->getOriginal()];
    }
}
