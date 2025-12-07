import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Forum from "./pages/Forum";
import Communities from "./pages/Communities";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import MyBusiness from "./pages/MyBusiness";
import Marketplace from "./pages/Marketplace";
import PitchDetails from "./pages/PitchDetails";
import AITools from "./pages/AITools";
import Collaborations from "./pages/Collaborations";
import DiscoverMentors from "./pages/DiscoverMentors";
import MyMentors from "./pages/MyMentors";
import DiscoverArtisans from "./pages/DiscoverArtisans";
import MyArtisans from "./pages/MyArtisans";
import ArtisanDetails from "./pages/ArtisanDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="forum" element={<Forum />} />
            <Route path="communities" element={<Communities />} />
            <Route path="chat" element={<Chat />} />
            {/* Artisan Routes */}
            <Route path="ai-tools" element={<AITools />} />
            <Route path="collaboration" element={<Collaborations />} />
            <Route path="my-business" element={<MyBusiness />} />
            <Route path="discover-mentors" element={<DiscoverMentors />} />
            <Route path="my-mentors" element={<MyMentors />} />
            {/* Mentor Routes */}
            <Route path="discover-artisans" element={<DiscoverArtisans />} />
            <Route path="my-artisans" element={<MyArtisans />} />
            <Route path="artisan-details/:artisanUid" element={<ArtisanDetails />} />
            {/* Investor Routes */}
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="marketplace/pitch/:pitchId" element={<PitchDetails />} />
            <Route path="portfolio" element={<div className="p-8 text-center text-muted-foreground">Portfolio - Coming Soon</div>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
