import { useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Home, Layers, Package, Wrench, Boxes, FolderOpen, Image as ImageIcon,
  Inbox, Settings as SettingsIcon, Users as UsersIcon, LogOut, ExternalLink, Menu, X,
  HelpCircle, Quote as QuoteIcon, Link2, FileText, Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { cx } from '../lib/utils';
import { ToastProvider } from './ui';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { CollectionFormPage, CollectionListPage } from './CollectionPage';
import { HomepageEditor } from './HomepageEditor';
import { SettingsPage } from './SettingsPage';
import { HeroSettingsPage } from './HeroSettingsPage';
import { MediaLibrary } from './MediaLibrary';
import { LeadsPage } from './Leads';
import { UsersPage } from './Users';

const NAV: Array<{ group: string; items: Array<{ to: string; label: string; icon: React.ElementType }> }> = [
  {
    group: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    group: 'Content',
    items: [
      { to: '/admin/homepage', label: 'Homepage', icon: Home },
      { to: '/admin/c/pages', label: 'Pages', icon: FileText },
      { to: '/admin/c/navigation', label: 'Navigation', icon: Link2 },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { to: '/admin/c/categories', label: 'Categories', icon: Layers },
      { to: '/admin/c/equipment', label: 'Equipment', icon: Boxes },
      { to: '/admin/c/services', label: 'Services', icon: Wrench },
      { to: '/admin/c/packages', label: 'Packages', icon: Package },
    ],
  },
  {
    group: 'Media & portfolio',
    items: [
      { to: '/admin/media', label: 'Media library', icon: ImageIcon },
      { to: '/admin/c/projects', label: 'Projects / Events', icon: FolderOpen },
    ],
  },
  {
    group: 'Extras',
    items: [
      { to: '/admin/c/faqs', label: 'FAQ', icon: HelpCircle },
      { to: '/admin/c/testimonials', label: 'Testimonials', icon: QuoteIcon },
    ],
  },
  {
    group: 'Leads',
    items: [{ to: '/admin/leads', label: 'Inquiries', icon: Inbox }],
  },
  {
    group: 'Website',
    items: [
      { to: '/admin/settings', label: 'Website settings', icon: SettingsIcon },
      { to: '/admin/hero', label: '3D hero settings', icon: Sparkles },
    ],
  },
  {
    group: 'System',
    items: [{ to: '/admin/users', label: 'Admin users', icon: UsersIcon }],
  },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, logout } = useAuth();
  const { lang } = useI18n();
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-[#1E1E22]">
        <p className="font-display text-sm tracking-[0.14em] uppercase text-[#E6E3DD]">Admin</p>
        <p className="text-[11px] text-[#6A6A72] mt-1 truncate">{profile?.email}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {NAV.map((section) => (
          <div key={section.group} className="mb-5">
            <p className="px-5 mb-2 text-[10px] uppercase tracking-[0.18em] text-[#4A4A51]">{section.group}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                onClick={onNavigate}
                className={({ isActive }) => cx(
                  'flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2',
                  isActive
                    ? 'border-[var(--accent)] text-[#F2EFE9] bg-[#141417]'
                    : 'border-transparent text-[#8C8C93] hover:text-[#E6E3DD] hover:bg-[#111113]'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-[#1E1E22] p-4 space-y-2">
        <Link to={`/${lang}`} className="flex items-center gap-3 px-1 py-2 text-sm text-[#8C8C93] hover:text-[#E6E3DD]">
          <ExternalLink className="w-4 h-4" /> View website
        </Link>
        <button type="button" onClick={() => void logout()}
                className="flex items-center gap-3 px-1 py-2 text-sm text-[#8C8C93] hover:text-red-400 w-full">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { user, profile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen admin-shell grid place-items-center text-sm text-[#6A6A72]">Loading…</div>;
  }
  if (!user || !profile) return <Login />;

  return (
    <ToastProvider>
      <div className="min-h-screen admin-shell flex">
        <aside className="hidden lg:block w-64 shrink-0 border-r border-[#1E1E22] bg-[#0B0B0D] sticky top-0 h-screen">
          <Sidebar />
        </aside>

        {open && (
          <div className="lg:hidden fixed inset-0 z-[120] flex">
            <div className="w-72 bg-[#0B0B0D] border-r border-[#1E1E22]"><Sidebar onNavigate={() => setOpen(false)} /></div>
            <div className="flex-1 bg-black/70" onClick={() => setOpen(false)} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#1E1E22] sticky top-0 bg-[#0B0B0D] z-20">
            <button type="button" onClick={() => setOpen(!open)} aria-label="Menu" className="p-2 text-[#C9C9CE]">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-display text-sm tracking-widest uppercase">Admin</span>
            <span className="w-9" />
          </div>

          <main className="p-5 md:p-8 max-w-6xl" key={location.pathname}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="homepage" element={<HomepageEditor />} />
              <Route path="c/:collection" element={<CollectionListPage />} />
              <Route path="c/:collection/:id" element={<CollectionFormPage />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="hero" element={<HeroSettingsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="*" element={<p className="text-sm text-[#8C8C93]">Page not found.</p>} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
