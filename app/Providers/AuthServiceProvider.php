<?php

namespace App\Providers;

use App\Models\projects;
use App\Models\User;
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
            return $user->roles->contains(fn ($role) => strtolower($role->name) === 'superadmin') ? true : null;
        });
    //project crud

        Gate::define('view', function ($user, projects $project) {
            // Admins see everything.
            if ($user->isAdminLevel()) return true;

            // Managers may view projects they own, are a member of, or have
            // an assigned/collaborated work item in — nothing else.
            if ($user->isManagerRole()) {
                if ($project->isOwnedBy($user)) return true;
                if ($project->archived_at) return false;

                return $project->members->contains('user_id', $user->id)
                    || $project->workItems()
                        ->where(fn ($w) => $w->where('assignee_id', $user->id)
                            ->orWhereHas('collaborators', fn ($c) => $c->where('user_id', $user->id)))
                        ->exists();
            }

            // Archived projects are admin/manager-only; members never see them.
            if ($project->archived_at) return false;

            return $project->members->contains('user_id', $user->id);
        });

        Gate::define('update', function ($user, projects $project) {
            // Admins may modify any project structure (setup, gantt
            // moves/resizes, dependencies). Managers only the projects they
            // own. Members are view-only.
            return $user->canManageProject($project);
        });

        Gate::define('delete', function ($user, projects $project) {
            return $user->canManageProject($project);
        });
    //project crud - end

    //work item crud
        Gate::define('work-item.create', function ($user, projects $project) {
            // Admins anywhere; managers within projects they own; everyone
            // else only inside projects they are a member of.
            if ($user->isAdminLevel()) return true;
            if ($user->isManagerRole()) {
                return $project->isOwnedBy($user) || $project->members->contains('user_id', $user->id);
            }

            return $project->members->contains('user_id', $user->id);
        });

        Gate::define('work-item.update', function ($user, work_item $workItem) {
            // Full edits (every field incl. schedule/assignment): admins
            // anywhere, managers only inside projects they own. Assignees and
            // collaborators are limited to progress + status updates on their
            // own items (selfUpdate below).
            if ($user->isAdminLevel()) return true;
            if ($user->isManagerRole()) return $workItem->project->isOwnedBy($user);

            return false;
        });

        // Progress + status updates on a work item: admins always; managers
        // within owned projects; everyone else only on items assigned to them
        // or shared with them as collaborators.
        Gate::define('work-item.selfUpdate', function ($user, work_item $workItem) {
            if ($user->isAdminLevel()) return true;
            if ($user->isManagerRole() && $workItem->project->isOwnedBy($user)) return true;

            return (int) $workItem->assignee_id === (int) $user->id
                || $workItem->collaborators()->whereKey($user->id)->exists();
        });

        Gate::define('work-item.updateProgress', function ($user, work_item $workItem) {
            return $user->can('work-item.selfUpdate', $workItem);
        });

        Gate::define('work-item.delete', function ($user, work_item $workItem) {
            if ($user->isAdminLevel()) return true;
            if ($user->isManagerRole()) return $workItem->project->isOwnedBy($user);

            // Members may only delete items assigned to them.
            return (int) $workItem->assignee_id === (int) $user->id;
        });
    //work Item crud - end

    //Archiving
        Gate::define('project.archive', function ($user, projects $project) {
            return $user->canManageProject($project);
        });

        Gate::define('work-item.archive', function ($user, work_item $workItem) {
            if ($user->isAdminLevel()) return true;
            if ($user->isManagerRole()) return $workItem->project->isOwnedBy($user);

            // Members may archive only items assigned to them.
            return (int) $workItem->assignee_id === (int) $user->id;
        });
    //Archiving - end

    //Comment
        Gate::define('comment.create', function ($user, work_item $workItem) {
            if ($user->isAdminLevel()) return true;
            if ($user->isManagerRole()) {
                return $workItem->project->isOwnedBy($user)
                    || $workItem->project->members->contains('user_id', $user->id);
            }

            return $workItem->project->members->contains('user_id', $user->id);
        });

    //User deletion (Superadmin permission only)
        Gate::define('delete-user', function ($user, User $target) {
            return $user->hasPermission('delete users');
        });


    }
}