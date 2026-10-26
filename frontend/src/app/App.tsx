import { BrowserRouter, Route, Routes } from 'react-router';
import { ThemeProvider } from '../core/theme/ThemeProvider';
import { NotFoundPage } from '../views/pages/NotFoundPage';
import { OrdersPage } from '../views/pages/OrdersPage';
import { QuotePage } from '../views/pages/QuotePage';
import { AppShell } from './AppShell';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<QuotePage />} />
            <Route path="ordenes" element={<OrdersPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
