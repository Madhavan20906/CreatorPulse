import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Analytics, BeforePublish, CalendarPage, Channel, ContentDetail, Create, Dashboard, Landing, Memory, Onboarding, OpportunityDetail, Opportunities, QA, SettingsPage, Shorts } from '@/pages/pages';

const queryClient = new QueryClient();

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={Landing}/>
    <Route path="/onboarding" component={Onboarding}/>
    <Route path="/dashboard" component={Dashboard}/>
    <Route path="/channel" component={Channel}/>
    <Route path="/opportunities" component={Opportunities}/>
    <Route path="/opportunities/:id" component={OpportunityDetail}/>
    <Route path="/create" component={Create}/>
    <Route path="/content/:id" component={ContentDetail}/>
    <Route path="/shorts" component={Shorts}/>
    <Route path="/shorts/:id" component={Shorts}/>
    <Route path="/qa" component={QA}/>
    <Route path="/qa/:id" component={QA}/>
    <Route path="/calendar" component={CalendarPage}/>
    <Route path="/analytics" component={Analytics}/>
    <Route path="/memory" component={Memory}/>
    <Route path="/settings" component={SettingsPage}/>
    <Route path="/before-publish" component={BeforePublish}/>
    <Route component={NotFound}/>
  </Switch></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter><Toaster/><SonnerToaster position="top-right" richColors /></TooltipProvider></QueryClientProvider>;
}

export default App;