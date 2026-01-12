import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import superjson from 'superjson';

function RouterComp() {
  return (
    <>
      <Navigation />
      <div>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/app/login"} component={Home} />
          <Route path={"/app/signup"} component={Home} />
          <Route path={"/app/trial"} component={Home} />
          <Route path={"/demo"} component={Home} />
          <Route path={"/about"} component={Home} />
          <Route path={"/contact"} component={Home} />
          <Route path={"/privacy"} component={Home} />
          <Route path={"/terms"} component={Home} />
          <Route path={"/setup/ledger"} component={SetupLedger} />
          <Route path={"/trades/dashboard"} component={TradesDashboard} />
          <Route path={"/trades/jobs"} component={JobsList} />
          <Route path={"/trades/jobs/new"} component={NewJob} />
          <Route path={"/trades/jobs/:id"} component={JobDetail} />
          <Route path={"/trades/jobs/:id/invoice"} component={GenerateInvoice} />
          <Route path={"/trades/vehicles"} component={Vehicles} />
          <Route path={"/trades/vehicles/new"} component={AddVehicle} />
          <Route path={"/bookings"} component={BookingCalendar} />
          <Route path={"/quotes/:id"} component={QuoteDetail} />
          <Route path={"/dvi"} component={DVIList} />
          <Route path={"/trades/jobs/:jobId/dvi"} component={DVICapture} />
          <Route path={"/public/dvi/:token"} component={DVIApproval} />
          <Route path={"/trades/customers"} component={Customers} />
          <Route path={"/trades/reports"} component={Reports} />
          <Route path={"/settings"} component={Settings} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
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
