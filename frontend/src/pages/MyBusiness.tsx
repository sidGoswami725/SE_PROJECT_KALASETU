import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building, Trash2, Rocket, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createBusiness, getBusinesses, getCollaborators, deactivateBusiness } from "@/lib/api";

// --- Type Definitions ---
interface User {
  uid: string;
}

interface Collaborator {
  uid: string;
  name: string;
}

interface Business {
  id: string;
  business_name: string;
  description: string;
  status: 'pending' | 'verified' | 'inactive';
}

const MyBusiness = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    category: "textiles",
    business_type: "sole_proprietorship",
  });
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);

  const fetchData = async (uid: string) => {
    setIsLoading(true);
    try {
      const [userBusinesses, userCollaborators] = await Promise.all([
        getBusinesses(uid),
        getCollaborators(uid),
      ]);
      setBusinesses(userBusinesses);
      setCollaborators(userCollaborators);
    } catch (error) {
      toast({ title: "Error", description: "Could not load your business data.", variant: "destructive" });
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
  }, []); // Corrected dependency

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formData.business_name || !formData.description) {
      toast({ title: "Missing Fields", description: "Business Name and Description are required.", variant: "destructive" });
      return;
    }

    try {
      await createBusiness(currentUser.uid, {
        ...formData,
        collaborator_uids: selectedCollaborators,
      });
      toast({ title: "Success!", description: "Your business has been registered." });
      // Reset form and refetch data
      setFormData({ business_name: "", description: "", category: "textiles", business_type: "sole_proprietorship" });
      setSelectedCollaborators([]);
      fetchData(currentUser.uid);
    } catch (error) {
      toast({ title: "Error", description: "Could not register your business.", variant: "destructive" });
    }
  };

  const handleDeactivate = async (businessId: string) => {
    if (!currentUser || !window.confirm("Are you sure you want to deactivate this business?")) return;
    try {
      await deactivateBusiness(businessId, currentUser.uid);
      toast({ title: "Business Deactivated", description: "The business profile has been deactivated." });
      fetchData(currentUser.uid);
    } catch (error) {
      toast({ title: "Error", description: "Could not deactivate the business.", variant: "destructive" });
    }
  };
  
  const handleLaunchPitch = (business: Business) => {
    localStorage.setItem('pitch_context', JSON.stringify({ businessId: business.id, businessName: business.business_name }));
    navigate('/marketplace');
  };

  const getStatusVariant = (status: Business['status']) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      default: return 'destructive';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Create Business Form */}
        <div className="lg:col-span-2">
          <Card className="card-elevated h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Register a New Business</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBusiness} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="biz-name">Business Name</Label>
                  <Input id="biz-name" value={formData.business_name} onChange={(e) => setFormData(p => ({ ...p, business_name: e.target.value }))} placeholder="e.g., Creative Looms Co."/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biz-desc">Business Description</Label>
                  <Textarea id="biz-desc" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="What makes your business unique?"/>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="biz-category">Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData(p => ({...p, category: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="textiles">Textiles & Weaving</SelectItem>
                        <SelectItem value="pottery">Pottery & Ceramics</SelectItem>
                        <SelectItem value="jewelry">Jewelry</SelectItem>
                        <SelectItem value="woodwork">Woodwork</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-type">Business Type</Label>
                    <Select value={formData.business_type} onValueChange={(v) => setFormData(p => ({...p, business_type: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Add Co-Owners (from your collaborators)</Label>
                  <div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">
                    {collaborators.length > 0 ? collaborators.map(c => (
                      <div key={c.uid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`collab-${c.uid}`}
                          checked={selectedCollaborators.includes(c.uid)}
                          onCheckedChange={(checked) => {
                            setSelectedCollaborators(prev => checked ? [...prev, c.uid] : prev.filter(id => id !== c.uid))
                          }}
                        />
                        <Label htmlFor={`collab-${c.uid}`}>{c.name}</Label>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No collaborators found to add as co-owners.</p>}
                  </div>
                </div>
                <Button type="submit" className="btn-hero text-white w-full">Create Business Profile</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Registered Businesses List */}
        <div className="lg:col-span-1">
          <Card className="card-elevated h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Your Businesses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businesses.filter(b => b.status !== 'inactive').length > 0 ? businesses.map(b => (
                  <div key={b.id} className="p-4 border rounded-lg space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{b.business_name}</h3>
                      <Badge variant={getStatusVariant(b.status)} className="capitalize">{b.status}</Badge>
                    </div>
                    {b.status === 'verified' ? (
                      <Button onClick={() => handleLaunchPitch(b)} className="w-full btn-hero text-white">
                        <Rocket className="mr-2 h-4 w-4" /> Launch Pitch
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">Verification by a mentor is required to launch a pitch.</p>
                    )}
                     <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => handleDeactivate(b.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Deactivate
                    </Button>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground p-8">
                    <p>You have no active businesses registered yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyBusiness;