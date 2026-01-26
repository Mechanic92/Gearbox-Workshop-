import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LedgerProvider } from "./contexts/LedgerContext";
import Home from "./pages/Home";
import SetupLedger from "./pages/SetupLedger";
import TradesDashboard from "./pages/TradesDashboard";
import NewJob from "./pages/NewJob";
import JobDetail from "./pages/JobDetail";
import Vehicles from "./pages/Vehicles";
import AddVehicle from "./pages/AddVehicle";
import BookingCalendar from "./pages/BookingCalendar";
import QuoteDetail from "./pages/QuoteDetail";
import DVICapture from "./pages/DVICapture";
import DVIApproval from "./pages/DVIApproval";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import GenerateInvoice from "./pages/GenerateInvoice";
import JobsList from "./pages/JobsList";
import DVIList from "./pages/DVIList";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import superjson from 'superjson';

import PublicBooking from "./pages/PublicBooking";

function ProtectedRoute({ component: Component, path }: { component: any, path: string }) {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem("gearbox_user_id"));
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!userId) {
      setLocation("/app/login");
    }
  }, [userId, setLocation]);

  if (!userId) return null;

  return (
    <div className="flex w-full">
      <Navigation />
      <main className="flex-1 min-h-screen relative">
        <Component />
      </main>
    </div>
  );
}

function RouterComp() {
  return (
    <Switch>
      {/* Public Pages */}
      <Route path="/" component={Home} />
      <Route path="/demo" component={Home} />
      <Route path="/app/login" component={Login} />
      <Route path="/app/signup" component={Signup} />
      
      {/* Public Product Pages */}
      <Route path="/public/dvi/:token" component={DVIApproval} />
      <Route path="/public/booking/:shopId" component={PublicBooking} />

      {/* Protected Routes */}
      <Route path="/setup/ledger">
        <ProtectedRoute component={SetupLedger} path="/setup/ledger" />
      </Route>
      <Route path="/trades/dashboard">
        <ProtectedRoute component={TradesDashboard} path="/trades/dashboard" />
      </Route>
      <Route path="/trades/jobs">
        <ProtectedRoute component={JobsList} path="/trades/jobs" />
      </Route>
      <Route path="/trades/jobs/new">
        <ProtectedRoute component={NewJob} path="/trades/jobs/new" />
      </Route>
      <Route path="/trades/jobs/:id">
        <ProtectedRoute component={JobDetail} path="/trades/jobs/:id" />
      </Route>
      <Route path="/trades/jobs/:id/invoice">
        <ProtectedRoute component={GenerateInvoice} path="/trades/jobs/:id/invoice" />
      </Route>
      <Route path="/trades/vehicles">
        <ProtectedRoute component={Vehicles} path="/trades/vehicles" />
      </Route>
      <Route path="/trades/vehicles/new">
        <ProtectedRoute component={AddVehicle} path="/trades/vehicles/new" />
      </Route>
      <Route path="/bookings">
        <ProtectedRoute component={BookingCalendar} path="/bookings" />
      </Route>
      <Route path="/quotes/:id">
        <ProtectedRoute component={QuoteDetail} path="/quotes/:id" />
      </Route>
      <Route path="/dvi">
        <ProtectedRoute component={DVIList} path="/dvi" />
      </Route>
      <Route path="/trades/jobs/:jobId/dvi">
        <ProtectedRoute component={DVICapture} path="/trades/jobs/:jobId/dvi" />
      </Route>
      <Route path="/trades/customers">
        <ProtectedRoute component={Customers} path="/trades/customers" />
      </Route>
      <Route path="/trades/reports">
        <ProtectedRoute component={Reports} path="/trades/reports" />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} path="/settings" />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `/api/trpc`,
          headers() {
            const userId = localStorage.getItem("gearbox_user_id");
            return userId ? { "x-user-id": userId } : {};
          }
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="light">
            <LedgerProvider>
              <TooltipProvider>
                <Toaster />
                <RouterComp />
              </TooltipProvider>
            </LedgerProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
