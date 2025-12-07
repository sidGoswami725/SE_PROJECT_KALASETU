import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Send, Check, X } from "lucide-react";
import { searchUsers, getProfile, sendCollab, getCollabRequests, updateCollabStatus } from "@/lib/api";

// --- Type Definitions ---
interface User {
  uid: string;
}

interface SearchResult {
  uid: string;
  name: string;
}

interface Request {
  id: string;
  from_name?: string;
  to_name?: string;
  status: string;
  project_details: string;
}

const Collaborations = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [received, setReceived] = useState<Request[]>([]);
  const [sent, setSent] = useState<Request[]>([]);

  const fetchData = async (uid: string) => {
    // Only set main loading state on initial fetch
    if (isLoading) {
        try {
            const { received, sent } = await getCollabRequests(uid);
            setReceived(received);
            setSent(sent);
        } catch (error) {
            toast({ title: "Error", description: "Could not fetch requests.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    } else { // For subsequent refreshes, don't show the main loader
        const { received, sent } = await getCollabRequests(uid);
        setReceived(received);
        setSent(sent);
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

  const handleSearch = async () => {
    const query = searchInput.trim();
    if (!query) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setSelectedUser(null);
    
    try {
      const isUidLike = query.length > 20 && !query.includes(' ');
      let foundUsers: SearchResult[] = [];

      if (isUidLike) {
        const userProfile = await getProfile('artisan', query);
        if (userProfile) {
          foundUsers = [{ uid: query, name: userProfile.name }];
        }
      } else {
        foundUsers = await searchUsers(query);
      }
      
      setSearchResults(foundUsers);
      if(foundUsers.length === 0) {
        toast({ title: "No Results", description: "No artisans found matching your query." });
      }

    } catch (error) {
      setSearchResults([]);
      toast({ title: "Search Failed", description: "Could not find any users.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSend = async () => {
    if (!currentUser || !selectedUser || !message) return;
    await sendCollab(currentUser.uid, selectedUser.uid, message);
    toast({ title: "Success", description: "Collaboration request sent!" });
    setSelectedUser(null);
    setMessage("");
    setSearchInput("");
    setSearchResults([]);
    fetchData(currentUser.uid);
  };

  const handleUpdate = async (requestId: string, status: 'accepted' | 'rejected') => {
      if(!currentUser) return;
      await updateCollabStatus(currentUser.uid, requestId, status);
      fetchData(currentUser.uid);
  };
  
  const getStatusVariant = (status: string) => {
      switch (status) {
          case 'accepted': return 'default';
          case 'pending': return 'secondary';
          case 'rejected': return 'destructive';
          default: return 'outline';
      }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h1 className="text-3xl font-bold text-foreground">Collaboration Hub</h1>
            <p className="text-muted-foreground mt-2">Find and manage your creative partnerships.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-6">
                <Card className="card-elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2"><Search className="h-5 w-5"/><span>Find a Collaborator</span></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex space-x-2">
                            <Input placeholder="Search by name or UID..." value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()}/>
                            <Button onClick={handleSearch} disabled={isSearching}>{isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : "Search"}</Button>
                        </div>
                        <div className="space-y-2">
                            {searchResults.map(u => (
                            <div key={u.uid} className="flex justify-between items-center p-2 border rounded-md">
                                <span className="text-sm font-medium">{u.name}</span>
                                <Button variant="outline" size="sm" onClick={() => setSelectedUser(u)}>Select</Button>
                            </div>
                            ))}
                        </div>
                        {selectedUser && (
                            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                                <p className="text-sm">Sending request to: <strong>{selectedUser.name}</strong></p>
                                <Textarea placeholder="Describe the project..." value={message} onChange={e => setMessage(e.target.value)} />
                                <Button onClick={handleSend} className="w-full"><Send className="mr-2 h-4 w-4"/>Send Request</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card className="card-elevated">
                    <CardHeader><CardTitle>Received Requests</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {received.length > 0 ? received.map(r => (
                        <div key={r.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">From: {r.from_name || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground mt-1"><em>"{r.project_details}"</em></p>
                                </div>
                                <Badge variant={getStatusVariant(r.status)} className="capitalize">{r.status}</Badge>
                            </div>
                            {r.status === 'pending' && (
                            <div className="flex space-x-2 mt-4">
                                <Button size="sm" onClick={() => handleUpdate(r.id, 'accepted')}><Check className="mr-2 h-4 w-4"/>Accept</Button>
                                <Button size="sm" variant="outline" onClick={() => handleUpdate(r.id, 'rejected')}><X className="mr-2 h-4 w-4"/>Reject</Button>
                            </div>
                            )}
                        </div>
                        )) : <p className="text-muted-foreground text-center p-4">No new requests.</p>}
                    </CardContent>
                </Card>
                <Card className="card-elevated">
                    <CardHeader><CardTitle>Sent Requests</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {sent.length > 0 ? sent.map(r => (
                        <div key={r.id} className="p-4 border rounded-lg flex justify-between items-center">
                             <div>
                                <p className="font-semibold">To: {r.to_name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground mt-1"><em>"{r.project_details}"</em></p>
                             </div>
                             <Badge variant={getStatusVariant(r.status)} className="capitalize">{r.status}</Badge>
                        </div>
                        )) : <p className="text-muted-foreground text-center p-4">No sent requests.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
};

export default Collaborations;