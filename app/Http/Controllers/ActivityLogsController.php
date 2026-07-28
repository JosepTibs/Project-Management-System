<?php

namespace App\Http\Controllers;

use App\Models\activity_logs;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ActivityLogsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = activity_logs::with('user:id,username,fname,mname,lname,sname');

        // Filter by user (by username)
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', $request->user_id);
            });
        }

        // Filter by event type
        if ($request->filled('event') && $request->event !== 'all') {
            $query->where('event', $request->event);
        }

        // Filter by subject type (model type)
        if ($request->filled('subject_type') && $request->subject_type !== 'all') {
            $query->where('subject_type', $request->subject_type);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search in description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('subject_type', 'like', "%{$search}%");
            });
        }

        $activities = $query->orderByDesc('created_at')->paginate(20);

        // Get filter options
        $users = User::orderBy('username')->get(['id', 'username', 'fname', 'lname']);
        $eventTypes = activity_logs::select('event')->distinct()->pluck('event');
        $subjectTypes = activity_logs::select('subject_type')->distinct()->pluck('subject_type');

        return Inertia::render('activity-logs', [
            'activities' => $activities,
            'users' => $users,
            'eventTypes' => $eventTypes,
            'subjectTypes' => $subjectTypes,
            'filters' => $request->only(['user_id', 'event', 'subject_type', 'date_from', 'date_to', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(activity_logs $activity_logs)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(activity_logs $activity_logs)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, activity_logs $activity_logs)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(activity_logs $activity_logs)
    {
        //
    }
}
