<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\PasswordResetRequested;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset request.
     *
     * Instead of emailing a self-service reset link, the request is relayed
     * to every admin-level user (superadmin/admin) as an in-app
     * notification. The admins then reset the password on the user's
     * behalf via the user management page. This suits the single-company
     * deployment and avoids depending on email deliverability.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->input('email'))->first();

        // Only notify when the account actually exists. Never notify for
        // unknown emails so the notification feed is not spammed, and keep
        // the response generic so accounts cannot be enumerated.
        if ($user !== null) {
            $admins = User::with('roles')->get()->filter(
                fn (User $admin) => $admin->isAdminLevel() && $admin->id !== $user->id
            );

            foreach ($admins as $admin) {
                $admin->notify(new PasswordResetRequested($user));
            }
        }

        return back()->with('status', __('Your request has been sent to an administrator who will assist you with resetting your password.'));
    }
}
