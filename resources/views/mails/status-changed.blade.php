@extends('mails.layout', ['headerSubtitle' => 'Work item status update'])

@section('content')
<p>Hi {{ $recipientName }},</p>
<p><strong>{{ $actorName }}</strong> changed the status of <strong>{{ $title }}</strong> ({{ $projectName }}) from <strong>{{ $oldStatus }}</strong> to <strong>{{ $newStatus }}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e4e4e7;border-radius:6px;">
    <tr>
        <td style="padding:12px 16px;font-size:13px;">
            <div><strong>Previous:</strong> {{ $oldStatus }}</div>
            <div><strong>Current:</strong> {{ $newStatus }}</div>
            <div><strong>Due date:</strong> {{ $dueDate }}</div>
        </td>
    </tr>
</table>
<p><a href="{{ $itemUrl }}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">View work item</a></p>
@endsection
