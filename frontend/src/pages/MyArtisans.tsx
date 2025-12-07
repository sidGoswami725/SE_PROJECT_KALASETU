import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMentorshipRequests, getConnectedArtisans, updateMentorshipRequestStatus } from "@/lib/api";

interface User {
  uid: string;
}

interface Request {
  id: string;
  artisan_name: string;
  message: string;
}

interface Artisan {
  uid: string;
  name: string;
}

const MyArtisans = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);

  const fetchData = async (uid: string) => {
    setIsLoading(true);
    try {
      const [reqs, arts] = await Promise.all([
        getMentorshipRequests(uid),
        getConnectedArtisans(uid)
      ]);
      setRequests(reqs);
      setArtisans(arts);
    } catch (error) {
      toast({ title: "Error", description: "Could not load artisan data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('kalasetu_user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      fetchData(parsedUser.uid);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleUpdate = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!currentUser) return;
    await updateMentorshipRequestStatus(requestId, currentUser.uid, status);
    fetchData(currentUser.uid);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Artisans</h1>
        <p className="text-muted-foreground mt-2">Manage your mentorship requests and connected artisans.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card className="card-elevated">
          <CardHeader><CardTitle>Mentorship Requests</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {requests.length > 0 ? requests.map(r => (
              <div key={r.id} className="p-4 border rounded-lg space-y-3">
                <p>Request from <strong>{r.artisan_name}</strong></p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md"><em>"{r.message}"</em></p>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleUpdate(r.id, 'accepted')}><Check className="mr-2 h-4 w-4"/>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdate(r.id, 'rejected')}><X className="mr-2 h-4 w-4"/>Reject</Button>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-center p-4">No pending requests.</p>}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle>Connected Artisans</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {artisans.length > 0 ? artisans.map(a => (
              <div key={a.uid} className="p-4 border rounded-lg flex justify-between items-center">
                <span className="font-medium">{a.name}</span>
                <Button variant="outline" onClick={() => navigate(`/artisan-details/${a.uid}`)}><Building className="mr-2 h-4 w-4"/>Review Businesses</Button>
              </div>
            )) : <p className="text-muted-foreground text-center p-4">You are not mentoring any artisans yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyArtisans;