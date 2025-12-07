import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown, MessageSquare, Plus, Search, TrendingUp, Clock, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// --- NEW IMPORTS ---
import { getForumPosts, voteOnPost, createForumPost, deleteForumPost } from "@/lib/api";

// --- UPDATED TYPE DEFINITION to match backend data ---
interface Post {
  id: string;
  title: string;
  body: string;
  author_name: string;
  author_uid: string;
  score: number;
  // comments are not in the backend data yet, so we'll make it optional
  comments?: number;
  timestamp: string; // The backend provides this, but we'll format it.
  // tags are not in the backend data yet, so we'll make it optional
  tags?: string[];
  votes: { [key: string]: number }; // e.g., { "some-uid": 1, "another-uid": -1 }
}

interface User {
  uid: string;
  name: string;
  role: string;
}

export default function Forum() {
  const { toast } = useToast();
  // --- STATE MANAGEMENT ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // UI State remains the same
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [newPost, setNewPost] = useState({ title: '', body: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    const userFromStorage = localStorage.getItem('kalasetu_user');
    if (userFromStorage) {
      setCurrentUser(JSON.parse(userFromStorage));
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortBy]); // Refetch when sortBy changes

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await getForumPosts(sortBy);
      setPosts(fetchedPosts);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch forum posts.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- MODIFIED ACTIONS ---
  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!currentUser) {
      toast({ title: "Please log in", description: "You must be logged in to vote.", variant: "destructive" });
      return;
    }
    try {
      await voteOnPost(postId, currentUser.uid, voteType);
      fetchPosts(); // Refetch to show updated score
    } catch (error) {
      toast({ title: "Vote failed", description: "Your vote could not be recorded.", variant: "destructive" });
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) {
      toast({ title: "Please log in", description: "You must be logged in to post.", variant: "destructive" });
      return;
    }
    if (newPost.title && newPost.body) {
      try {
        await createForumPost(currentUser.uid, { title: newPost.title, content: newPost.body });
        setNewPost({ title: '', body: '' });
        setIsDialogOpen(false);
        setSortBy('new'); // Switch to 'new' to see the post at the top
        await fetchPosts(); // Refetch posts
        toast({ title: "Success!", description: "Your post has been created." });
      } catch (error) {
        toast({ title: "Error", description: "Could not create your post.", variant: "destructive" });
      }
    }
  };

  const handleDelete = async (postId: string) => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to delete this post?")) {
        try {
            await deleteForumPost(postId, currentUser.uid);
            fetchPosts(); // Refetch
            toast({ title: "Post Deleted", description: "Your post has been removed." });
        } catch (error) {
            toast({ title: "Error", description: "Could not delete the post.", variant: "destructive" });
        }
    }
  };


  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Forum</h1>
          <p className="text-muted-foreground">Share knowledge, ask questions, and connect</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-hero text-white"><Plus className="mr-2 h-4 w-4" />New Post</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Post</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={newPost.title} onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="body">Description</Label>
                <Textarea id="body" value={newPost.body} onChange={(e) => setNewPost(prev => ({ ...prev, body: e.target.value }))} className="min-h-[120px]" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreatePost} className="btn-hero text-white">Create Post</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search posts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'new' | 'top')}>
          <TabsList>
            <TabsTrigger value="new"><Clock className="h-4 w-4 mr-2" />New</TabsTrigger>
            <TabsTrigger value="top"><TrendingUp className="h-4 w-4 mr-2" />Top</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.length > 0 ? filteredPosts.map((post) => {
            const userVote = currentUser ? post.votes?.[currentUser.uid] : 0; // 1 for up, -1 for down
            return (
              <Card key={post.id} className="card-elevated">
                <CardContent className="p-6 flex space-x-4">
                  <div className="flex flex-col items-center space-y-1">
                    <Button variant="ghost" size="sm" onClick={() => handleVote(post.id, 'up')} className={`p-1 ${userVote === 1 ? 'text-primary bg-primary-soft' : 'text-muted-foreground'}`}><ChevronUp className="h-5 w-5" /></Button>
                    <span className="font-semibold">{post.score}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleVote(post.id, 'down')} className={`p-1 ${userVote === -1 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'}`}><ChevronDown className="h-5 w-5" /></Button>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold text-foreground">{post.title}</h3>
                    <p className="text-muted-foreground mt-2 leading-relaxed">{post.body}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6"><AvatarFallback className="bg-primary text-white text-xs">{post.author_name?.charAt(0)}</AvatarFallback></Avatar>
                        <span>{post.author_name}</span>
                      </div>
                      {currentUser?.uid === post.author_uid && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="h-4 w-4 mr-2"/> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          }) : (
            <Card className="card-elevated"><CardContent className="p-12 text-center"><MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold">No posts found</h3><p className="text-muted-foreground">Be the first to start a discussion!</p></CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}