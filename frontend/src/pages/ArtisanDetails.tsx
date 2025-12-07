import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getProfile, getBusinesses, verifyBusiness } from "@/lib/api";

interface User {
  uid: string;
}

interface ArtisanProfile {
  name: string;
}

interface Business {
  id: string;
  business_name: string;
  description: string;
  status: 'pending' | 'verified' | 'inactive';
}

const ArtisanDetails = () => {
  const { artisanUid } = useParams<{ artisanUid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const fetchData = async () => {
    if (!artisanUid) return;
    setIsLoading(true);
    try {
      const [artisanProfile, artisanBusinesses] = await Promise.all([
        getProfile('artisan', artisanUid),
        getBusinesses(artisanUid)
      ]);
      setProfile(artisanProfile);
      setBusinesses(artisanBusinesses);
    } catch (error) {
      toast({ title: "Error", description: "Could not load artisan details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('kalasetu_user');
    if (user) setCurrentUser(JSON.parse(user));
    fetchData();
  }, [artisanUid]);

  const handleVerify = async (businessId: string) => {
    if (!currentUser) return;
    await verifyBusiness(currentUser.uid, businessId);
    toast({title: "Success", description: "Business has been verified."});
    fetchData();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/my-artisans')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to My Artisans
      </Button>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Review Businesses for {profile?.name}</h1>
        <p className="text-muted-foreground mt-2">Verify business profiles to help artisans qualify for marketplace funding.</p>
      </div>
      <div className="space-y-4">
        {businesses.filter(b => b.status !== 'inactive').length > 0 ? businesses.map(b => (
          <Card key={b.id} className="card-elevated">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{b.business_name}</CardTitle>
                    <Badge variant={b.status === 'verified' ? 'default' : 'secondary'} className="capitalize">{b.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-muted-foreground flex-1">{b.description}</p>
              {b.status === 'verified' ? (
                <div className="flex items-center text-green-600 font-semibold text-sm shrink-0">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Already Verified
                </div>
              ) : (
                <Button onClick={() => handleVerify(b.id)} className="shrink-0">Verify Business</Button>
              )}
            </CardContent>
          </Card>
        )) : <p className="text-muted-foreground p-8 text-center">This artisan has no active businesses registered yet.</p>}
      </div>
    </div>
  );
};

export default ArtisanDetails;