import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Plus, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getConversations, getChat, sendMessage as apiSendMessage } from "@/lib/api";

// --- Type Definitions ---
interface User {
  uid: string;
  name: string;
}
interface Conversation {
  chat_id: string;
  last_message_content: string;
  other_user: {
    uid: string;
    name: string;
    role: string;
  };
}
interface Message {
  id: string;
  content: string;
  sender_uid: string;
  timestamp: string;
}

export default function Chat() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState({ conversations: true, messages: false });
  const [newMessage, setNewMessage] = useState('');
  const [newChatUID, setNewChatUID] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async (uid: string) => {
    setIsLoading(prev => ({ ...prev, conversations: true }));
    try {
      const convos = await getConversations(uid);
      setConversations(convos);
      return convos; // Return for immediate use
    } catch (error) {
      toast({ title: "Error", description: "Could not load conversations.", variant: "destructive" });
      return []; // Return empty array on error
    } finally {
      setIsLoading(prev => ({ ...prev, conversations: false }));
    }
  };
  
  // This useEffect now correctly handles the chat context from other pages
  useEffect(() => {
    const userFromStorage = localStorage.getItem('kalasetu_user');
    if (userFromStorage) {
      const parsedUser = JSON.parse(userFromStorage);
      setCurrentUser(parsedUser);
      
      const initializeChat = async () => {
        const convos = await fetchConversations(parsedUser.uid);
        const context = localStorage.getItem('chat_context');

        // THIS IS THE CRUCIAL LOGIC THAT WAS MISSING
        if (context) {
          localStorage.removeItem('chat_context');
          const { recipientUid, message } = JSON.parse(context);
          
          const existingConvo = convos.find(c => c.other_user?.uid === recipientUid);
          if(existingConvo) {
            setSelectedChat(existingConvo);
          } else {
            try {
                const result = await apiSendMessage(parsedUser.uid, recipientUid, message);
                const newConvos = await fetchConversations(parsedUser.uid);
                const newChat = newConvos.find(c => c.chat_id === result.chat_id);
                if (newChat) setSelectedChat(newChat);
            } catch (err) {
                toast({title: "Error", description: "Could not start chat.", variant: "destructive"});
            }
          }
        }
      };
      initializeChat();

    } else {
      setIsLoading(prev => ({ ...prev, conversations: false }));
    }
  }, []);

  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    const fetchMessages = async () => {
      try {
        const fetchedMessages = await getChat(currentUser.uid, selectedChat.chat_id);
        setMessages(fetchedMessages);
      } catch (error) { console.error("Failed to fetch messages", error); }
    };
    
    setIsLoading(prev => ({...prev, messages: true}));
    fetchMessages().finally(() => setIsLoading(prev => ({...prev, messages: false})));
    
    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
  }, [selectedChat, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectChat = (chat: Conversation) => {
    setMessages([]);
    setSelectedChat(chat);
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedChat) return;
    const recipientUid = selectedChat.other_user.uid;
    try {
      await apiSendMessage(currentUser.uid, recipientUid, newMessage);
      setNewMessage('');
      const tempMessage: Message = { id: Date.now().toString(), content: newMessage, sender_uid: currentUser.uid, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, tempMessage]);
      if (currentUser) fetchConversations(currentUser.uid);
    } catch (error) {
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    }
  };

  const handleStartNewChat = async () => {
    if (!newChatUID.trim() || !currentUser) return;
    try {
      await apiSendMessage(currentUser.uid, newChatUID.trim(), `Hi! I've started a chat with you.`);
      setNewChatUID('');
      setIsDialogOpen(false);
      fetchConversations(currentUser.uid);
      toast({ title: "Chat Started!", description: "Your new conversation has been created." });
    } catch (error) {
      toast({ title: "Error", description: "Could not start chat. Please check the User ID.", variant: "destructive" });
    }
  };
  
  const filteredChats = conversations.filter(chat =>
    chat.other_user && chat.other_user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-card rounded-lg border border-border overflow-hidden animate-fade-in">
      <div className="w-80 bg-muted/30 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="btn-hero text-white"><Plus className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Start New Chat</DialogTitle></DialogHeader>
                <Label htmlFor="uid">User ID</Label>
                <Input id="uid" value={newChatUID} onChange={(e) => setNewChatUID(e.target.value)} placeholder="Enter user ID to start chatting..."/>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleStartNewChat} className="btn-hero text-white">Start Chat</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search conversations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading.conversations ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div> :
            filteredChats.map((chat) => (
            <button key={chat.chat_id} onClick={() => handleSelectChat(chat)} className={`w-full p-4 border-b text-left hover:bg-muted/50 ${selectedChat?.chat_id === chat.chat_id ? 'bg-primary-soft/20 border-l-4 border-l-primary' : ''}`}>
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10"><AvatarFallback className="bg-primary text-white">{chat.other_user.name.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{chat.other_user.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{chat.last_message_content}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b bg-card">
              <h3 className="font-semibold">{selectedChat.other_user.name}</h3>
              <Badge variant="outline" className="text-xs capitalize">{selectedChat.other_user.role}</Badge>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {isLoading.messages ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div> :
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender_uid === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${message.sender_uid === currentUser?.uid ? 'bg-primary text-white' : 'bg-muted'}`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-card">
              <div className="flex space-x-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}/>
                <Button onClick={handleSendMessage} className="btn-hero text-white"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No chat selected</h3>
              <p className="text-muted-foreground">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}