import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { CheckoutInterceptorProvider } from './context/CheckoutInterceptorContext';
import CartToastBridge from './components/ui/CartToastBridge';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { trackPageView } from './config/analytics';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';

// Heavy routes are code-split so the initial bundle stays small.
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VendorProducts = lazy(() => import('./pages/VendorProducts'));
const VendorOrders = lazy(() => import('./pages/VendorOrders'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

const withSuspense = (node) => (
  <Suspense fallback={<LoadingSpinner size="lg" className="py-32" />}>{node}</Suspense>
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <CheckoutInterceptorProvider>
            <PageTracker />
            <CartToastBridge />
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={withSuspense(<ProductDetailPage />)} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={withSuspense(<CheckoutPage />)} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/orders" element={withSuspense(<OrdersPage />)} />
                <Route path="/wishlist" element={withSuspense(<WishlistPage />)} />
                <Route path="/profile" element={withSuspense(<ProfilePage />)} />
                <Route path="/vendor" element={withSuspense(<VendorDashboard />)} />
                <Route path="/vendor/products" element={withSuspense(<VendorProducts />)} />
                <Route path="/vendor/orders" element={withSuspense(<VendorOrders />)} />
                <Route path="/admin" element={withSuspense(<AdminDashboard />)} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </CheckoutInterceptorProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
