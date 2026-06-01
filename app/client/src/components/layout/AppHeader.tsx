'use client';

interface Props {
  onToggleSidebar: () => void;
  title: string;
  subtitle: string;
}

export function AppHeader({ onToggleSidebar, title, subtitle }: Props) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          onClick={onToggleSidebar}
        >
          <iconify-icon icon="solar:hamburger-menu-linear" width="22" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-[#364dff]/10 text-[#364dff] flex items-center justify-center text-xs font-bold cursor-pointer select-none">
        AU
      </div>
    </header>
  );
}
