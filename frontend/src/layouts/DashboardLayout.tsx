import { Outlet, Link, useLocation } from 'react-router-dom';
import { ChartLineUpIcon, PhoneIcon, ListChecksIcon } from '@phosphor-icons/react';
import { ModeToggle } from '@/components/mode-toggle';

export function DashboardLayout() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Call Now', path: '/dashboard/demo', icon: <PhoneIcon size={20} /> },
    { name: 'Overview', path: '/dashboard', icon: <ChartLineUpIcon size={20} /> },
    { name: 'Call History', path: '/dashboard/calls', icon: <ListChecksIcon size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <img src="/logo.svg" alt="SettleVox Logo" className="h-6 w-auto" />
          <h1 className="text-xl font-display font-medium tracking-tight text-foreground">SettleVox</h1>
        </div>
        
        <div className="px-4 pb-2">
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Analytics
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  : location.pathname.startsWith(item.path)
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              SV
            </div>
            <div>
              <p className="text-sm font-medium">Aditya</p>
              <p className="text-xs text-muted-foreground">aditya@adixcode.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Topbar matching Supermemory 'MY ORG' bar */}
        <header className="h-14 border-b border-border flex items-center px-8 justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>MY ORG</span>
            <span className="px-1.5 py-0.5 border border-border text-[10px] uppercase font-mono">Demo</span>
          </div>
          <div className="flex items-center gap-6 text-muted-foreground font-medium">
            <ModeToggle />
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto">
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
