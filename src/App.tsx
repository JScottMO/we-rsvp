import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateEvent from "./pages/CreateEvent";
import EventView from "./pages/EventView";
import Privacy from "./pages/Privacy";
import Compare from "./pages/Compare";
import HowToUse from "./pages/HowToUse";
import Feedback from "./pages/Feedback";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogAdmin from "./pages/BlogAdmin";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreateEvent />} />
          <Route path="/event/:eventId" element={<EventView />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/feedback" element={<Feedback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
