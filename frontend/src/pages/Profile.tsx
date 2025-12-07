// src/pages/Profile.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Edit, Save, X, Loader2 } from "lucide-react"; // Added Loader2 icon
import { useToast } from "@/hooks/use-toast";

// --- NEW IMPORTS ---
// Importing the functions we need from our api.js file
import { getProfile, updateProfile, getUserPosts, getUserCommunities } from "@/lib/api";

// --- NEW TYPE DEFINITIONS ---
// These types match the data structure from your backend
interface LoggedInUser {
  uid: string;
  name: string;
  email: string;
  role: 'artisan' | 'mentor' | 'investor';
}

interface ProfileData {
  name: string;
  email: string;
  bio: string;
  skills?: string[];
  expertise?: string[];
  interests?: string[];
  [key: string]: any; // Allows for dynamic key access
}

interface Post {
  title: string;
  body: string;
  likes: number;
}

interface Community {
  name: string;
  member_count: number;
}


export default function Profile() {
  const { toast } = useToast();
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For loading state
  
  // State for data fetched from the backend
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  
  // A temporary state to hold edits
  const [editData, setEditData] = useState<ProfileData | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    // Function to get user info from localStorage
    const getLoggedInUser = () => {
      const userData = localStorage.getItem('kalasetu_user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        return parsedUser; // Return for immediate use
      }
      return null;
    };

    // Main data fetching function
    const fetchData = async (currentUser: LoggedInUser) => {
      try {
        setIsLoading(true);
        // Fetch all data in parallel, just like in the original dashboard.js
        const [profile, userPosts, userCommunities] = await Promise.all([
          getProfile(currentUser.role, currentUser.uid),
          getUserPosts(currentUser.uid),
          getUserCommunities(currentUser.uid)
        ]);

        setProfileData(profile);
        setPosts(userPosts);
        setCommunities(userCommunities);

      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        toast({
          title: "Error",
          description: "Could not load your profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const currentUser = getLoggedInUser();
    if (currentUser) {
      fetchData(currentUser);
    } else {
      setIsLoading(false); // No user found
    }
  }, [toast]); // Dependency array ensures this runs once on mount


  // --- EVENT HANDLERS ---
  const handleEdit = () => {
    setEditData(profileData); // Copy current profile data to edit state
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user || !editData) return;
    
    // Determine the correct key for skills/expertise/interests
    const skillsKey = user.role === 'mentor' ? 'expertise' : (user.role === 'investor' ? 'interests' : 'skills');
    
    // Prepare the update payload
    const updates: Partial<ProfileData> = {
      name: editData.name,
      bio: editData.bio,
      [skillsKey]: editData[skillsKey] // This can be an array or a string, your backend handles it
    };

    try {
      await updateProfile(user.role, user.uid, updates);
      setProfileData(editData); // Update the main profile data with the edits
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: "Could not save your changes.",
        variant: "destructive",
      });
    }
  };
  
  // --- DYNAMIC DATA GETTERS ---
  // Functions to handle role-specific fields (skills, expertise, interests)
  const getSkillsKey = (): keyof ProfileData => {
    if (!user) return 'skills';
    switch (user.role) {
      case 'mentor': return 'expertise';
      case 'investor': return 'interests';
      default: return 'skills';
    }
  };

  const getSkillsLabel = () => {
    if (!user) return 'Skills';
    switch (user.role) {
      case 'mentor': return 'Expertise';
      case 'investor': return 'Interests';
      default: return 'Skills';
    }
  };

  // --- LOADING AND ERROR STATES ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Your Profile...</p>
      </div>
    );
  }

  if (!user || !profileData) {
    return <div className="p-8 text-center text-muted-foreground">Could not load profile. Please try logging in again.</div>;
  }

  // Use `editData` if editing, otherwise `profileData`
  const displayData = isEditing ? editData : profileData;
  if (!displayData) return null; // Should not happen, but for type safety

  const skillsKey = getSkillsKey();
  const currentSkills = displayData[skillsKey] || [];
  const skillsAsString = Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills;


  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <div>
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="btn-hero text-white">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} className="ml-2">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card className="card-elevated gradient-card border-primary/10">
        <CardContent className="p-8">
          <div className="flex items-start space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-primary text-white text-2xl">
                {displayData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name"
                    value={editData?.name || ''}
                    onChange={(e) => setEditData(prev => prev ? {...prev, name: e.target.value} : null)}
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{displayData.name}</h2>
                  <Badge className="bg-primary-soft text-primary capitalize">{user.role}</Badge>
                </div>
              )}
              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{displayData.email}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio Section */}
      <Card className="card-elevated">
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editData?.bio || ''}
              onChange={(e) => setEditData(prev => prev ? { ...prev, bio: e.target.value } : null)}
              placeholder="Tell us about yourself..."
              className="min-h-[120px]"
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed">{displayData.bio || "No bio set."}</p>
          )}
        </CardContent>
      </Card>

      {/* Skills/Expertise/Interests */}
      <Card className="card-elevated">
        <CardHeader><CardTitle>{getSkillsLabel()}</CardTitle></CardHeader>
        <CardContent>
          {isEditing ? (
             <div>
                <Label>Skills (comma-separated)</Label>
                <Input
                    value={skillsAsString}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, [skillsKey]: e.target.value.split(',').map(s => s.trim()) } : null)}
                />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentSkills.length > 0 ? currentSkills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-sm">{skill}</Badge>
              )) : <p className="text-sm text-muted-foreground">No skills listed.</p>}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Activity Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-elevated">
          <CardHeader><CardTitle>Forum Activity</CardTitle></CardHeader>
          <CardContent>
            {posts.length > 0 ? (
              <div className="space-y-3">
                {posts.slice(0, 3).map((post, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold truncate">{post.title}</p>
                    <p className="text-sm text-muted-foreground">{post.body.substring(0, 60)}...</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No forum posts yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle>My Communities</CardTitle></CardHeader>
          <CardContent>
            {communities.length > 0 ? (
              <div className="space-y-3">
                {communities.slice(0, 3).map((comm, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-semibold">{comm.name}</span>
                    <Badge variant="secondary">{comm.member_count} members</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Not a member of any communities yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}