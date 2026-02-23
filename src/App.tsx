import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WineDetail from "./pages/WineDetail";
import Settings from "./pages/Settings";
import BodegasList from "./pages/BodegasList";
import BodegaDetail from "./pages/BodegaDetail";
import DocumentsList from "./pages/DocumentsList";
import PriceComparator from "./pages/PriceComparator";
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
          <Route path="/vino/:id" element={<WineDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/bodegas" element={<BodegasList />} />
          <Route path="/bodegas/:id" element={<BodegaDetail />} />
          <Route path="/documentos" element={<DocumentsList />} />
          <Route path="/comparar-precios" element={<PriceComparator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
