import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { TooltipProvider } from "@/components/ui/tooltip";

// Auth pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

// Dashboard pages
import Dashboard from "@/pages/dashboard";
import Apps from "@/pages/apps";
import Marketers from "@/pages/marketers";
import Analytics from "@/pages/analytics";
import Commissions from "@/pages/commissions";
import Settings from "@/pages/settings";

// Settings pages
import Billing from "@/pages/settings/billing";
import PaymentSuccess from "@/pages/settings/billing/success";

// Legal pages
import TermsOfService from "@/pages/legal/terms";
import PrivacyPolicy from "@/pages/legal/privacy-policy";

// Other pages
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}

function App() {
  const { isAuthenticated, fetchUserData } = useAuth();

  // Fetch user data when the app loads if the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated, fetchUserData]);

  return (
    <TooltipProvider>
      <Switch>
        {/* Auth routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* Protected routes */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/apps">
          <ProtectedRoute>
            <Apps />
          </ProtectedRoute>
        </Route>
        <Route path="/marketers">
          <ProtectedRoute>
            <Marketers />
          </ProtectedRoute>
        </Route>
        <Route path="/analytics">
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        </Route>
        <Route path="/commissions">
          <ProtectedRoute>
            <Commissions />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>
        
        {/* Settings routes */}
        <Route path="/settings/billing">
          <ProtectedRoute>
            <Billing />
          </ProtectedRoute>
        </Route>
        
        <Route path="/settings/billing/success">
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        </Route>
        
        {/* Legal routes - publicly accessible */}
        <Route path="/legal/terms" component={TermsOfService} />
        <Route path="/legal/privacy-policy" component={PrivacyPolicy} />

        {/* Redirect root to dashboard if authenticated, otherwise to login */}
        <Route path="/">
          {isAuthenticated ? (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ) : (
            <Login />
          )}
        </Route>

        {/* 404 route */}
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;