import "./global.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

// ✅ Pages
import Home from "./pages/Home";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Petitions from "./pages/Petitions";
import CommunityPetitions from "./pages/CommunityPetitions";
import CreatePetition from "./pages/CreatePetition";
import EditPetition from "./pages/EditPetition";
import PollFeedback from "./pages/PollFeedback";
import Polls from "./pages/Polls";
import CommunityPolls from "./pages/CommunityPolls";
import CreatePoll from "./pages/CreatePoll";
import Reports from "./pages/Reports";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import EditPoll from "./pages/EditPoll";
import ReportsDashboard from "./pages/ReportsDashboard";

// ✅ Create a query client for React Query
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* --- MAIN ROUTES --- */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorks />} />

          {/* --- AUTH ROUTES --- */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* --- PETITIONS --- */}
          <Route path="/petitions" element={<Petitions />} />
          <Route path="/petitions/community" element={<CommunityPetitions />} />
          <Route path="/petition/create" element={<CreatePetition />} />
          <Route path="/petition/edit/:id" element={<EditPetition />} />
          
          <Route path="/poll/:id/feedback" element={<PollFeedback />} />

          {/* --- POLLS --- */}
          <Route path="/polls" element={<Polls />} />
          <Route path="/polls/community" element={<CommunityPolls />} />
          <Route path="/polls/create" element={<CreatePoll />} />
          <Route path="/polls/edit/:id" element={<EditPoll />} />

          {/* --- REPORTS --- */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/dashboard" element={<ReportsDashboard />} />

          {/* --- 404 FALLBACK --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
