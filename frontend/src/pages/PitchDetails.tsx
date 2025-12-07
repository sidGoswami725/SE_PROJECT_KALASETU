import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Users, Target, PieChart, Wallet } from "lucide-react";
import { getPitchDetails, showInterestInPitch, fundPitch } from "@/lib/api";

// --- Type Definitions ---
interface User {
  uid: string;
  role: string;
}

interface PitchDetails {
  pitch_title: string;
  business_name: string;
  pitch_details: string;
  funding_goal: number;
  current_funding: number;
  equity_offered: number;
  owner_uids: string[];
  interested_investors: string[];
  interested_investors_details: { uid: string, name: string }[];
}

const PitchDetails = () => {
  const { pitchId } = useParams<{ pitchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pitch, setPitch] = useState<PitchDetails | null>(null);

  const fetchDetails = async () => {
    if (!pitchId) return;
    setIsLoading(true);
    try {
      const details = await getPitchDetails(pitchId);
      setPitch(details);
    } catch (error) {
      toast({ title: "Error", description: "Could not load pitch details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('kalasetu_user');
    if (user) setCurrentUser(JSON.parse(user));
    fetchDetails();
  }, [pitchId]);

  const handleShowInterest = async () => {
      if (!pitchId || !currentUser) return;
      try {
          await showInterestInPitch(pitchId, currentUser.uid);
          toast({ title: "Interest Shown!", description: "The artisan has been notified of your interest." });
          fetchDetails();
      } catch (error) {
          toast({ title: "Error", description: "Could not record your interest.", variant: "destructive" });
      }
  };
  
  const handleFund = async () => {
    if(!pitchId || !currentUser || !pitch) return;
    const amount = prompt(`How much would you like to invest in ${pitch.business_name}?`);
    if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
        try {
            await fundPitch(pitchId, currentUser.uid, parseFloat(amount));
            toast({ title: "Thank You!", description: "Your investment has been recorded."});
            fetchDetails();
        } catch (error) {
            toast({ title: "Error", description: "Investment could not be processed.", variant: "destructive"});
        }
    } else if (amount) {
        alert("Please enter a valid number.");
    }
  };

  if (isLoading || !pitch) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  const fundingProgress = ((pitch.current_funding || 0) / (pitch.funding_goal || 1)) * 100;
  const isOwner = currentUser ? pitch.owner_uids.includes(currentUser.uid) : false;
  const hasShownInterest = currentUser ? pitch.interested_investors.includes(currentUser.uid) : false;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button variant="ghost" onClick={() => navigate('/marketplace')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>
        <h1 className="text-3xl font-bold text-foreground">{pitch.pitch_title}</h1>
        <p className="text-muted-foreground">For Business: <strong>{pitch.business_name}</strong></p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-elevated">
            <CardHeader><CardTitle>The Pitch</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{pitch.pitch_details}</p>
            </CardContent>
          </Card>
          
          {isOwner && (
            <Card className="card-elevated">
              <CardHeader><CardTitle>Interested Investors</CardTitle></CardHeader>
              <CardContent>
                {pitch.interested_investors_details.length > 0 ? (
                  <div className="space-y-4">
                    {pitch.interested_investors_details.map(inv => (
                      <div key={inv.uid} className="flex items-center space-x-3">
                        <Avatar><AvatarFallback className="bg-primary text-white">{inv.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-medium">{inv.name}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No investors have shown interest yet.</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="card-elevated">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5"/>
                    <span>Funding Status</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={fundingProgress} />
                <div>
                    <p className="text-2xl font-bold">₹{(pitch.current_funding || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">raised of ₹{(pitch.funding_goal || 0).toLocaleString()} goal</p>
                </div>
            </CardContent>
          </Card>

           <Card>
                <CardHeader>
                    <CardTitle  className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5"/>
                        <span>Offer</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{(pitch.equity_offered || 0)}%</p>
                    <p className="text-sm text-muted-foreground">equity for full funding</p>
                </CardContent>
           </Card>

          {currentUser?.role === 'investor' && !isOwner && (
            <Card className="card-elevated">
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleFund} className="w-full btn-hero text-white"><Wallet className="mr-2 h-4 w-4"/>Fund this Business</Button>
                <Button variant="outline" onClick={handleShowInterest} disabled={hasShownInterest} className="w-full">
                  {hasShownInterest ? "✔️ Interest Shown" : "Show Interest"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PitchDetails;