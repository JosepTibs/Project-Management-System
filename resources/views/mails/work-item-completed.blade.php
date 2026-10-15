@extends('mails.layout', ['headerSubtitle' => 'Work item completed'])

@section('content')
<p>Hi {{ $recipientName }},</p>
<p>{{ $headline }} in project <strong>{{ $projectName }}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e4e4e7;border-radius:6px;">
    <tr>
        <td style="padding:12px 16px;font-size:13px;">
            <div><strong>Task:</strong> {{ $title }}</div>
            <div><strong>Completed by:</strong> {{ $actorName }}</div>
            <div><strong>Assignee:</strong> {{ $assigneeName }}</div>
            <div><strong>Completed at:</strong> {{ $completedAt }}</div>
        </td>
    </tr>
</table>
<p><a href="{{ $itemUrl }}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">View work item</a></p>
@endsection
