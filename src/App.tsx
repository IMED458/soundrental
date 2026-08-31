import { lazy, Suspense, useCallback, useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider, isLang, readStoredLang } from './lib/i18n';
import { SettingsProvider, useSettings } from './lib/settings';
import { AuthProvider } from './lib/auth';
import type { Lang } from './lib/types';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { EquipmentPage } from './pages/Equipment';
import { EquipmentDetailPage } from './pages/EquipmentDetail';
import { ServicesPage, ServiceDetailPage } from './pages/Services';
import { PackagesPage, PackageDetailPage } from './pages/Packages';
import { ProjectsPage, ProjectDetailPage } from './pages/Projects';
import { ContactPage, QuotePage } from './pages/Contact';
import { CustomPage } from './pages/CustomPage';
import { NotFound } from './pages/NotFound';

// The admin panel is a separate bundle — visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

/** Locale comes from the URL, with the stored preference as the fallback. */
function useUrlLang(): Lang {
  const { pathname } = useLocation();
  const { settings } = useSettings();
  const match = /^\/(ka|en|ru)(\/|$)/.exec(pathname);
  if (match && isLang(match[1])) return match[1];
  return readStoredLang() ?? settings.defaultLang ?? 'ka';
}

function PublicRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="equipment/:slug" element={<EquipmentDetailPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:slug" element={<ServiceDetailPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="packages/:slug" element={<PackageDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
        <Route path="about" element={<CustomPage slug="about" />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="quote" element={<QuotePage />} />
        <Route path="p/:slug" element={<CustomPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function Shell() {
  const lang = useUrlLang();
  const { settings } = useSettings();
  const onLangChange = useCallback(() => { /* persisted by the provider */ }, []);
  const defaultLang = settings.defaultLang ?? 'ka';

  return (
    <I18nProvider lang={lang} defaultLang={defaultLang} onLangChange={onLangChange}>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-[#6A6A72]">…</div>}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/:lang/*" element={<PublicRoutes />} />
        <Route path="/" element={<Navigate to={`/${lang}`} replace />} />
        <Route path="*" element={<Navigate to={`/${lang}`} replace />} />
      </Routes>
    </I18nProvider>
  );
}

export default function App() {
  const basename = useMemo(() => import.meta.env.BASE_URL.replace(/\/$/, '') || '/', []);
  return (
    <BrowserRouter basename={basename}>
      <SettingsProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
