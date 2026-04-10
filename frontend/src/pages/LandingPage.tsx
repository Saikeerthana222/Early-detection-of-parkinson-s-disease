import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, Brain, Clock, Users, ArrowRight, Shield, FileCheck, HeartPulse } from 'lucide-react';
import heroImage from '@/assets/hero-medical.jpg';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">PD Detection System</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#research" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Research
            </a>
          </nav>
          <Link to="/assessment">
            <Button size="sm">Start Assessment</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        
        <div className="container relative z-10 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <HeartPulse className="h-4 w-4" />
              <span>Advanced Neurological Screening</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-slide-up">
              Parkinson's Disease{' '}
              <span className="gradient-text">Early Detection</span>{' '}
              System
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Advanced handwriting analysis for early diagnosis. Detect subtle motor changes 
              years before traditional symptoms appear.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/assessment">
                <Button size="lg" className="gap-2 px-8 h-12 text-base">
                  Start Assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#about">
                <Button variant="outline" size="lg" className="h-12 text-base">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-card border-y">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">10M+</div>
              <p className="text-muted-foreground">People worldwide affected by Parkinson's Disease</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mx-auto mb-4">
                <Activity className="h-7 w-7 text-success" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">70%</div>
              <p className="text-muted-foreground">Improved outcomes with early detection and intervention</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-warning/10 mx-auto mb-4">
                <Clock className="h-7 w-7 text-warning" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">2-5 Years</div>
              <p className="text-muted-foreground">Handwriting changes appear before motor symptoms</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Parkinson's Section */}
      <section id="about" className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Understanding Parkinson's Disease
            </h2>
            
            <div className="space-y-8">
              <div className="medical-card-elevated">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  What is Parkinson's Disease?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Parkinson's disease is a progressive neurological disorder that affects movement. 
                  It occurs when nerve cells in the brain don't produce enough dopamine, a chemical 
                  messenger that helps control movement. The condition typically develops gradually, 
                  often starting with barely noticeable tremors in one hand.
                </p>
              </div>
              
              <div className="medical-card-elevated">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Early Symptoms and Warning Signs
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Early warning signs can be subtle and may include: small handwriting (micrographia), 
                  tremors or shaking in fingers, hands, or chin, stiffness in arms or legs, 
                  slow movement (bradykinesia), changes in speech patterns, and decreased facial 
                  expressions. These symptoms often appear on one side of the body initially.
                </p>
              </div>
              
              <div className="medical-card-elevated">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Importance of Early Detection
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Early detection of Parkinson's disease is crucial for better treatment outcomes. 
                  When diagnosed early, patients can begin therapies that may slow disease progression, 
                  maintain quality of life longer, and plan for future care needs. Research shows that 
                  early intervention can delay the onset of more severe symptoms by several years.
                </p>
              </div>
              
              <div className="medical-card-elevated">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Handwriting Analysis for Detection
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Changes in handwriting are among the earliest detectable signs of Parkinson's disease, 
                  often appearing 2-5 years before motor symptoms become clinically evident. Our system 
                  analyzes spiral drawings and handwriting samples to detect subtle tremors, micrographia, 
                  and motor control irregularities that may indicate early-stage Parkinson's disease.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-card">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Our assessment uses advanced pattern recognition to analyze your handwriting 
            and drawing samples for early signs of Parkinson's disease.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Complete Drawing Tasks</h3>
              <p className="text-muted-foreground text-sm">
                Draw spirals, write sentences, and complete simple motor tasks on paper
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Upload Images</h3>
              <p className="text-muted-foreground text-sm">
                Take clear photos of your drawings and upload them to our secure platform
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Get Results</h3>
              <p className="text-muted-foreground text-sm">
                Receive a detailed analysis with risk assessment and personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Research Section */}
      <section id="research" className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Developed Using Clinical Research
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Our detection system is built on peer-reviewed research and clinical studies 
              in handwriting analysis for Parkinson's disease detection. The analysis algorithms 
              have been validated against clinical diagnoses to ensure accuracy and reliability.
            </p>
            <Link to="/assessment">
              <Button size="lg" className="gap-2">
                Begin Your Assessment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 medical-gradient-bg">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Take the First Step Today
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Early detection can make a significant difference. Complete our quick assessment 
              to understand your risk and take proactive steps for your health.
            </p>
            <Link to="/assessment">
              <Button size="lg" variant="secondary" className="gap-2 h-12 px-8 text-base">
                Start Free Assessment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Disclaimer */}
            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Medical Disclaimer:</strong> This tool is for screening purposes only and should not be 
                considered a medical diagnosis. The results are based on pattern analysis and should be 
                interpreted by a qualified healthcare professional. Please consult a neurologist or movement 
                disorder specialist for proper evaluation and diagnosis.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Brain className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">PD Detection System</span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms of Use</a>
                <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              </div>
              
              <p className="text-sm text-muted-foreground">
                © 2024 Parkinson's Early Detection System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
