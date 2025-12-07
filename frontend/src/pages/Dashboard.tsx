import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  GraduationCap,
  DollarSign,
  Store,
  UserCheck,
  Users,
  Briefcase,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Loader2, // For loading spinner
  Building,
  Handshake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- NEW IMPORTS ---
import {
  getBusinesses,
  getConnectedMentors,
  getCollaborators,
  getConnectedArtisans,
  getMentorshipRequests,
  listPitches,
} from "@/lib/api";

// --- NEW TYPE DEFINITIONS ---
interface User {
  uid: string;
  name: string;
  email: string;
  role: 'artisan' | 'mentor' | 'investor';
}

interface ArtisanStats {
  businessCount: number;
  mentorCount: number;
  collaboratorCount: number;
}

interface MentorStats {
  artisanCount: number;
  requestCount: number;
}

interface InvestorStats {
  marketplacePitchCount: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW STATE for stats ---
  const [artisanStats, setArtisanStats] = useState<ArtisanStats | null>(null);
  const [mentorStats, setMentorStats] = useState<MentorStats | null>(null);
  const [investorStats, setInvestorStats] = useState<InvestorStats | null>(null);

  // --- NEW DATA FETCHING LOGIC ---
  useEffect(() => {
    const userData = localStorage.getItem('kalasetu_user');
    if (userData) {
      const parsedUser: User = JSON.parse(userData);
      setUser(parsedUser);
      fetchDashboardData(parsedUser);
    } else {
      setIsLoading(false);
    }

    async function fetchDashboardData(currentUser: User) {
      try {
        if (currentUser.role === 'artisan') {
          const [businesses, mentors, collaborators] = await Promise.all([
            getBusinesses(currentUser.uid),
            getConnectedMentors(currentUser.uid),
            getCollaborators(currentUser.uid),
          ]);
          setArtisanStats({
            businessCount: businesses.length,
            mentorCount: mentors.length,
            collaboratorCount: collaborators.length,
          });
        } else if (currentUser.role === 'mentor') {
          const [artisans, requests] = await Promise.all([
            getConnectedArtisans(currentUser.uid),
            getMentorshipRequests(currentUser.uid),
          ]);
          setMentorStats({
            artisanCount: artisans.length,
            requestCount: requests.length,
          });
        } else if (currentUser.role === 'investor') {
          const pitches = await listPitches();
          setInvestorStats({
            marketplacePitchCount: pitches.length,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <div>Could not find user. Please log in again.</div>;
  }

  // --- RENDER COMPONENTS (NOW WITH LIVE DATA) ---
  const ArtisanDashboard = () => (
    <div className="space-y-8">
      <div className="gradient-card rounded-xl p-8 border border-primary/10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground text-lg">Continue your journey from artisan to entrepreneur.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Building className="h-5 w-5 text-primary" /><span>My Businesses</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{artisanStats?.businessCount ?? 0}</div>
            <p className="text-muted-foreground">Registered businesses</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><UserCheck className="h-5 w-5 text-primary" /><span>My Mentors</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{artisanStats?.mentorCount ?? 0}</div>
            <p className="text-muted-foreground">Connected mentors</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Handshake className="h-5 w-5 text-primary" /><span>Collaborators</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{artisanStats?.collaboratorCount ?? 0}</div>
            <p className="text-muted-foreground">Active collaborations</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-elevated cursor-pointer hover:border-primary" onClick={() => navigate('/my-business')}>
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-soft rounded-xl flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Manage My Business</h3>
                  <p className="text-muted-foreground">Register a new business or view existing ones.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated cursor-pointer hover:border-primary" onClick={() => navigate('/discover-mentors')}>
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-soft rounded-xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Discover Mentors</h3>
                  <p className="text-muted-foreground">Find an expert to guide you.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const MentorDashboard = () => (
    <div className="space-y-8">
      <div className="gradient-card rounded-xl p-8 border border-primary/10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {user.name}!</h1>
        <p className="text-muted-foreground text-lg">Empower the next generation of artisan entrepreneurs.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Users className="h-5 w-5 text-primary" /><span>Active Mentees</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{mentorStats?.artisanCount ?? 0}</div>
            <p className="text-muted-foreground">Artisans you're mentoring</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><MessageSquare className="h-5 w-5 text-primary" /><span>Pending Requests</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{mentorStats?.requestCount ?? 0}</div>
            <p className="text-muted-foreground">New mentorship requests</p>
          </CardContent>
        </Card>
      </div>
      <Card className="card-elevated cursor-pointer hover:border-primary" onClick={() => navigate('/my-artisans')}>
        <CardContent className="p-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-soft rounded-xl flex items-center justify-center">
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Manage My Artisans</h3>
              <p className="text-muted-foreground">View your mentees and respond to new requests.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const InvestorDashboard = () => (
    <div className="space-y-8">
      <div className="gradient-card rounded-xl p-8 border border-primary/10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {user.name}!</h1>
        <p className="text-muted-foreground text-lg">Discover and invest in the future of artisan entrepreneurship.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Store className="h-5 w-5 text-primary" /><span>Marketplace Opportunities</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{investorStats?.marketplacePitchCount ?? 0}</div>
            <p className="text-muted-foreground">Active pitches seeking funding</p>
          </CardContent>
        </Card>
        <Card className="card-elevated cursor-pointer hover:border-primary" onClick={() => navigate('/marketplace')}>
          <CardContent className="p-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-soft rounded-xl flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Explore the Marketplace</h3>
                <p className="text-muted-foreground">Browse all available investment opportunities.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDashboard = () => {
    switch (user.role) {
      case 'artisan':
        return <ArtisanDashboard />;
      case 'mentor':
        return <MentorDashboard />;
      case 'investor':
        return <InvestorDashboard />;
      default:
        return <div>Invalid user role.</div>;
    }
  };

  return <div className="animate-fade-in">{renderDashboard()}</div>;
}