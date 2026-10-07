<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title_en ?? __('common.maintenance') }}</title>
    <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif; margin:0; display:flex; min-height:100vh; align-items:center; justify-content:center; background:#0f172a; color:#e2e8f0; }
        .card { max-width: 720px; padding: 32px; border-radius: 16px; background: rgba(255,255,255,0.06); box-shadow: 0 10px 30px rgba(0,0,0,.35); backdrop-filter: blur(10px); }
        h1 { margin: 0 0 12px; font-size: 28px; }
        p { margin: 8px 0; line-height: 1.6; }
    </style>
    </head>
<body>
    <div class="card">
        <h1>{{ $title_en ?? __('common.site_under_maintenance') }}</h1>
        @if(!empty($body_en))
            <p>{{ $body_en }}</p>
        @else
            <p>{{ __('common.maintenance_default_message') }}</p>
        @endif
    </div>
</body>
</html>


