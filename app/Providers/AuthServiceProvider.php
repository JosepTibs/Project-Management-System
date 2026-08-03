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
        Gate::before(function($user){
            if($user->roles->contains('name','admin')){
                return true;
            }
        });
    //project crud

        Gate::define('view',function($user, projects $project){
            return $user->roles->contains('name',['admin','manager'])
            || $project->members->contains('user_id', $user->id);
    });

        Gate::define('update', function($user, projects $project){
            return $user->roles->contains('name',['admin', 'manager'])
            || $project->members->contains('user_id', $user->id);
    });

        Gate::define('delete', function($user, projects $project){
            return $user->roles->contains('name',['admin', 'manager'])
            || $project->members->contains('user_id', $user->id);
        });
    //project crud - end

    //work item crud
        Gate::define('work-item.create', function($user, projects $project){
            return $user->roles->contains('name', ['admin', 'manager'])
            || $project->members->contains('user_id', $user->id);
        });

        Gate::define('work-item.update', function ($user, work_item $workItem){
            return $user->roles->contains('name', ['admin', 'manager'])
            || $workItem->project->members->contains('user_id', $user->id);
        });

        Gate::define('work-item.delete', function($user, work_item $workItem){
            return $user->roles->contains('name', ['admin','manager'])
            ||  $workItem->project->members->contains('user_id', $user->id);
        });
    //work Item crud - end

    //Comment
        Gate::define('comment.create', function($user, work_item $workItem){
            return $user->roles->contains('name', ['admin', 'manager'])
            || $workItem->project->members->contains('user_id', $user->id);
        });


    }
}