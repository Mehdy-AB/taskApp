import Image from "next/image";

export default function Home() {
  return (
   
<body className="bg-[#F8F9FF] text-slate-800 font-sans antialiased selection:bg-primary selection:text-white dark:bg-[#0F172A] dark:text-[#F1F5F9]">

    <!-- Mobile Menu Toggle State -->
    <input type="checkbox" id="mobile-menu-toggle" className="hidden">
    
    <!-- Sidebar Overlay -->
    <div className="sidebar-overlay fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 lg:hidden" onclick="document.getElementById('mobile-menu-toggle').checked = false"></div>

    <!-- Layout Container -->
    <div className="flex min-h-screen relative overflow-hidden">

        <!-- Sidebar -->
        <aside className="sidebar fixed lg:sticky top-0 left-0 z-50 h-screen w-[280px] -translate-x-full lg:translate-x-0 transition-transform duration-300 glass flex flex-col border-r border-slate-200 dark:border-slate-800">
            <!-- Logo Area -->
            <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-primary-gradient flex items-center justify-center text-white shadow-glow">
                        <iconify-icon icon="solar:buildings-2-linear" width="18"></iconify-icon>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Kost<span className="text-primary font-extrabold">Management</span></span>
                </div>
            </div>

            <!-- Navigation -->
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Menu</div>
                
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium transition-all group">
                    <iconify-icon icon="solar:widget-add-linear" width="20" stroke-width="1.5"></iconify-icon>
                    Dashboard
                </a>
                
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all group">
                    <iconify-icon icon="solar:bed-linear" width="20" stroke-width="1.5" class="group-hover:text-primary transition-colors"></iconify-icon>
                    Kamar
                    <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">30</span>
                </a>
                
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all group">
                    <iconify-icon icon="solar:users-group-rounded-linear" width="20" stroke-width="1.5" class="group-hover:text-primary transition-colors"></iconify-icon>
                    Penghuni
                </a>
                
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all group">
                    <iconify-icon icon="solar:wallet-money-linear" width="20" stroke-width="1.5" class="group-hover:text-primary transition-colors"></iconify-icon>
                    Keuangan
                </a>

                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all group">
                    <iconify-icon icon="solar:clipboard-check-linear" width="20" stroke-width="1.5" class="group-hover:text-primary transition-colors"></iconify-icon>
                    Laporan
                </a>

                <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">System</div>

                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 transition-all group">
                    <iconify-icon icon="solar:settings-linear" width="20" stroke-width="1.5" class="group-hover:text-primary transition-colors"></iconify-icon>
                    Pengaturan
                </a>
            </nav>

            <!-- Quick Stats in Sidebar -->
            <div className="p-6">
                <div className="bg-gradient-to-br from-[#364dff] to-[#667aff] rounded-2xl p-4 text-white shadow-glow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                        <iconify-icon icon="solar:pie-chart-2-bold" width="80"></iconify-icon>
                    </div>
                    <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">Occupancy Rate</p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold tracking-tight">80%</span>
                        <span className="text-xs mb-1 bg-white/20 px-1.5 py-0.5 rounded text-white">+2%</span>
                    </div>
                    <div className="w-full bg-black/20 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-white h-full rounded-full w-[80%]"></div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main className="flex-1 w-full min-w-0 flex flex-col">
            
            <!-- Top Header -->
            <header className="h-20 glass sticky top-0 z-30 px-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 transition-all">
                <div className="flex items-center gap-4">
                    <!-- Mobile Menu Trigger -->
                    <label htmlFor="mobile-menu-toggle" class="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <iconify-icon icon="solar:hamburger-menu-linear" width="24"></iconify-icon>
                    </label>

                    <div className="hidden sm:block">
                        <h1 className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight">Dashboard</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Home</span>
                            <iconify-icon icon="solar:alt-arrow-right-linear" width="12"></iconify-icon>
                            <span className="text-primary font-medium">Overview</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    <!-- Global Search -->
                    <div className="hidden md:flex relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <iconify-icon icon="solar:magnifer-linear" class="text-slate-400 group-focus-within:text-primary transition-colors"></iconify-icon>
                        </div>
                        <input type="text" placeholder="Cari penghuni, kamar..." className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-slate-600 dark:text-slate-200 placeholder:text-slate-400">
                        <div className="absolute inset-y-0 right-2 flex items-center">
                             <kbd className="hidden xl:inline-block border border-gray-200 rounded px-1 text-[10px] font-medium text-gray-400">⌘K</kbd>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors">
                            <iconify-icon icon="solar:bell-bing-linear" width="20"></iconify-icon>
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                        </button>
                        
                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                        
                        <div className="flex items-center gap-3 pl-1 cursor-pointer">
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Admin" className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover">
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-semibold text-slate-700 dark:text-white leading-none">Andi Saputra</p>
                                <p className="text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-wide">Owner</p>
                            </div>
                            <iconify-icon icon="solar:alt-arrow-down-linear" class="text-slate-400 text-xs hidden sm:block"></iconify-icon>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Dashboard Content -->
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
                
                <!-- Quick Actions & Greeting -->
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Selamat Pagi, Pak Andi 👋</h2>
                        <p className="text-slate-500 text-sm mt-1">Berikut ringkasan aktivitas properti Anda hari ini.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                            <iconify-icon icon="solar:download-linear"></iconify-icon>
                            <span>Laporan</span>
                        </button>
                        <button className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/30 transition-all hover:translate-y-[-1px] flex items-center gap-2">
                            <iconify-icon icon="solar:add-circle-bold"></iconify-icon>
                            <span>Tambah Penghuni</span>
                        </button>
                    </div>
                </div>

                <!-- Metrics Grid -->
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <!-- Card 1 -->
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card hover:shadow-lg transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-[#F8F9FF] dark:bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                                <iconify-icon icon="solar:wallet-2-linear" width="24"></iconify-icon>
                            </div>
                            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                <iconify-icon icon="solar:arrow-right-up-linear" class="mr-1"></iconify-icon>
                                +12.5%
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Pendapatan Bulan Ini</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 font-sans">Rp 45.000.000</h3>
                    </div>

                    <!-- Card 2 -->
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card hover:shadow-lg transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                                <iconify-icon icon="solar:bed-linear" width="24"></iconify-icon>
                            </div>
                            <span className="text-slate-400 text-xs">Total: 30 Unit</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Kamar Terisi</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">24<span className="text-lg text-slate-400 font-normal">/30</span></h3>
                            <span className="text-xs text-emerald-500 font-medium">80% Occ.</span>
                        </div>
                    </div>

                    <!-- Card 3 -->
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card hover:shadow-lg transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                                <iconify-icon icon="solar:bill-list-linear" width="24"></iconify-icon>
                            </div>
                            <span className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                                3 Late
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Belum Bayar</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">3 <span className="text-sm font-normal text-slate-400">Penghuni</span></h3>
                    </div>

                    <!-- Card 4 -->
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card hover:shadow-lg transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                <iconify-icon icon="solar:star-linear" width="24"></iconify-icon>
                            </div>
                            <div className="flex text-yellow-400 text-xs">
                                <iconify-icon icon="solar:star-bold"></iconify-icon>
                                <iconify-icon icon="solar:star-bold"></iconify-icon>
                                <iconify-icon icon="solar:star-bold"></iconify-icon>
                                <iconify-icon icon="solar:star-bold"></iconify-icon>
                                <iconify-icon icon="solar:star-half-bold"></iconify-icon>
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Kepuasan Penghuni</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">4.5<span className="text-lg text-slate-400 font-normal">/5</span></h3>
                    </div>
                </div>

                <!-- Main Grid: Charts & Tables -->
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                    
                    <!-- Left Column: Revenue Chart & Room Status -->
                    <div className="xl:col-span-2 space-y-6">
                        
                        <!-- Revenue Chart Section -->
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Analisis Pendapatan</h3>
                                    <p className="text-xs text-slate-400">Januari - Juni 2024</p>
                                </div>
                                <select className="text-xs border border-slate-200 bg-slate-50 text-slate-600 rounded-lg px-2 py-1 outline-none">
                                    <option>6 Bulan Terakhir</option>
                                    <option>Tahun Ini</option>
                                </select>
                            </div>
                            
                            <!-- Custom CSS Bar Chart -->
                            <div className="relative h-64 w-full flex items-end justify-between gap-2 sm:gap-4 pt-4 border-b border-dashed border-slate-200 dark:border-slate-700">
                                <!-- Y Axis Labels -->
                                <div className="absolute -left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 font-medium">
                                    <span>50jt</span>
                                    <span>25jt</span>
                                    <span>0</span>
                                </div>

                                <!-- Bars -->
                                <div className="ml-6 w-full h-full flex items-end justify-around">
                                    <div className="group relative flex flex-col items-center gap-2 w-full">
                                        <div className="w-full max-w-[40px] bg-primary/20 rounded-t-sm h-[40%] group-hover:bg-primary/40 transition-all bar-animate relative">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">20jt</div>
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-400">Jan</span>
                                    </div>
                                    <div className="group relative flex flex-col items-center gap-2 w-full">
                                        <div className="w-full max-w-[40px] bg-primary/30 rounded-t-sm h-[55%] group-hover:bg-primary/50 transition-all bar-animate relative"></div>
                                        <span className="text-[10px] font-medium text-slate-400">Feb</span>
                                    </div>
                                    <div className="group relative flex flex-col items-center gap-2 w-full">
                                        <div className="w-full max-w-[40px] bg-primary/40 rounded-t-sm h-[45%] group-hover:bg-primary/60 transition-all bar-animate relative"></div>
                                        <span className="text-[10px] font-medium text-slate-400">Mar</span>
                                    </div>
                                    <div className="group relative flex flex-col items-center gap-2 w-full">
                                        <div className="w-full max-w-[40px] bg-primary/60 rounded-t-sm h-[70%] group-hover:bg-primary/80 transition-all bar-animate relative"></div>
                                        <span className="text-[10px] font-medium text-slate-400">Apr</span>
                                    </div>
                                    <div className="group relative flex flex-col items-center gap-2 w-full">
                                        <div className="w-full max-w-[40px] bg-primary/80 rounded-t-sm h-[85%] group-hover:bg-primary transition-all bar-animate relative"></div>
                                        <span className="text-[10px] font-medium text-slate-400">May</span>
                                    </div>
                                    <div className="group relative flex flex-col items-center gap-2 w-full">
                                        <div className="w-full max-w-[40px] bg-gradient-to-t from-primary to-primary-light rounded-t-sm h-[90%] shadow-[0_0_15px_rgba(54,77,255,0.4)] relative">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded">45jt</div>
                                        </div>
                                        <span className="text-[10px] font-bold text-primary">Jun</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tenants Table -->
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Penghuni Terbaru</h3>
                                <button className="text-sm text-primary font-medium hover:underline">Lihat Semua</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-lg">Nama Penghuni</th>
                                            <th className="px-6 py-4">Kamar</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Jatuh Tempo</th>
                                            <th className="px-6 py-4 rounded-tr-lg">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">BS</div>
                                                <div>
                                                    <p className="font-medium text-slate-700 dark:text-slate-200">Budi Santoso</p>
                                                    <p className="text-xs text-slate-400">Mahasiswa</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">A-101</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Lunas
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">25 Jun 2024</td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-primary transition-colors"><iconify-icon icon="solar:menu-dots-bold" width="20"></iconify-icon></button>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <img src="https://i.pravatar.cc/150?u=4" alt="" className="w-8 h-8 rounded-full object-cover">
                                                <div>
                                                    <p className="font-medium text-slate-700 dark:text-slate-200">Siti Aminah</p>
                                                    <p className="text-xs text-slate-400">Karyawan</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">B-204</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                    Tertunda
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">20 Jun 2024</td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-primary transition-colors"><iconify-icon icon="solar:menu-dots-bold" width="20"></iconify-icon></button>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">DR</div>
                                                <div>
                                                    <p className="font-medium text-slate-700 dark:text-slate-200">Dian Rahma</p>
                                                    <p className="text-xs text-slate-400">Mahasiswa</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">A-105</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                    Proses
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">26 Jun 2024</td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-primary transition-colors"><iconify-icon icon="solar:menu-dots-bold" width="20"></iconify-icon></button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Status Kamar</h3>
                                <iconify-icon icon="solar:smart-home-angle-linear" class="text-slate-400"></iconify-icon>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2 mb-4">

                                <div className="aspect-square rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-[10px] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition-all" title="A1 - Terisi">A1</div>
                                <div className="aspect-square rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-[10px] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition-all">A2</div>
                                <div className="aspect-square rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 text-[10px] font-bold cursor-pointer hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]">A3</div>
                                <div className="aspect-square rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-[10px] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition-all">A4</div>
                                <div className="aspect-square rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-[10px] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition-all">A5</div>
                                
                                <div className="aspect-square rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 text-[10px] font-bold cursor-pointer hover:bg-amber-500 hover:text-white transition-all" title="B1 - Maintenance"><iconify-icon icon="solar:wrench-linear"></iconify-icon></div>
                                <div className="aspect-square rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-[10px] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition-all">B2</div>
                                <div className="aspect-square rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 text-[10px] font-bold cursor-pointer hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]">B3</div>
                                <div className="aspect-square rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-[10px] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition-all">B4</div>
                                <div className="aspect-square rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-[10px] font-bold cursor-pointer hover:bg-rose-500 hover:text-white transition-all">B5</div>
                            </div>
                            
                            <div className="flex justify-between text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Tersedia (6)</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Terisi (23)</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Maint (1)</div>
                            </div>
                        </div>

                        <!-- Upcoming Activity / Timeline -->
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Agenda Hari Ini</h3>
                            <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-700">
                                
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 bg-rose-500 shadow-sm"></div>
                                    <p className="text-xs text-slate-400 font-medium mb-0.5">09:00 WIB</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Jatuh Tempo Pembayaran</p>
                                    <p className="text-xs text-slate-500 mt-1">Kamar A-101 (Budi S.)</p>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 bg-amber-500 shadow-sm"></div>
                                    <p className="text-xs text-slate-400 font-medium mb-0.5">13:00 WIB</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Perbaikan AC</p>
                                    <p className="text-xs text-slate-500 mt-1">Kamar B-01 - Teknisi: Pak Joko</p>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 bg-primary shadow-sm"></div>
                                    <p className="text-xs text-slate-400 font-medium mb-0.5">16:00 WIB</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Check-in Penghuni Baru</p>
                                    <p className="text-xs text-slate-500 mt-1">Kamar C-12 - Rina M.</p>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-2 text-sm text-center text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors font-medium">
                                Lihat Kalender
                            </button>
                        </div>
                        
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <iconify-icon icon="solar:shield-check-linear" width="100"></iconify-icon>
                            </div>
                            <h4 className="font-bold text-lg mb-2 relative z-10">Premium Security</h4>
                            <p className="text-xs text-slate-300 mb-4 relative z-10 leading-relaxed">Sistem CCTV dan Smart Lock aktif. Status keamanan properti aman.</p>
                            <button className="text-xs bg-white text-slate-900 px-3 py-2 rounded-lg font-bold relative z-10 hover:bg-slate-100 transition-colors">
                                Cek Log CCTV
                            </button>
                        </div>

                    </div>
                </div>
                
                <div className="text-center pt-8 pb-4 text-xs text-slate-400">
                    <p>&copy; 2024 KostManagement System v1.0. Designed with precision.</p>
                </div>
            </div>
        </main>
    </div>
</body>
  );
}
