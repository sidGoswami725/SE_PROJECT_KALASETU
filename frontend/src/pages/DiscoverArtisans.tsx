import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy } from "lucide-react";
import { searchArtisans } from "@/lib/api";

interface Artisan {
  uid: string;
  name: string;
  bio: string;
  skills: string[];
}

const DiscoverArtisans = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [skill, setSkill] = useState("");

  const fetchData = async (searchSkill = "") => {
    setIsLoading(true);
    try {
      const result = await searchArtisans(searchSkill);
      setArtisans(result);
    } catch (error) {
      toast({ title: "Error", description: "Could not load artisans.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    toast({title: "Copied!", description: "Artisan UID copied to clipboard."});
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discover Artisans</h1>
          <p className="text-muted-foreground mt-2">Find talented artisans to mentor and support.</p>
        </div>
        <div className="flex space-x-2">
          <Input placeholder="Search by skill..." value={skill} onChange={e => setSkill(e.target.value)} className="w-full sm:w-64"/>
          <Button onClick={() => fetchData(skill)}>Search</Button>
        </div>
      </div>
      
      {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artisans.map(artisan => (
          <Card key={artisan.uid} className="card-elevated flex flex-col">
            <CardHeader className="flex-row items-center space-x-4">
                <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-white text-lg">{artisan.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{artisan.name}</CardTitle>
                    <CardDescription>Artisan</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="text-muted-foreground text-sm">{artisan.bio || "No bio available."}</p>
              <div className="flex flex-wrap gap-2">
                {(artisan.skills || []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </CardContent>
            <div className="p-6 pt-0">
                <Button variant="outline" size="sm" onClick={() => copyUid(artisan.uid)} className="w-full"><Copy className="mr-2 h-4 w-4"/>Copy UID</Button>
            </div>
          </Card>
        ))}
      </div>}
    </div>
  );
};

export default DiscoverArtisans;