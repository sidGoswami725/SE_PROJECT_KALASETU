import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getConnectedMentors } from "@/lib/api";

interface User {
  uid: string;
}

interface Mentor {
  uid: string;
  name: string;
  bio: string;
}

const MyMentors = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    const user = localStorage.getItem('kalasetu_user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      fetchData(parsedUser.uid);
    } else {
      setIsLoading(false);
    }
    
    async function fetchData(uid: string) {
      try {
        const result = await getConnectedMentors(uid);
        setMentors(result);
      } catch (error) {
        toast({ title: "Error", description: "Could not load your mentors.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  }, []);
  
  const startChat = (mentor: Mentor) => {
    const chatContext = {
        recipientUid: mentor.uid,
        recipientName: mentor.name,
        message: `Hi ${mentor.name}!`
    };
    localStorage.setItem('chat_context', JSON.stringify(chatContext));
    navigate('/chat');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Mentors</h1>
        <p className="text-muted-foreground mt-2">Your network of trusted advisors.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.length > 0 ? mentors.map(mentor => (
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
            <CardContent className="flex-1">
              <p className="text-muted-foreground text-sm">{mentor.bio || "No bio available."}</p>
            </CardContent>
            <div className="p-6 pt-0">
                <Button onClick={() => startChat(mentor)} className="w-full"><MessageSquare className="mr-2 h-4 w-4"/>Start Chat</Button>
            </div>
          </Card>
        )) : (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold">No Mentors Yet</h3>
              <p className="text-muted-foreground">Use the 'Discover Mentors' page to find and connect with an expert.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyMentors;