<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Handle the incoming request.
     *
     * Requests to JSON API endpoints (e.g. `/api/notifications/...`) should
     * never be treated as Inertia requests, even if a client happens to send
     * an `X-Inertia` header. Bypass Inertia handling for these paths so they
     * always behave as plain JSON endpoints and never trip the
     * "Inertia requests must receive a valid Inertia response" error.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (str_starts_with($request->path(), 'api/')) {
            return $next($request);
        }

        return parent::handle($request, $next);
    }

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->roles->pluck('name')
                    ->map(fn ($role) => strtolower($role))
                    ->toArray() ?? [],
            ],
        ]);
    }
}
