<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="{{ $title }}">
    <meta name="description" content="{{ $description }}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ $url }}">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:image" content="{{ $image }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ $url }}">
    <meta property="twitter:title" content="{{ $title }}">
    <meta property="twitter:description" content="{{ $description }}">
    <meta property="twitter:image" content="{{ $image }}">

    <!-- Redirects -->
    <meta http-equiv="refresh" content="0; url={{ $url }}">
    <script>
        window.location.replace("{{ $url }}");
    </script>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f9fafb;
            color: #4b5563;
        }
        .container {
            text-align: center;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #F28500;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <p>Redirecting to listing...</p>
        <p><a href="{{ $url }}" style="color: #F28500; text-decoration: none;">Click here if not redirected automatically.</a></p>
    </div>
</body>
</html>
