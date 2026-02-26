import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import CreateProfile from "./pages/CreateProfile";
import Matches from "./pages/Matches";
import Posts from "./pages/Posts";
import CreatePost from "./pages/CreatePost";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import OtherProfilePage from "./pages/OtherProfilePage";
import Notifications from "./pages/Notifications";
import DatePickerPage from "./pages/DatePickerPage"; // ✅ Added

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const accessToken = useSelector(
    (state: any) => state.auth?.login?.accessToken,
  );
  return accessToken ? <>{children}</> : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const accessToken = useSelector(
    (state: any) => state.auth?.login?.accessToken,
  );
  return !accessToken ? <>{children}</> : <Navigate to="/" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <main className="pb-20 md:pb-0">
          <Routes>
            {/* ── Guest routes ── */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/create-profile"
              element={
                <GuestRoute>
                  <CreateProfile />
                </GuestRoute>
              }
            />

            {/* ── Private routes ── */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Index />
                </PrivateRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <PrivateRoute>
                  <Matches />
                </PrivateRoute>
              }
            />
            <Route
              path="/posts"
              element={
                <PrivateRoute>
                  <Posts />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-post"
              element={
                <PrivateRoute>
                  <CreatePost />
                </PrivateRoute>
              }
            />

            {/* ✅ Trang cá nhân người khác */}
            <Route
              path="/profile/:id"
              element={
                <PrivateRoute>
                  <OtherProfilePage />
                </PrivateRoute>
              }
            />

            {/* ✅ Trang Lịch sử Thông báo */}
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />

            {/* ✅ Trang Chọn Lịch Hẹn Hò */}
            <Route
              path="/schedule/:id"
              element={
                <PrivateRoute>
                  <DatePickerPage />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
