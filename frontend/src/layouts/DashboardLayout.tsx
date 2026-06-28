import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ChartLineUpIcon, PhoneIcon, ListChecksIcon, ListIcon, XIcon } from '@phosphor-icons/react';
import { ModeToggle } from '@/components/mode-toggle';

export function DashboardLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Call Now', path: '/dashboard/demo', icon: <PhoneIcon size={20} /> },
    { name: 'Overview', path: '/dashboard', icon: <ChartLineUpIcon size={20} /> },
    { name: 'Call History', path: '/dashboard/calls', icon: <ListChecksIcon size={20} /> },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="SettleVox Logo" className="h-6 w-auto" />
          <h1 className="text-xl font-display font-medium tracking-tight text-foreground">SettleVox</h1>
        </div>
        <button 
          className="md:hidden p-1 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <XIcon size={20} />
        </button>
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
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-md ${
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
          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary font-bold text-xs rounded-full">
            SV
          </div>
          <div>
            <p className="text-sm font-medium">Aditya</p>
            <p className="text-xs text-muted-foreground">aditya@adixcode.com</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex md:w-64 border-r border-border bg-card flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slide-Over Drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col z-50 transition-transform duration-300 transform ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
          <button 
            className="p-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <ListIcon size={24} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="SettleVox Logo" className="h-5 w-auto" />
            <span className="font-semibold text-sm">SettleVox CRM</span>
          </div>
          <ModeToggle />
        </header>

        {/* Desktop Header Bar */}
        <header className="hidden md:flex h-14 border-b border-border items-center px-8 justify-between text-sm bg-card shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>MY ORG</span>
            <span className="px-1.5 py-0.5 border border-border text-[10px] uppercase font-mono rounded">Demo</span>
          </div>
          <div className="flex items-center gap-6 text-muted-foreground font-medium">
            <ModeToggle />
          </div>
        </header>

        {/* Content Box */}
        <div className="p-4 md:p-8 flex-1 overflow-auto">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
