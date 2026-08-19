# Replace Edit Page with ProjectSetupSheet

## Goal
Make the Edit buttons in `show.tsx` and `index.tsx` open `ProjectSetupSheet` in edit mode instead of navigating to the old `edit.tsx` page.

## Current State
- `show.tsx` Edit button links to `/projects/${id}/edit` (old `edit.tsx`)
- `projects-table-view.tsx` and `projects-card-view.tsx` Edit buttons link to `/projects/${id}/edit`
- `setup.tsx` already uses `ProjectSetupSheet` in edit mode for `/projects/{id}/setup`
- `ProjectSetupSheet` supports `mode="edit"` and submits to `PUT /projects/{id}/setup`
- `ProjectsController::show` already passes a `setup` prop containing all data needed by `ProjectSetupSheet`

## Decision
Use `ProjectSetupSheet` as an overlay sheet in both `show.tsx` and `index.tsx`.

### Why overlay instead of navigating to `/projects/{id}/setup`
- Keeps user context (list position, scroll state) in index
- Consistent UX: same sheet component used everywhere
- `show.tsx` already has all needed data via the `setup` prop

## Changes

### 1. `show.tsx` — Open ProjectSetupSheet overlay
- Import `ProjectSetupSheet` and its exported types (`StatusOption`, `UserOption`, `WorkItemStatusOption`, `NestedMilestone`)
- Add `setup` to `ShowProjectPageProps` (controller already passes it)
- Add `editOpen` state (`boolean`)
- Change Edit button from `<Link>` to `<Button onClick={() => setEditOpen(true)}>`
- Render `<ProjectSetupSheet open={editOpen} onOpenChange={setEditOpen} mode="edit" ... />` with data from the `setup` prop
- The sheet's `onOpenChange` should just close (no navigation needed since we're already on the show page)

### 2. `projects-table-view.tsx` — Replace edit link with callback
- Add `onEdit?: (projectId: number) => void` to `ProjectsTableViewProps`
- Replace the `<Link href={`/projects/${project.id}/edit`}>` edit button with `<Button onClick={() => onEdit?.(project.id)}>`
- Keep view and delete buttons unchanged

### 3. `projects-card-view.tsx` — Replace edit link with callback
- Add `onEdit?: (projectId: number) => void` to `ProjectsCardViewProps`
- Replace the `<Link href={`/projects/${project.id}/edit`}>` edit button with `<Button onClick={() => onEdit?.(project.id)}>`
- Keep view and delete buttons unchanged

### 4. `index.tsx` — Manage edit sheet and fetch data on-demand
- Import `ProjectSetupSheet` and its types
- Add state: `editOpen` (`boolean`), `editingProject` (setup data object or `null`)
- Pass `onEdit={handleEditClick}` to both `ProjectsTableView` and `ProjectsCardView`
- `handleEditClick(projectId)`:
  1. Set `processing` or loading state
  2. Fetch setup data for the project (see backend change)
  3. Populate `editingProject` state
  4. Set `editOpen = true`
- Render `<ProjectSetupSheet open={editOpen} onOpenChange={handleEditClose} mode="edit" ... />` using `editingProject` data plus the page-level `statuses`, `allUsers`, `workItemStatuses`
- `handleIndexChange`: close sheet and optionally refresh

### 5. Backend — Add JSON endpoint for project setup data
Add to `ProjectSetupController`:
```php
public function apiShow(projects $project)
{
    $project->load(['members.user', 'statuses', 'milestones.work_item_groups.workItems']);

    // ... same data transformation as show() ...

    return response()->json([
        'project' => [...],
        'statuses' => [...],
        'allUsers' => [...],
        'workItemStatuses' => [...],
        'memberIds' => [...],
        'milestones' => [...],
    ]);
}
```

Register route in `web.php` (or `api.php`):
```php
Route::get('projects/{project}/setup-data', [ProjectSetupController::class, 'apiShow'])->name('projects.setup.api');
```

The frontend fetch:
```ts
const res = await fetch(`/projects/${projectId}/setup-data`, {
    headers: { 'X-Inertia': 'false' },
});
const data = await res.json();
```

### 6. `edit.tsx` — Deprecated
- The old edit page is no longer used
- Can be removed after the above changes are verified
- The route `GET /projects/{project}/edit` can also be removed from `ProjectsController` and `web.php`

## Data Flow

### show.tsx
```
User clicks Edit
  → setEditOpen(true)
  → ProjectSetupSheet opens with mode="edit"
  → Uses existing `setup` prop from page props
  → On submit: PUT /projects/{id}/setup
  → On close: setEditOpen(false)
```

### index.tsx
```
User clicks Edit on a project row/card
  → onEdit(projectId) called
  → Fetch GET /projects/{projectId}/setup-data
  → Populate editingProject state
  → setEditOpen(true)
  → ProjectSetupSheet opens with fetched data
  → On submit: PUT /projects/{id}/setup
  → On close: setEditOpen(false), optionally invalidate/refresh list
```

## Risks & Mitigations
- **Risk**: Fetching setup data for every edit click adds latency
  - **Mitigation**: Show a loading state on the edit button while fetching
- **Risk**: `ProjectSetupSheet` submit errors need to be visible in both contexts
  - **Mitigation**: The sheet already has internal error state (`errorMessage`, `processing`)
- **Risk**: The `setup` prop in `show.tsx` is not in the TypeScript interface
  - **Mitigation**: Add it to `ShowProjectPageProps`

## Validation
1. Open a project detail page → click Edit → `ProjectSetupSheet` opens with pre-filled data
2. Modify and save → project updates, sheet closes
3. Cancel → sheet closes without changes
4. From project list (table view) → click Edit → loading → sheet opens with data
5. From project list (card view) → click Edit → loading → sheet opens with data
6. Verify `edit.tsx` route is no longer reachable or redirects
