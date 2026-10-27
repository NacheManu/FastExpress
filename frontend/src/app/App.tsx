import { BrowserRouter, Route, Routes } from 'react-router';
import { SnackbarProvider } from '../core/feedback/SnackbarProvider';
import { ThemeProvider } from '../core/theme/ThemeProvider';
import { NotFoundPage } from '../views/pages/NotFoundPage';
import { OrderDetailPage } from '../views/pages/OrderDetailPage';
import { OrdersPage } from '../views/pages/OrdersPage';
import { QuotePage } from '../views/pages/QuotePage';
import { AppShell } from './AppShell';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SnackbarProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<QuotePage />} />
              <Route path="ordenes" element={<OrdersPage />} />
              <Route path="ordenes/:orderId" element={<OrderDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </SnackbarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
