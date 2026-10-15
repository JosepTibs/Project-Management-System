@extends('mails.layout', ['headerSubtitle' => $reminderLabel])

@section('content')
<p>Hi {{ $recipientName }},</p>
<p><strong>{{ $headline }}</strong></p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e4e4e7;border-radius:6px;@if($isOverdue) border-left:4px solid #dc2626;@elseif($isDueToday) border-left:4px solid #f59e0b;@endif">
    <tr>
        <td style="padding:12px 16px;font-size:13px;">
            <div><strong>Task:</strong> {{ $title }}</div>
            <div><strong>Project:</strong> {{ $projectName }}</div>
            @if($recipientRole !== 'member')
            <div><strong>Assignee:</strong> {{ $assigneeName }}</div>
            @endif
            <div><strong>Due date:</strong> {{ $dueDate }}</div>
            <div><strong>Status:</strong> {{ $reminderLabel }}</div>
        </td>
    </tr>
</table>
<p><a href="{{ $itemUrl }}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">Open work item</a></p>
@endsection
