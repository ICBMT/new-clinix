<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exception Report - {{ config('app.name') }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .info-section {
            background: #f9fafb;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 8px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .info-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            color: #111827;
            font-weight: 500;
        }
        .exception-box {
            background: #1f2937;
            color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.8;
            overflow-x: auto;
            margin-bottom: 25px;
        }
        .trace-section {
            margin-top: 25px;
        }
        .trace-header {
            background: #4b5563;
            color: white;
            padding: 12px 20px;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            font-size: 14px;
        }
        .trace-content {
            background: #f9fafb;
            padding: 15px 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            max-height: 400px;
            overflow-y: auto;
        }
        .trace-item {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
        }
        .trace-item:last-child {
            border-bottom: none;
        }
        .footer {
            background: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-error {
            background: #fee2e2;
            color: #991b1b;
        }
        .icon {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="header">
                <h1>⚠️ Exception Detected</h1>
                <p>{{ config('app.name') }} - {{ config('app.env') }}</p>
            </div>

            <div class="content">
                <div class="info-section">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Application</span>
                            <span class="info-value">{{ config('app.name') }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Environment</span>
                            <span class="badge badge-error">{{ config('app.env') }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Exception Type</span>
                            <span class="info-value">{{ $exceptionClass ?? 'Unknown' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Occurred At</span>
                            <span class="info-value">{{ $occurredAt ?? now()->toDateTimeString() }}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 10px; color: #111827; font-size: 16px;">Exception Message:</h3>
                    <div class="exception-box">
                        {{ $exceptionMessage }}
                    </div>
                </div>

                @if(isset($request))
                <div style="margin-top: 20px;">
                    <h3 style="margin-bottom: 10px; color: #111827; font-size: 16px;">Request Information:</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 13px;">
                        <strong>URL:</strong> {{ $request['url'] ?? 'N/A' }}<br>
                        <strong>Method:</strong> {{ $request['method'] ?? 'N/A' }}<br>
                        <strong>Route Name:</strong> {{ $request['route_name'] ?? 'N/A' }}<br>
                        <strong>Route Action:</strong> {{ $request['route_action'] ?? 'N/A' }}<br>
                        <strong>IP:</strong> {{ $request['ip'] ?? 'N/A' }}<br>
                        @if(isset($request['user']))
                            <strong>User ID:</strong> {{ $request['user']['id'] ?? 'N/A' }}<br>
                            <strong>User Name:</strong> {{ $request['user']['name'] ?? 'N/A' }}
                        @endif
                    </div>
                </div>
                @endif

                <div style="margin-top: 20px;">
                    <h3 style="margin-bottom: 10px; color: #111827; font-size: 16px;">Exception Location:</h3>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 13px;">
                        <strong>File:</strong> {{ $file }}<br>
                        <strong>Line:</strong> {{ $line }}
                    </div>
                </div>

                <div class="trace-section">
                    <div class="trace-header">Stack Trace</div>
                    <div class="trace-content">
                        @if(isset($trace) && is_array($trace) && count($trace) > 0)
                            @foreach($trace as $item)
                                <div class="trace-item" style="font-family: monospace; font-size: 12px; line-height: 1.8;">
                                    {{ $item }}
                                </div>
                            @endforeach
                        @else
                            <div class="trace-item">No stack trace available</div>
                        @endif
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>This is an automated exception report from {{ config('app.name') }}</p>
                <p style="margin-top: 8px; font-size: 12px;">Generated at {{ now()->toDateTimeString() }}</p>
            </div>
        </div>
    </div>
</body>
</html>
