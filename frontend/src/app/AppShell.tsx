import { Outlet } from 'react-router';
import { NavigationBar, NavigationRail } from '../ui/Navigation';
import { TopAppBar } from '../ui/TopAppBar';
import { BrandMark } from './BrandMark';
import { NAV_DESTINATIONS } from './navigation';
import { ThemeMenu } from './ThemeMenu';

/**
 * Estructura adaptable de M3: barra de navegación inferior en móvil y riel lateral
 * a partir de ventanas medianas (600px).
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-surface text-on-surface medium:ps-20">
      <NavigationRail
        destinations={NAV_DESTINATIONS}
        header={<BrandMark />}
        className="fixed inset-y-0 start-0 z-30 hidden bg-surface medium:flex"
      />

      <TopAppBar
        leading={<BrandMark className="medium:hidden" />}
        title="FastExpress"
        actions={<ThemeMenu />}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pt-2 pb-32 medium:px-6 medium:pb-10 expanded:px-8">
        <Outlet />
      </main>

      <NavigationBar destinations={NAV_DESTINATIONS} className="fixed inset-x-0 bottom-0 z-30 medium:hidden" />
    </div>
  );
}
