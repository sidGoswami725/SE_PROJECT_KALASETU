import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { searchMentors, sendMentorshipRequest } from "@/lib/api";

interface User {
  uid: string;
}

interface Mentor {
  uid: string;
  name: string;
  bio: string;
  expertise: string[];
}

const DiscoverMentors = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    const user = localStorage.getItem('kalasetu_user');
    if (user) setCurrentUser(JSON.parse(user));

    const fetchData = async () => {
      try {
        const result = await searchMentors();
        setMentors(result);
      } catch (error) {
        toast({ title: "Error", description: "Could not load mentors.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  const handleRequest = async (mentor: Mentor) => {
      if(!currentUser) return;
      const message = prompt(`Send a mentorship request to ${mentor.name}:`, "I am working on my craft business and would greatly appreciate your guidance.");
      if (message) {
          try {
              await sendMentorshipRequest(currentUser.uid, mentor.uid, message);
              toast({title: "Success", description: "Request sent successfully!"});
          } catch(err: any) {
              toast({title: "Error", description: err.message, variant: "destructive"});
          }
      }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Discover Mentors</h1>
        <p className="text-muted-foreground mt-2">Find experienced professionals to help guide your journey.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map(mentor => (
          <Card key={mentor.uid} className="card-elevated flex flex-col">
            <CardHeader className="flex-row items-center space-x-4">
                <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-white text-lg">{mentor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{mentor.name}</CardTitle>
                    <CardDescription>Mentor</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="text-muted-foreground text-sm">{mentor.bio || "No bio available."}</p>
              <div className="flex flex-wrap gap-2">
                {(mentor.expertise || []).map(e => <Badge key={e} variant="secondary">{e}</Badge>)}
              </div>
            </CardContent>
            <div className="p-6 pt-0">
                <Button onClick={() => handleRequest(mentor)} className="w-full"><UserPlus className="mr-2 h-4 w-4"/>Request Mentorship</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DiscoverMentors;