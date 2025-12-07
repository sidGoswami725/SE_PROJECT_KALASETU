import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listPitches, createPitch } from "@/lib/api";

// --- Type Definitions ---
interface User {
  uid: string;
  role: string;
}

interface Pitch {
  id: string;
  pitch_title: string;
  business_name: string;
  funding_goal: number;
  current_funding: number;
  equity_offered: number;
}

const Marketplace = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pitches, setPitches] = useState<Pitch[]>([]);

  // State for the create pitch dialog
  const [isPitchDialogOpen, setIsPitchDialogOpen] = useState(false);
  const [pitchFormData, setPitchFormData] = useState({
    business_id: "",
    business_name: "",
    pitch_title: "",
    funding_goal: "",
    equity_offered: "",
    pitch_details: "",
  });

  const fetchPitches = async () => {
    setIsLoading(true);
    try {
      const allPitches = await listPitches();
      setPitches(allPitches);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch marketplace pitches.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('kalasetu_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    fetchPitches();

    const pitchContext = localStorage.getItem('pitch_context');
    if (pitchContext) {
      const { businessId, businessName } = JSON.parse(pitchContext);
      setPitchFormData(prev => ({ ...prev, business_id: businessId, business_name: businessName }));
      setIsPitchDialogOpen(true);
      localStorage.removeItem('pitch_context');
    }
  }, []);
  
  const handleCreatePitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await createPitch(currentUser.uid, {
        ...pitchFormData,
        funding_goal: parseFloat(pitchFormData.funding_goal),
        equity_offered: parseFloat(pitchFormData.equity_offered)
      });
      toast({ title: "Pitch Created!", description: "Your pitch is now live on the marketplace." });
      setIsPitchDialogOpen(false);
      fetchPitches();
    } catch (error) {
      toast({ title: "Error", description: "Could not create your pitch.", variant: "destructive"});
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Investment Marketplace</h1>
        <p className="text-muted-foreground mt-2">Discover and invest in the next generation of artisan entrepreneurs.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {pitches.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pitches.map(pitch => {
                const fundingProgress = ((pitch.current_funding || 0) / (pitch.funding_goal || 1)) * 100;
                return (
                  <Card 
                    key={pitch.id} 
                    className="card-elevated hover:shadow-lg cursor-pointer flex flex-col" 
                    onClick={() => navigate(`/marketplace/pitch/${pitch.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{pitch.pitch_title}</CardTitle>
                      <CardDescription>For: {pitch.business_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Raised</span>
                          <span>Goal: ₹{(pitch.funding_goal || 0).toLocaleString()}</span>
                        </div>
                        <Progress value={fundingProgress} />
                        <p className="text-sm font-semibold mt-1">₹{(pitch.current_funding || 0).toLocaleString()}</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                       <p className="text-sm">Equity Offered: <strong>{pitch.equity_offered || 0}%</strong></p>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="col-span-3">
              <CardContent className="p-12 text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Opportunities Available</h3>
                <p className="text-muted-foreground">There are no active investment pitches on the marketplace right now.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog for Creating a Pitch */}
      <Dialog open={isPitchDialogOpen} onOpenChange={setIsPitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Your Pitch for {pitchFormData.business_name}</DialogTitle>
            <CardDescription>Fill out the details below to list your business on the marketplace.</CardDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePitch} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="pitch-title">Pitch Title</Label>
              <Input id="pitch-title" value={pitchFormData.pitch_title} onChange={(e) => setPitchFormData(p => ({...p, pitch_title: e.target.value}))} placeholder="e.g., Eco-Friendly Pottery for Modern Homes"/>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="funding-goal">Funding Goal (₹)</Label>
                    <Input id="funding-goal" type="number" value={pitchFormData.funding_goal} onChange={(e) => setPitchFormData(p => ({...p, funding_goal: e.target.value}))} placeholder="50000"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="equity-offered">Equity Offered (%)</Label>
                    <Input id="equity-offered" type="number" value={pitchFormData.equity_offered} onChange={(e) => setPitchFormData(p => ({...p, equity_offered: e.target.value}))} placeholder="10"/>
                </div>
             </div>
            <div className="space-y-2">
              <Label htmlFor="pitch-details">Pitch Details</Label>
              <Textarea id="pitch-details" value={pitchFormData.pitch_details} onChange={(e) => setPitchFormData(p => ({...p, pitch_details: e.target.value}))} placeholder="Describe your vision, product, and how the funds will be used."/>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="btn-hero text-white"><Plus className="mr-2 h-4 w-4"/>Submit Pitch</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;