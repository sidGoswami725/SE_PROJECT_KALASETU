// src/Auth.tsx

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- NEW IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { signup as createProfileInBackend } from "@/lib/api"; // Importing our backend signup function

// --- FIREBASE CONFIGURATION ---
// This should be the same config from your original index.js
const firebaseConfig = {
  apiKey: "AIzaSyBxfomUQJ4KchZZp6r1fvWXX9VVGleB7nw",
  authDomain: "kalasetu-23d1a.firebaseapp.com",
  projectId: "kalasetu-23d1a",
  storageBucket: "kalasetu-23d1a.firebasestorage.app",
  messagingSenderId: "910306415360",
  appId: "1:910306415360:web:d7fb45ec830d8b22c6d9e5",
  measurementId: "G-H3X513VJNL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mode = searchParams.get('mode') || 'signin';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- MODIFIED: Renamed fullName to name for consistency with backend ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'artisan' // Default role
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- REPLACED: handleSubmit function with real logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === 'signup') {
      // Validation from your original component
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.role) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // 2. Prepare profile data for our backend
        const profileData = {
          uid: user.uid,
          name: formData.name,
          email: formData.email,
        };

        // 3. Create profile in our Firestore DB via our Flask backend
        await createProfileInBackend(formData.role, profileData);

        toast({ title: "Account Created!", description: "Your KalaSetu journey begins now. Please sign in." });
        navigate('/auth?mode=signin'); // Redirect to signin after successful signup

      } catch (error: any) {
        toast({ title: "Signup Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }

    } else { // Signin mode
      if (!formData.email || !formData.password) {
          toast({ title: "Missing Fields", description: "Please enter email and password.", variant: "destructive" });
          setIsLoading(false);
          return;
      }
      try {
        // 1. Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // We need to know the user's role. For now, we'll ask them.
        // In a real app, you might fetch this from your backend after login.
        // For simplicity, we are using the role selected in the UI.
        const roleToLogin = formData.role;
        
        // 2. Save session info to localStorage
        const userSession = {
          uid: user.uid,
          name: user.displayName || formData.name || user.email?.split('@')[0],
          email: user.email,
          role: roleToLogin
        };
        localStorage.setItem('kalasetu_user', JSON.stringify(userSession));
        
        toast({ title: "Welcome Back!", description: "Successfully signed in" });
        
        // 3. Navigate to dashboard
        navigate('/dashboard');

      } catch (error: any) {
        toast({ title: "Signin Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="card-elevated gradient-card border-primary/10">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {mode === 'signup' ? 'Join KalaSetu' : 'Welcome Back'}
            </CardTitle>
            <p className="text-muted-foreground">
              {mode === 'signup' 
                ? 'Start your journey from artisan to entrepreneur' 
                : 'Continue your journey to success'
              }
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="border-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="border-primary/20 focus:border-primary pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {mode === 'signup' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className="border-primary/20 focus:border-primary pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger className="border-primary/20 focus:border-primary">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artisan">Artisan</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                // --- ADDED: Role selector for signin for simplicity ---
                 <div className="space-y-2">
                    <Label htmlFor="role">I am a...</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger className="border-primary/20 focus:border-primary">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artisan">Artisan</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              )}

              <Button 
                type="submit" 
                className="w-full btn-hero text-white py-6"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-muted-foreground">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                <Button
                  variant="link"
                  onClick={() => navigate(`/auth?mode=${mode === 'signup' ? 'signin' : 'signup'}`)}
                  className="text-primary ml-1 p-0 h-auto"
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}