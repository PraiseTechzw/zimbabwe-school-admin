import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AcademicHistory from "./pages/AcademicHistory";
import Welfare from "./pages/Welfare";
import Finance from "./pages/Finance";
import Timetable from "./pages/Timetable";
import Portal from "./pages/Portal";
import ProductionReadiness from "./pages/ProductionReadiness";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <DashboardLayout>
          <Home />
        </DashboardLayout>
      </Route>
      <Route path="/academic"><DashboardLayout><AcademicHistory /></DashboardLayout></Route>
      <Route path="/welfare"><DashboardLayout><Welfare /></DashboardLayout></Route>
      <Route path="/finance"><DashboardLayout><Finance /></DashboardLayout></Route>
      <Route path="/timetable"><DashboardLayout><Timetable /></DashboardLayout></Route>
      <Route path="/portal"><DashboardLayout><Portal /></DashboardLayout></Route>
      <Route path="/production-readiness"><DashboardLayout><ProductionReadiness /></DashboardLayout></Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
