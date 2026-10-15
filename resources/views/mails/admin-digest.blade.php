@extends('mails.layout', ['headerSubtitle' => 'Daily digest · ' . $today])

@section('content')
<p>Hi {{ $recipientName ?: 'Admin' }},</p>
<p>Here is your daily summary for <strong>{{ $today }}</strong>:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;font-size:13px;">
    <tr>
        <td style="padding:10px 14px;border:1px solid #e4e4e7;border-radius:6px;background-color:{{ $dueTodayCount > 0 ? '#fef3c7' : '#f4f4f5' }};"><strong>{{ $dueTodayCount }}</strong> due today</td>
        <td style="width:8px;"></td>
        <td style="padding:10px 14px;border:1px solid #e4e4e7;border-radius:6px;background-color:{{ $overdueCount > 0 ? '#fee2e2' : '#f4f4f5' }};"><strong>{{ $overdueCount }}</strong> overdue</td>
    </tr>
    <tr><td colspan="3" style="height:8px;"></td></tr>
    <tr>
        <td style="padding:10px 14px;border:1px solid #e4e4e7;border-radius:6px;background-color:#f4f4f5;"><strong>{{ $upcomingCount }}</strong> due this week</td>
        <td style="width:8px;"></td>
        <td style="padding:10px 14px;border:1px solid #e4e4e7;border-radius:6px;background-color:#dcfce7;"><strong>{{ $newlyCompletedCount }}</strong> completed yesterday</td>
    </tr>
</table>
@if($hasAttentionItems)
<p style="color:#b45309;"><strong>Action needed:</strong> {{ $overdueCount + $dueTodayCount }} item(s) are overdue or due today.</p>
@endif
@if(!empty($overdueItems))
<p><strong>Overdue highlights</strong></p>
<ul style="font-size:13px;color:#3f3f46;">
    @foreach(array_slice($overdueItems, 0, 5) as $item)
    <li>{{ $item['title'] ?? 'Untitled' }}@if(!empty($item['due_date'])) — due {{ $item['due_date'] }}@endif</li>
    @endforeach
</ul>
@endif
@if(!empty($upcomingItems))
<p><strong>Upcoming highlights</strong></p>
<ul style="font-size:13px;color:#3f3f46;">
    @foreach(array_slice($upcomingItems, 0, 5) as $item)
    <li>{{ $item['title'] ?? 'Untitled' }}@if(!empty($item['due_date'])) — due {{ $item['due_date'] }}@endif</li>
    @endforeach
</ul>
@endif
<p><a href="{{ $digestUrl }}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">Open admin digest</a></p>
@endsection
