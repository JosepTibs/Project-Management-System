<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? config('app.name') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#27272a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr>
        <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
                <tr>
                    <td style="background-color:#18181b;color:#ffffff;padding:20px 28px;">
                        <div style="font-size:18px;font-weight:bold;">{{ config('monitoring.from.name') }}</div>
                        <div style="font-size:12px;color:#d4d4d8;margin-top:4px;">{{ $headerSubtitle ?? 'Project notification' }}</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding:28px;font-size:14px;line-height:1.6;">
                        @yield('content')
                    </td>
                </tr>
                <tr>
                    <td style="padding:16px 28px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;">
                        <p style="margin:0 0 8px;">{{ config('monitoring.no_reply_notice') }} This is an automated message — please do not reply.</p>
                        <p style="margin:0;">Sent by {{ config('monitoring.from.name') }} &lt;{{ config('monitoring.from.address') }}&gt;</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
