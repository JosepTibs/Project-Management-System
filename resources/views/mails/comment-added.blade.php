@extends('mails.layout', ['headerSubtitle' => 'New comment on your work item'])

@section('content')
<p>Hi {{ $recipientName }},</p>
<p><strong>{{ $commenterName }}</strong> commented on <strong>{{ $title }}</strong> ({{ $projectName }}):</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e4e4e7;border-radius:6px;background-color:#fafafa;">
    <tr>
        <td style="padding:12px 16px;font-size:13px;font-style:italic;color:#3f3f46;">&ldquo;{{ $commentPreview }}&rdquo;</td>
    </tr>
</table>
<p><a href="{{ $itemUrl }}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">View conversation</a></p>
@endsection
