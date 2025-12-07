import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image, Lightbulb, Banknote } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateImage, getIdeas, getSchemes } from "@/lib/api";

// --- Type Definitions ---
interface User {
  uid: string;
}

interface Scheme {
  name: string;
  desc: string;
}

// --- Sub-component for the Image Generator Tab ---
const ImageGeneratorTab = ({ currentUser }: { currentUser: User }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<{ url?: string; error?: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setResult(null);
    try {
      const apiResult = await generateImage(currentUser.uid, prompt);
      setResult(apiResult);
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate image.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Image Generator</h3>
      <p className="text-muted-foreground text-sm">Create a mockup image from a text description.</p>
      <Textarea
        placeholder="e.g., 'A hand-woven blue scarf with a geometric pattern'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Image className="mr-2 h-4 w-4" />}
        {isLoading ? "Generating..." : "Generate Image"}
      </Button>
      {result && (
        <div className="p-4 border rounded-lg mt-4">
          {result.url ? (
            <img src={result.url} alt={prompt} className="rounded-lg max-w-full mx-auto" />
          ) : (
            <p className="text-destructive">{result.error || "An unknown error occurred."}</p>
          )}
        </div>
      )}
    </div>
  );
};

// --- Sub-component for the Business Ideas Tab ---
const BusinessIdeasTab = ({ currentUser }: { currentUser: User }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [ideas, setIdeas] = useState<string[]>([]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setIdeas([]);
        try {
            const result = await getIdeas(currentUser.uid);
            setIdeas(result);
        } catch (error) {
            toast({ title: "Error", description: "Could not generate ideas.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Idea Generator</h3>
            <p className="text-muted-foreground text-sm">Generate new business ideas based on your skills and profile.</p>
            <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                {isLoading ? "Generating..." : "Generate New Ideas"}
            </Button>
            {ideas.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                    {ideas.map((idea, index) => (
                    <div key={index} className="p-4 bg-muted rounded-lg text-sm">{idea}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Sub-component for the Government Schemes Tab ---
const GovSchemesTab = ({ currentUser }: { currentUser: User }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [hasFetched, setHasFetched] = useState(false);

    const handleFetch = async () => {
        setIsLoading(true);
        setHasFetched(true);
        try {
            const result = await getSchemes(currentUser.uid);
            setSchemes(result);
        } catch (error) {
            toast({ title: "Error", description: "Could not fetch schemes.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Government Schemes Finder</h3>
            <p className="text-muted-foreground text-sm">Find government schemes tailored to your profile.</p>
            {!hasFetched && (
                <Button onClick={handleFetch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                    Find Relevant Schemes
                </Button>
            )}
            {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {hasFetched && !isLoading && (
                <div className="space-y-4 pt-4">
                {schemes.length > 0 ? schemes.map((scheme, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold">{scheme.name}</h4>
                        <p className="text-muted-foreground text-sm mt-1">{scheme.desc}</p>
                    </div>
                )) : <p className="text-muted-foreground">Could not find any relevant schemes at this time.</p>}
                </div>
            )}
        </div>
    );
};


// --- Main AI Tools Page Component ---
const AITools = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('kalasetu_user');
    if (user) setCurrentUser(JSON.parse(user));
  }, []);

  if (!currentUser) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h1 className="text-3xl font-bold text-foreground">AI-Powered Tools</h1>
            <p className="text-muted-foreground mt-2">Enhance your workflow with our suite of AI tools.</p>
        </div>

        <Tabs defaultValue="ideas" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ideas"><Lightbulb className="mr-2 h-4 w-4"/>Business Ideas</TabsTrigger>
                <TabsTrigger value="image"><Image className="mr-2 h-4 w-4"/>Image Generator</TabsTrigger>
                <TabsTrigger value="schemes"><Banknote className="mr-2 h-4 w-4"/>Gov Schemes</TabsTrigger>
            </TabsList>
            <Card className="mt-4 card-elevated">
                <CardContent className="p-6">
                    <TabsContent value="ideas"><BusinessIdeasTab currentUser={currentUser} /></TabsContent>
                    <TabsContent value="image"><ImageGeneratorTab currentUser={currentUser} /></TabsContent>
                    <TabsContent value="schemes"><GovSchemesTab currentUser={currentUser} /></TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    </div>
  );
};

export default AITools;