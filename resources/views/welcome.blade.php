{{--<!DOCTYPE html>--}}
{{--<html lang="en">--}}
{{--<head>--}}
{{--    <meta charset="UTF-8">--}}
{{--    <meta name="viewport" content="width=device-width, initial-scale=1.0">--}}
{{--    <title>TAJMAP</title>--}}
{{--    @vite('resources/js/app.jsx')--}}
{{--    @vite(['resources/css/app.css', 'resources/js/app.jsx'])--}}
{{--</head>--}}
{{--<body>--}}
{{--<div id="app"></div>--}}
{{--</body>--}}
{{--</html>--}}



    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TAJMAP</title>
    @php
        $faviconUrl = \App\Models\Setting::where('key', 'site_favicon_url')->value('value');
    @endphp
    @if($faviconUrl)
        <link rel="icon" type="image/x-icon" href="{{ $faviconUrl }}">
        <link rel="shortcut icon" type="image/x-icon" href="{{ $faviconUrl }}">
    @endif
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
<div id="app"></div>

<script src="{{ asset('js/app.js') }}"></script>
</body>
</html>


