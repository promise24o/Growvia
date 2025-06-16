import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";

// Auth pages
import ForgotPassword from "@/pages/auth/forgot-password";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ResetPassword from "@/pages/auth/reset-password";
import VerifyEmail from "@/pages/auth/verify-email";
import Onboarding from "@/pages/onboarding";

// Dashboard pages
import Analytics from "@/pages/analytics";
import Apps from "@/pages/apps";
import Commissions from "@/pages/commissions";
import Dashboard from "@/pages/dashboard";
import Marketers from "@/pages/marketers";
import ViewMarketerApplication from "@/pages/marketers/view-marketer-application";
import Settings from "@/pages/settings";

// Management Dashboard (for admin user)
import ManagementDashboard from "@/pages/management/dashboard";
import ManagementOrganizations from "@/pages/management/organizations";
import ManagementUsers from "@/pages/management/users";

// Settings pages
import Billing from "@/pages/settings/billing";
import PaymentSuccess from "@/pages/settings/billing/success";

// Legal pages
import PrivacyPolicy from "@/pages/legal/privacy-policy";
import TermsOfService from "@/pages/legal/terms";

// Landing page
import LandingPage from "@/pages/landing";

// Other pages
import NotFound from "@/pages/not-found";
import MarketerApplication from "./pages/auth/marketer-application";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
 
  return isAuthenticated ? <>{children}</> : null;
}

// Special route that only allows access to management (admin) users
function ManagementRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation("/login");
      } else if (user && user.role !== 'management') {
        // Redirect to dashboard if user isn't a management user
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return isAuthenticated && user?.role === 'management' ? <>{children}</> : null;
}

function App() {
  const { isAuthenticated, fetchUserData, user, organization } = useAuth();
  const [, navigate] = useLocation();

  // Fetch user data when the app loads if the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated, fetchUserData]);
  
  // Check if user needs to complete onboarding
  useEffect(() => {
    if (isAuthenticated && user && organization && organization.length > 0) {
      // If user is admin and onboarding is not completed for the first organization, redirect to onboarding
      if (
        user.role === "admin" &&
        organization[0].onboardingCompleted === false
      ) {
        navigate("/onboarding");
      }
    }
  }, [isAuthenticated, user, organization, navigate]);

  return (
    <TooltipProvider>
      <Switch>
        {/* Auth routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/apply/marketer/:token" component={MarketerApplication} />
        <Route path="/onboarding">
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        </Route>

        {/* Management routes - only for system admins */}
        <Route path="/management/dashboard">
          <ManagementRoute>
            <ManagementDashboard />
          </ManagementRoute>
        </Route>
        <Route path="/management/users">
          <ManagementRoute>
            <ManagementUsers />
          </ManagementRoute>
        </Route>
        <Route path="/management/organizations">
          <ManagementRoute>
            <ManagementOrganizations />
          </ManagementRoute>
        </Route>

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
        <Route path="/marketers/:id/application">
          <ProtectedRoute>
            <ViewMarketerApplication />
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

        {/* Redirect root to dashboard if authenticated, otherwise to landing page */}
        <Route path="/">
          {isAuthenticated ? (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ) : (
            <LandingPage />
          )}
        </Route>

        {/* 404 route */}
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;