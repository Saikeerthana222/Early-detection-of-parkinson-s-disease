import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Brain, 
  ArrowLeft, 
  Download, 
  Mail, 
  RefreshCw, 
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Activity,
  PenTool,
  Waves,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type PredictionResult, getRiskColor, getRiskBgColor, getRiskLabel } from '@/lib/api';
import { generatePDFReport, downloadPDFReport } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Get result from navigation state
  const result = location.state?.result as PredictionResult | undefined;
  const imageUrls = location.state?.images as string[] | undefined;
  
  // Redirect if no results
  useEffect(() => {
    if (!result) {
      navigate('/assessment');
    }
  }, [result, navigate]);
  
  if (!result) {
    return null;
  }
  
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const blob = await generatePDFReport(result, []);
      downloadPDFReport(blob, `parkinsons-assessment-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({
        title: 'Report Downloaded',
        description: 'Your assessment report has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not generate the PDF report.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const handleSaveResults = () => {
    try {
      localStorage.setItem('pdAssessmentResult', JSON.stringify({
        result,
        savedAt: new Date().toISOString()
      }));
      toast({
        title: 'Results Saved',
        description: 'Your assessment has been saved locally.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Could not save results to local storage.',
        variant: 'destructive',
      });
    }
  };
  
  const getRiskIcon = () => {
    switch (result.riskLevel) {
      case 'low':
        return <CheckCircle className="h-8 w-8" />;
      case 'moderate':
        return <Info className="h-8 w-8" />;
      case 'elevated':
      case 'high':
        return <AlertTriangle className="h-8 w-8" />;
      default:
        return <Info className="h-8 w-8" />;
    }
  };
  
  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'tremorScore':
        return <Waves className="h-4 w-4" />;
      case 'micrographiaScore':
        return <PenTool className="h-4 w-4" />;
      case 'spiralConsistency':
        return <Activity className="h-4 w-4" />;
      case 'lineWaviness':
        return <TrendingUp className="h-4 w-4" />;
      case 'speedVariation':
        return <Gauge className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };
  
  const metricLabels: Record<string, string> = {
    tremorScore: 'Tremor Detection',
    micrographiaScore: 'Micrographia (Small Writing)',
    spiralConsistency: 'Spiral Consistency',
    lineWaviness: 'Line Waviness',
    speedVariation: 'Speed Variation',
  };
  
  const metricDescriptions: Record<string, string> = {
    tremorScore: 'Average score from spiral analyses detecting hand tremors',
    micrographiaScore: 'Analysis of handwriting size patterns',
    spiralConsistency: 'Difference between clockwise and counterclockwise spirals',
    lineWaviness: 'Irregularity in connecting lines between dots',
    speedVariation: 'Standard deviation across all samples',
  };
  
  // Calculate stroke dash offset for circular progress
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (result.overallRisk / 100) * circumference;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">PD Detection System</span>
          </button>
          
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>
      
      <main className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Assessment Results</h1>
            <p className="text-muted-foreground">
              Completed on {new Date(result.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          {/* Overall Risk Card */}
          <div className={cn(
            "medical-card-elevated mb-8 animate-slide-up",
            getRiskBgColor(result.riskLevel)
          )}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular Progress */}
              <div className="relative flex-shrink-0">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={cn(
                      "transition-all duration-1000 ease-out",
                      getRiskColor(result.riskLevel)
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-3xl font-bold font-mono", getRiskColor(result.riskLevel))}>
                    {result.overallRisk}%
                  </span>
                  <span className="text-xs text-muted-foreground">Risk Score</span>
                </div>
              </div>
              
              {/* Risk Details */}
              <div className="flex-1 text-center md:text-left">
                <div className={cn("inline-flex items-center gap-2 mb-2", getRiskColor(result.riskLevel))}>
                  {getRiskIcon()}
                  <span className="text-xl font-semibold">{getRiskLabel(result.riskLevel)}</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  Confidence: <span className="font-mono font-medium">{result.confidence}%</span>
                </p>
                
                {result.ageAdjusted && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{result.ageContext}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Individual Image Analysis */}
          <div className="medical-card mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-semibold mb-4">Individual Image Analysis</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.individualScores.map((score, index) => (
                <div 
                  key={score.imageId}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    score.score <= 30 && "border-risk-low/30 bg-risk-low-bg/30",
                    score.score > 30 && score.score <= 60 && "border-risk-moderate/30 bg-risk-moderate-bg/30",
                    score.score > 60 && score.score <= 85 && "border-risk-elevated/30 bg-risk-elevated-bg/30",
                    score.score > 85 && "border-risk-high/30 bg-risk-high-bg/30",
                  )}
                >
                  {/* Image Preview */}
                  {imageUrls && imageUrls[index] && (
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                      <img 
                        src={imageUrls[index]} 
                        alt={score.taskType}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{score.taskType}</span>
                      <span className={cn(
                        "font-mono font-semibold",
                        score.score <= 30 && "text-risk-low",
                        score.score > 30 && score.score <= 60 && "text-risk-moderate",
                        score.score > 60 && score.score <= 85 && "text-risk-elevated",
                        score.score > 85 && "text-risk-high",
                      )}>
                        {score.score}%
                      </span>
                    </div>
                    <Progress 
                      value={score.score} 
                      className={cn(
                        "h-2",
                        score.score <= 30 && "[&>div]:bg-risk-low",
                        score.score > 30 && score.score <= 60 && "[&>div]:bg-risk-moderate",
                        score.score > 60 && score.score <= 85 && "[&>div]:bg-risk-elevated",
                        score.score > 85 && "[&>div]:bg-risk-high",
                      )}
                    />
                    <p className="text-xs text-muted-foreground">{score.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Detailed Metrics */}
          <div className="medical-card mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Accordion type="single" collapsible defaultValue="metrics">
              <AccordionItem value="metrics" className="border-none">
                <AccordionTrigger className="hover:no-underline py-0">
                  <h2 className="text-lg font-semibold">Detailed Breakdown</h2>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {Object.entries(result.detailedMetrics).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {getMetricIcon(key)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{metricLabels[key]}</p>
                              <p className="text-xs text-muted-foreground">{metricDescriptions[key]}</p>
                            </div>
                          </div>
                          <span className="font-mono font-semibold">{value}%</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          {/* Recommendations */}
          <div className="medical-card mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-lg font-semibold mb-4">Recommendations</h2>
            <div className="space-y-3">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button 
              variant="outline" 
              className="gap-2 h-auto py-4 flex-col"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">Download Report</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2 h-auto py-4 flex-col"
              onClick={() => {
                toast({
                  title: 'Coming Soon',
                  description: 'Email functionality will be available soon.',
                });
              }}
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Email to Doctor</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2 h-auto py-4 flex-col"
              onClick={() => navigate('/assessment')}
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-xs">New Assessment</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2 h-auto py-4 flex-col"
              onClick={handleSaveResults}
            >
              <Save className="h-5 w-5" />
              <span className="text-xs">Save Results</span>
            </Button>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-muted/50 rounded-lg p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Important Medical Disclaimer</h3>
                <p className="text-sm text-muted-foreground">
                  This assessment is for screening purposes only and should not be considered a medical 
                  diagnosis. The results are based on handwriting pattern analysis and should be 
                  interpreted by a qualified healthcare professional. Please consult a neurologist or 
                  movement disorder specialist for proper evaluation and diagnosis. Your data has been 
                  processed locally and has not been stored on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          © 2024 Parkinson's Early Detection System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ResultsPage;
