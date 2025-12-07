import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, Hash, Send, Loader2, ArrowLeft, Handshake, Copy, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  listCommunities, joinCommunity, leaveCommunity, getCommunityDetails,
  getChannelPosts, postInChannel, getCommunityMembers, sendCollab, createCommunity
} from "@/lib/api";

// --- Type Definitions ---
interface User {
  uid: string;
  name: string;
  role: 'artisan' | 'mentor' | 'investor';
}

interface CommunityMember extends User {}
interface Community { id: string; name: string; description: string; member_count: number; members: string[]; skill_tags: string[]; }
interface Channel { id: string; name: string; }
interface CommunityDetails extends Community { channels: Channel[]; }
interface Post { id: string; author_name: string; message: string; }

export default function Communities() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState({ page: true, modal: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [view, setView] = useState<'list' | 'community'>('list');
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityDetails | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [channelPosts, setChannelPosts] = useState<Post[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [currentCommunityMembers, setCurrentCommunityMembers] = useState<CommunityMember[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCommunityData, setNewCommunityData] = useState({ name: '', description: '', skills: '' });

  useEffect(() => {
    const user = localStorage.getItem('kalasetu_user');
    if (user) setCurrentUser(JSON.parse(user));
    fetchCommunityList();
  }, []);

  const fetchCommunityList = async () => {
    if (!isLoading.page) setIsLoading(prev => ({ ...prev, page: true }));
    try {
      const communities = await listCommunities();
      setAllCommunities(communities);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch communities.", variant: "destructive" });
    } finally {
      setIsLoading(prev => ({ ...prev, page: false }));
    }
  };

  useEffect(() => {
    if (!selectedCommunity || !selectedChannelId) return;
    const fetchPosts = async () => {
      try {
        const posts = await getChannelPosts(selectedCommunity.id, selectedChannelId);
        setChannelPosts(posts);
      } catch (error) { toast({ title: "Error", description: "Could not load messages.", variant: "destructive" }); }
    };
    fetchPosts();
  }, [selectedChannelId, selectedCommunity]);

  const handleJoinLeave = async (communityId: string, action: 'join' | 'leave') => {
    if (!currentUser) return;
    await (action === 'join' ? joinCommunity(currentUser.uid, communityId) : leaveCommunity(currentUser.uid, communityId));
    fetchCommunityList();
  };

  const handleEnterCommunity = async (communityId: string) => {
    setIsLoading(prev => ({ ...prev, page: true }));
    try {
      const details = await getCommunityDetails(communityId);
      setSelectedCommunity(details);
      if (details.channels?.[0]) setSelectedChannelId(details.channels[0].id);
      setView('community');
    } catch (error) {
      toast({ title: "Error", description: "Could not load community details.", variant: "destructive" });
    } finally {
      setIsLoading(prev => ({ ...prev, page: false }));
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedCommunity || !selectedChannelId) return;
    try {
      await postInChannel(selectedCommunity.id, selectedChannelId, currentUser.uid, newMessage);
      setNewMessage('');
      const posts = await getChannelPosts(selectedCommunity.id, selectedChannelId);
      setChannelPosts(posts);
    } catch (error) { toast({ title: "Error", description: "Could not send message.", variant: "destructive" }); }
  };
  
  const handleViewMembers = async (communityId: string) => {
      setIsLoading(prev => ({...prev, modal: true}));
      setIsMembersModalOpen(true);
      try {
          const members = await getCommunityMembers(communityId);
          setCurrentCommunityMembers(members);
      } catch (error) { toast({title: "Error", description: "Could not fetch members.", variant: "destructive"}); } 
      finally { setIsLoading(prev => ({...prev, modal: false})); }
  };

  const handleSendCollabFromModal = async (member: CommunityMember) => {
      if (!currentUser) return;
      const message = prompt(`Send a collaboration request to ${member.name}:`, "I saw you in the community and would like to collaborate!");
      if (message) {
          try {
              await sendCollab(currentUser.uid, member.uid, message);
              toast({title: "Success", description: `Collaboration request sent to ${member.name}!`});
              setIsMembersModalOpen(false);
          } catch (error) { toast({title: "Error", description: "Could not send request.", variant: "destructive"}); }
      }
  };
  
  const handleCopyUid = (member: CommunityMember) => {
      navigator.clipboard.writeText(member.uid);
      toast({title: "Copied!", description: `UID for ${member.name} copied to clipboard.`});
  }

  const handleCreateCommunity = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      try {
          await createCommunity(currentUser.uid, {
              name: newCommunityData.name,
              description: newCommunityData.description,
              skill_tags: newCommunityData.skills.split(',').map(s => s.trim())
          });
          toast({title: "Success", description: "Community created!"});
          setIsCreateModalOpen(false);
          fetchCommunityList();
      } catch (error: any) {
          toast({title: "Error", description: error.message || "Could not create community", variant: "destructive"});
      }
  }

  const filteredCommunities = allCommunities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Communities</h1>
            <p className="text-muted-foreground">Join communities to connect, learn, and share.</p>
          </div>
          {currentUser?.role === 'mentor' && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild><Button className="btn-hero text-white"><Plus className="mr-2 h-4 w-4"/>Create Community</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create a New Community</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateCommunity} className="space-y-4">
                        <div><Label htmlFor="c-name">Community Name</Label><Input id="c-name" value={newCommunityData.name} onChange={e => setNewCommunityData(p => ({...p, name: e.target.value}))}/></div>
                        <div><Label htmlFor="c-desc">Description</Label><Textarea id="c-desc" value={newCommunityData.description} onChange={e => setNewCommunityData(p => ({...p, description: e.target.value}))}/></div>
                        <div><Label htmlFor="c-skills">Skill Tags (comma-separated)</Label><Input id="c-skills" value={newCommunityData.skills} onChange={e => setNewCommunityData(p => ({...p, skills: e.target.value}))}/></div>
                        <div className="flex justify-end"><Button type="submit">Create</Button></div>
                    </form>
                </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" /><Input placeholder="Search communities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div>
        {isLoading.page ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => {
            const isJoined = currentUser ? community.members.includes(currentUser.uid) : false;
            return (
              <Card key={community.id} className="card-elevated hover:shadow-lg flex flex-col">
                <CardHeader><CardTitle className="text-lg">{community.name}</CardTitle></CardHeader>
                <CardContent className="flex-1"><p className="text-muted-foreground text-sm min-h-[40px]">{community.description}</p></CardContent>
                <div className="p-6 pt-0 space-y-3">
                    <div className="flex items-center text-muted-foreground space-x-2"><Users className="h-4 w-4" /><span className="text-sm">{community.member_count} members</span></div>
                    <div className="flex space-x-2">
                        {isJoined ? (
                            <>
                                <Button size="sm" onClick={() => handleEnterCommunity(community.id)} className="flex-1 btn-hero text-white">Enter</Button>
                                <Button size="sm" variant="outline" onClick={() => handleViewMembers(community.id)}>Members</Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleJoinLeave(community.id, 'leave')}>Leave</Button>
                            </>
                        ) : (
                            <Button size="sm" onClick={() => handleJoinLeave(community.id, 'join')} className="w-full btn-hero text-white">Join</Button>
                        )}
                    </div>
                </div>
              </Card>
            )
          })}
        </div>}
        <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Community Members</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {isLoading.modal ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                    currentCommunityMembers.map(member => (
                        <div key={member.uid} className="flex items-center justify-between p-2 border rounded-md">
                            <span className="font-medium">{member.name}</span>
                            {currentUser && currentUser.uid !== member.uid ? 
                                <div className="flex items-center space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handleSendCollabFromModal(member)}><Handshake className="mr-2 h-4 w-4"/>Collaborate</Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleCopyUid(member)}><Copy className="h-4 w-4"/></Button>
                                </div>
                                : <span className="text-xs text-muted-foreground">(You)</span>
                            }
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Detailed Chat View
  return (
    <div className="h-[calc(100vh-12rem)] flex bg-card rounded-lg border overflow-hidden animate-fade-in">
      {isLoading.page || !selectedCommunity ? <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
        <>
            <div className="w-64 bg-muted/30 border-r flex flex-col">
                <div className="p-4 border-b"><Button variant="ghost" size="sm" onClick={() => setView('list')} className="mb-2 text-muted-foreground"><ArrowLeft className="h-4 w-4 mr-2" /> All Communities</Button><h3 className="font-semibold">{selectedCommunity.name}</h3></div>
                <div className="flex-1 p-4 space-y-2">
                    {selectedCommunity.channels.map((channel) => (
                        <button key={channel.id} onClick={() => setSelectedChannelId(channel.id)} className={`w-full text-left p-2 rounded-md flex items-center space-x-2 ${selectedChannelId === channel.id ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted'}`}><Hash className="h-4 w-4" /><span>{channel.name}</span></button>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {channelPosts.map((post) => (
                        <div key={post.id} className="flex space-x-3">
                            <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary text-white text-sm">{post.author_name.charAt(0)}</AvatarFallback></Avatar>
                            <div><span className="font-medium text-sm">{post.author_name}</span><p>{post.message}</p></div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t bg-card">
                    <div className="flex space-x-2">
                        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`Message #${selectedCommunity.channels.find(c => c.id === selectedChannelId)?.name}`} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                        <Button onClick={handleSendMessage} className="btn-hero text-white"><Send className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>
        </>
      }
    </div>
  );
}