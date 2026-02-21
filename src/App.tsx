import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WishlistProvider } from "./context/WishlistContext";
import { CartProvider } from "./context/CartContext";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/ui/LoadingFallback";

// Lazy Imports for Code Splitting
const Catalogo = lazy(() => import("./pages/Catalogo"));
const Rituales = lazy(() => import("./pages/Rituales"));
const Kits = lazy(() => import("./pages/Kits"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Retracto = lazy(() => import("./pages/Retracto"));

// Dashboard (New Unified)
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const DashboardChatList = lazy(() => import('./components/dashboard/ChatList'));
const DashboardChatView = lazy(() => import('./components/dashboard/ChatView'));
const DashboardBase = lazy(() => import('./pages/Dashboard'));
const KnowledgePanel = lazy(() => import('./components/dashboard/KnowledgePanel'));
const OverviewPanel = lazy(() => import('./components/dashboard/OverviewPanel'));
const OrdersPanel = lazy(() => import('./components/dashboard/OrdersPanel'));
import { InventoryManager } from './components/admin/InventoryManager';
import { ProtectedRoute } from './components/dashboard/ProtectedRoute';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WishlistProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/catalogo" element={<Catalogo />} />
                  <Route path="/rituales" element={<Rituales />} />
                  <Route path="/kits" element={<Kits />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route path="/rastreo" element={<TrackOrder />} />
                  
                  {/* Admin & Legacy */}
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/terminos" element={<Terms />} />
                  <Route path="/privacidad" element={<Privacy />} />
                  <Route path="/retracto" element={<Retracto />} />

                  {/* Dashboard Routes (RBAC Protected) */}
                  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'SUPPORT']} />}>
                      <Route element={<DashboardLayout />}>
                          {/* ADMIN ONLY */}
                          <Route index element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                  <OverviewPanel />
                              </ProtectedRoute>
                          } />
                          <Route path="settings" element={
                              <ProtectedRoute allowedRoles={['ADMIN']}>
                                  <div className="p-10 text-gray-500">Configuración (Próximamente)</div>
                              </ProtectedRoute>
                          } />

                          {/* ADMIN & SUPPORT */}
                          <Route path="chats" element={
                              <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT']}>
                                  <DashboardBase />
                              </ProtectedRoute>
                          }>
                              <Route index element={<DashboardChatList />} />
                              <Route path=":id" element={<DashboardChatView />} />
                          </Route>
                          <Route path="knowledge" element={
                              <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT']}>
                                  <KnowledgePanel />
                              </ProtectedRoute>
                          } />

                          {/* ADMIN & WAREHOUSE */}
                          <Route path="orders" element={
                              <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}>
                                  <OrdersPanel />
                              </ProtectedRoute>
                          } />
                          <Route path="inventory" element={
                              <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}>
                                  <InventoryManager token={sessionStorage.getItem('kaiu_admin_token')} />
                              </ProtectedRoute>
                          } />
                      </Route>
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
