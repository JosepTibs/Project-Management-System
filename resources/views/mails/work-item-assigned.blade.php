@extends('mails.layout', ['headerSubtitle' => 'Task assigned to you'])

@section('content')
<p>Hi {{ $recipientName }},</p>
<p><strong>{{ $actorName }}</strong> assigned you to <strong>{{ $title }}</strong> in project <strong>{{ $projectName }}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e4e4e7;border-radius:6px;">
    <tr>
        <td style="padding:12px 16px;font-size:13px;">
            <div><strong>Status:</strong> {{ $statusName }}</div>
            <div><strong>Priority:</strong> {{ $priority }}</div>
            <div><strong>Due date:</strong> {{ $dueDate }}</div>
        </td>
    </tr>
    @if(!empty($description))
    <tr>
        <td style="padding:12px 16px;border-top:1px solid #e4e4e7;font-size:13px;color:#52525b;">{{ \Illuminate\Support\Str::limit($description, 300) }}</td>
    </tr>
    @endif
</table>
<p><a href="{{ $itemUrl }}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">Open work item</a></p>
@endsection
