import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Lightbulb, GraduationCap, DollarSign, Store, Users, Target, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const journeySteps = [
    {
      icon: Lightbulb,
      title: "Idea",
      description: "Transform your creative vision into viable product concepts with AI-powered tools",
    },
    {
      icon: GraduationCap, 
      title: "Training",
      description: "Connect with expert mentors who guide your skill development journey",
    },
    {
      icon: DollarSign,
      title: "Funding",
      description: "Access investors who believe in artisan innovation and sustainable growth",
    },
    {
      icon: Store,
      title: "Market Access",
      description: "Launch your business with comprehensive support and community backing",
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Expert Mentorship",
      description: "Connect with industry professionals who understand your craft",
    },
    {
      icon: Target,
      title: "AI-Powered Tools",
      description: "Generate ideas, create mockups, and optimize your business strategy",
    },
    {
      icon: Rocket,
      title: "Investor Network",
      description: "Access funding opportunities tailored for artisan entrepreneurs",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-2xl font-bold text-foreground">KalaSetu</span>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth?mode=signin')}
                className="hover:bg-primary-soft/50"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/auth?mode=signup')}
                className="btn-hero text-white"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              Kala<span className="gradient-hero bg-clip-text text-transparent">Setu</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              Bridge Your Skills to Success
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              An ecosystem platform that empowers artisans by connecting them with mentors and investors. 
              Transform your craft into a sustainable business through our guided journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth?mode=signup')}
                className="btn-hero text-white px-8 py-6 text-lg"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/auth?mode=signin')}
                className="px-8 py-6 text-lg border-primary text-primary hover:bg-primary-soft/20"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How KalaSetu Works */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold text-foreground mb-6">How KalaSetu Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your journey from creative idea to successful business, supported every step of the way
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {journeySteps.map((step, index) => (
              <Card key={index} className="card-elevated gradient-card border-primary/10 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">Why Choose KalaSetu?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to transform your artisan skills into a thriving business
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="w-20 h-20 gradient-hero rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 gradient-hero">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Bridge Your Skills to Success?</h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of artisans who have transformed their passion into profitable businesses
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth?mode=signup')}
            className="bg-white text-primary hover:bg-white/90 px-12 py-6 text-lg font-semibold"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-2xl font-bold text-foreground">KalaSetu</span>
            </div>
            <p className="text-muted-foreground">
              © 2025 KalaSetu by DALL-Eminators. Empowering artisans worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}