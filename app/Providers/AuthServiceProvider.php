<?php

namespace App\Providers;

use App\Models\projects;
use App\Models\work_item;
use Gate;
use Illuminate\Support\ServiceProvider;


class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //

    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        
        //
        Gate::before(function ($user) {
            return $user->roles->contains(fn ($role) => strtolower($role->name) === 'admin') ? true : null;
        });
    //project crud

        Gate::define('view', function ($user, projects $project) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $project->members->contains('user_id', $user->id);
        });

        Gate::define('update', function ($user, projects $project) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $project->members->contains('user_id', $user->id);
        });

        Gate::define('delete', function ($user, projects $project) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $project->members->contains('user_id', $user->id);
        });
    //project crud - end

    //work item crud
        Gate::define('work-item.create', function ($user, projects $project) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $project->members->contains('user_id', $user->id);
        });

        Gate::define('work-item.update', function ($user, work_item $workItem) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $workItem->project->members->contains('user_id', $user->id);
        });

        Gate::define('work-item.delete', function ($user, work_item $workItem) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $workItem->project->members->contains('user_id', $user->id);
        });
    //work Item crud - end

    //Archiving
        Gate::define('project.archive', function ($user, projects $project) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $project->members->contains('user_id', $user->id);
        });

        Gate::define('work-item.archive', function ($user, work_item $workItem) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $workItem->project->members->contains('user_id', $user->id);
        });
    //Archiving - end

    //Comment
        Gate::define('comment.create', function ($user, work_item $workItem) {
            $privileged = $user->roles->contains(fn ($role) => in_array(strtolower($role->name), ['admin', 'manager']));
            return $privileged || $workItem->project->members->contains('user_id', $user->id);
        });


    }
}