<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>MyJiji - Uganda's #1 Online Marketplace</title>

        <!-- Google Fonts: Inter & Outfit -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet">

        <!-- Phosphor Icons (Advanced UI Icons) -->
        <script src="https://unpkg.com/@phosphor-icons/web"></script>

        <!-- Tailwind/Vite -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])

        <style>
            body { 
                font-family: 'Inter', sans-serif;
                background-color: #F8F9FA;
            }
            .heading-font { font-family: 'Outfit', sans-serif; }
            .jiji-orange { color: #FF6B00; }
            .jiji-bg-orange { background-color: #FF6B00; }
            .jiji-bg-orange:hover { background-color: #E65A00; }
            .card-hover:hover {
                transform: translateY(-4px);
                transition: all 0.2s ease-in-out;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .category-icon {
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                margin-bottom: 12px;
                transition: all 0.3s;
            }
        </style>
    </head>
    <body class="antialiased">
        <!-- Navbar -->
        <nav class="bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div class="flex items-center gap-2">
                <div class="jiji-bg-orange p-2 rounded-lg">
                    <i class="ph-bold ph-storefront text-white text-xl"></i>
                </div>
                <span class="text-2xl font-bold heading-font tracking-tight">My<span class="jiji-orange">Jiji</span></span>
            </div>

            <div class="hidden md:flex flex-1 max-w-xl mx-8">
                <div class="relative w-full">
                    <input type="text" placeholder="I'm looking for..." class="w-full bg-gray-50 border-none rounded-full py-2.5 px-6 focus:ring-2 focus:ring-[#FF6B00] transition-all text-sm">
                    <button class="absolute right-2 top-1.5 jiji-bg-orange text-white p-1.5 rounded-full">
                        <i class="ph-bold ph-magnifying-glass"></i>
                    </button>
                </div>
            </div>

            <div class="flex items-center gap-6 text-sm font-semibold">
                @if (Route::has('login'))
                    @auth
                        <a href="{{ url('/dashboard') }}" class="text-gray-700 hover:text-[#FF6B00]">My Account</a>
                    @else
                        <a href="{{ route('login') }}" class="text-gray-700 hover:text-[#FF6B00]">Sign In</a>
                        <a href="{{ route('register') }}" class="hidden sm:block text-gray-700 hover:text-[#FF6B00]">Register</a>
                    @endauth
                @endif
                <a href="{{ route('login') }}" class="jiji-bg-orange text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all">
                    <i class="ph-bold ph-plus-circle"></i> SELL
                </a>
            </div>
        </nav>

        <!-- Hero Section -->
        <header class="bg-white pt-10 pb-8 px-6 md:px-12">
            <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12">
                <div>
                    <h1 class="text-4xl md:text-6xl font-bold heading-font leading-tight mb-6">
                        The simplest way to <span class="jiji-orange">buy and sell</span> in Uganda.
                    </h1>
                    <p class="text-gray-600 text-lg mb-8 max-w-md">
                        Join thousands of Ugandans buying and selling cars, phones, property and more on MyJiji.
                    </p>
                    <div class="flex flex-wrap gap-4 text-xs">
                        <span class="bg-gray-100 px-3 py-1.5 rounded-full text-gray-500 flex items-center gap-1">
                            <i class="ph-bold ph-shield-check text-[#FF6B00]"></i> Verified Sellers
                        </span>
                        <span class="bg-gray-100 px-3 py-1.5 rounded-full text-gray-500 flex items-center gap-1">
                            <i class="ph-bold ph-whatsapp-logo text-green-500"></i> WhatsApp Contact
                        </span>
                        <span class="bg-gray-100 px-3 py-1.5 rounded-full text-gray-500 flex items-center gap-1">
                            <i class="ph-bold ph-map-pin text-red-500"></i> Kampala, Entebbe, Jinja
                        </span>
                    </div>
                </div>
                <div class="hidden md:block relative">
                    <div class="w-full h-[400px] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl">
                         <div class="w-full h-full bg-gradient-to-br from-[#FF6B00] to-[#E65A00] opacity-10 flex items-center justify-center">
                            <i class="ph-thin ph-shopping-bag text-[200px] text-[#FF6B00] opacity-20"></i>
                         </div>
                    </div>
                    <!-- Floating badges -->
                    <div class="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-lg flex items-center gap-4 border border-gray-50 animate-bounce">
                        <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <i class="ph-bold ph-trend-up"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase font-bold tracking-widest">Growth</p>
                            <p class="text-sm font-bold">12,400+ Ads Today</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Categories Section -->
        <section class="max-w-7xl mx-auto px-6 md:px-12 py-16">
            <h2 class="text-2xl font-bold heading-font mb-10 flex items-center gap-3">
                 Everything You Need 
                <span class="h-px bg-gray-200 flex-1"></span>
            </h2>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6">
                @php
                    $categories = [
                        ['name' => 'Vehicles', 'icon' => 'ph-car', 'color' => 'bg-blue-50 text-blue-600'],
                        ['name' => 'Phones', 'icon' => 'ph-device-mobile', 'color' => 'bg-emerald-50 text-emerald-600'],
                        ['name' => 'Electronics', 'icon' => 'ph-television', 'color' => 'bg-purple-50 text-purple-600'],
                        ['name' => 'Property', 'icon' => 'ph-house-line', 'color' => 'bg-orange-50 text-orange-600'],
                        ['name' => 'Home', 'icon' => 'ph-armchair', 'color' => 'bg-rose-50 text-rose-600'],
                        ['name' => 'Fashion', 'icon' => 'ph-t-shirt', 'color' => 'bg-pink-50 text-pink-600'],
                        ['name' => 'Jobs', 'icon' => 'ph-briefcase', 'color' => 'bg-amber-50 text-amber-600'],
                        ['name' => 'Services', 'icon' => 'ph-wrench', 'color' => 'bg-cyan-50 text-cyan-600'],
                    ];
                @endphp

                @foreach ($categories as $cat)
                    <a href="#" class="flex flex-col items-center group">
                        <div class="category-icon {{ $cat['color'] }} group-hover:scale-110">
                            <i class="ph-bold {{ $cat['icon'] }} text-2xl"></i>
                        </div>
                        <span class="text-sm font-semibold text-gray-700 group-hover:text-[#FF6B00]">{{ $cat['name'] }}</span>
                    </a>
                @endforeach
            </div>
        </section>

        <!-- Trending Section -->
        <section class="max-w-7xl mx-auto px-6 md:px-12 py-8">
            <div class="flex justify-between items-end mb-8">
                <div>
                    <h2 class="text-2xl font-bold heading-font">Trending Near You</h2>
                    <p class="text-gray-500 text-sm">Most viewed items in Uganda right now.</p>
                </div>
                <a href="#" class="text-[#FF6B00] font-semibold text-sm flex items-center gap-1 hover:underline">
                    View All <i class="ph-bold ph-caret-right"></i>
                </a>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                @for ($i = 1; $i <= 5; $i++)
                    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover group">
                        <div class="aspect-square bg-gray-100 relative">
                            <div class="absolute inset-0 flex items-center justify-center opacity-20">
                                <i class="ph-thin ph-image text-4xl"></i>
                            </div>
                            <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-900 border border-gray-100">
                                NEW
                            </div>
                            <button class="absolute top-3 right-3 text-white drop-shadow-md hover:text-[#FF6B00] transition-colors">
                                <i class="ph-bold ph-heart"></i>
                            </button>
                        </div>
                        <div class="p-4">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="text-sm font-semibold text-gray-800 line-clamp-1">Sample Item {{ $i }}</h3>
                            </div>
                            <p class="text-[#FF6B00] font-bold text-lg mb-2">UGX 12,500</p>
                            <div class="flex items-center justify-between mt-4 text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
                                <span class="flex items-center gap-1"><i class="ph-bold ph-map-pin"></i> KAMPALA</span>
                                <span class="flex items-center gap-1"><i class="ph-bold ph-clock"></i> 2H AGO</span>
                            </div>
                        </div>
                    </div>
                @endfor
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-white border-t border-gray-100 mt-20 py-12 px-6 md:px-12">
            <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div class="flex items-center gap-2">
                    <div class="jiji-bg-orange p-1.5 rounded-lg">
                        <i class="ph-bold ph-storefront text-white text-sm"></i>
                    </div>
                    <span class="text-xl font-bold heading-font tracking-tight">My<span class="jiji-orange">Jiji</span></span>
                </div>
                <p class="text-gray-400 text-sm">
                    &copy; 2026 MyJiji Uganda. Built for low bandwidth environments.
                </p>
                <div class="flex gap-6">
                    <a href="#" class="text-gray-400 hover:text-[#FF6B00]"><i class="ph-bold ph-facebook-logo text-xl"></i></a>
                    <a href="#" class="text-gray-400 hover:text-[#FF6B00]"><i class="ph-bold ph-instagram-logo text-xl"></i></a>
                    <a href="#" class="text-gray-400 hover:text-[#FF6B00]"><i class="ph-bold ph-twitter-logo text-xl"></i></a>
                </div>
            </div>
        </footer>
    </body>
</html>
