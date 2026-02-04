import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Brain, ArrowLeft, ArrowRight, Upload, X, Check, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAgeWarning, type PatientInfo, predictParkinsons, checkHealth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const DRAWING_TASKS = [
  { id: 1, name: 'Clockwise Spiral', description: 'Draw a spiral starting from the center, moving clockwise' },
  { id: 2, name: 'Counterclockwise Spiral', description: 'Draw a spiral starting from the center, moving counterclockwise' },
  { id: 3, name: 'Handwriting Sample', description: 'Write: "The quick brown fox jumps"' },
  { id: 4, name: 'Dot Connection', description: 'Connect dots in sequence (draw lines between numbered points)' },
  { id: 5, name: 'Signature', description: 'Write your signature naturally' },
];

interface UploadedImage {
  file: File;
  preview: string;
  taskId: number;
}

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Patient info state
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    age: 0,
    gender: '',
    handedness: '',
    medicalHistory: false,
    familyHistory: false,
  });
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const ageWarning = patientInfo.age > 0 ? getAgeWarning(patientInfo.age) : null;
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!patientInfo.age || patientInfo.age < 18 || patientInfo.age > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }
    if (!patientInfo.gender) {
      newErrors.gender = 'Please select your gender';
    }
    if (!patientInfo.handedness) {
      newErrors.handedness = 'Please select your dominant hand';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };
  
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };
  
  const handleFileUpload = useCallback((files: FileList | null, taskId: number) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG or PNG image.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }
    
    const preview = URL.createObjectURL(file);
    
    setUploadedImages(prev => {
      // Remove existing image for this task if any
      const filtered = prev.filter(img => img.taskId !== taskId);
      return [...filtered, { file, preview, taskId }];
    });
  }, [toast]);
  
  const handleRemoveImage = (taskId: number) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.taskId === taskId);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.taskId !== taskId);
    });
  };
  
  const handleDragOver = (e: React.DragEvent, taskId: number) => {
    e.preventDefault();
    setDragOverTaskId(taskId);
  };
  
  const handleDragLeave = () => {
    setDragOverTaskId(null);
  };
  
  const handleDrop = (e: React.DragEvent, taskId: number) => {
    e.preventDefault();
    setDragOverTaskId(null);
    handleFileUpload(e.dataTransfer.files, taskId);
  };
  
  const getImageForTask = (taskId: number) => {
    return uploadedImages.find(img => img.taskId === taskId);
  };
  
  const canAnalyze = uploadedImages.length === 5;
  
  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    
    setIsSubmitting(true);
    
    try {
      // Check backend health first
      const health = await checkHealth();
      
      if (health.status !== 'healthy' || !health.model_loaded) {
        toast({
          title: 'Backend Not Available',
          description: 'The analysis server is not running. Please ensure the backend is started.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Sort images by task ID
      const sortedImages = [...uploadedImages].sort((a, b) => a.taskId - b.taskId);
      const files = sortedImages.map(img => img.file);
      
      const result = await predictParkinsons(files, patientInfo);
      
      // Navigate to results page with the result data
      navigate('/results', { state: { result, images: sortedImages.map(img => img.preview) } });
      
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An error occurred during analysis.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
          
          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className={cn("text-sm", step >= 1 ? "text-foreground" : "text-muted-foreground")}>
                Patient Info
              </span>
            </div>
            <div className="w-12 h-0.5 bg-border" />
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                2
              </div>
              <span className={cn("text-sm", step >= 2 ? "text-foreground" : "text-muted-foreground")}>
                Upload Images
              </span>
            </div>
          </div>
          
          <Button variant="ghost" onClick={() => navigate('/')}>
            Cancel
          </Button>
        </div>
      </header>
      
      <main className="container py-8 md:py-12">
        {/* Step 1: Patient Information */}
        {step === 1 && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Patient Information</h1>
              <p className="text-muted-foreground">
                Please provide your information for accurate analysis
              </p>
            </div>
            
            <div className="medical-card-elevated space-y-6">
              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min={18}
                  max={100}
                  placeholder="Enter your age"
                  value={patientInfo.age || ''}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className={errors.age ? 'border-destructive' : ''}
                />
                {errors.age && (
                  <p className="text-sm text-destructive">{errors.age}</p>
                )}
              </div>
              
              {/* Age Warning */}
              {ageWarning && (
                <Alert variant={ageWarning.type === 'warning' ? 'destructive' : 'default'} className={cn(
                  ageWarning.type === 'info' && 'border-primary/50 bg-primary/5'
                )}>
                  {ageWarning.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4 text-primary" />
                  )}
                  <AlertDescription>{ageWarning.message}</AlertDescription>
                </Alert>
              )}
              
              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select 
                  value={patientInfo.gender} 
                  onValueChange={(value) => setPatientInfo(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender}</p>
                )}
              </div>
              
              {/* Handedness */}
              <div className="space-y-2">
                <Label>Dominant Hand *</Label>
                <Select 
                  value={patientInfo.handedness} 
                  onValueChange={(value) => setPatientInfo(prev => ({ ...prev, handedness: value }))}
                >
                  <SelectTrigger className={errors.handedness ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select dominant hand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right-handed">Right-handed</SelectItem>
                    <SelectItem value="left-handed">Left-handed</SelectItem>
                    <SelectItem value="ambidextrous">Ambidextrous</SelectItem>
                  </SelectContent>
                </Select>
                {errors.handedness && (
                  <p className="text-sm text-destructive">{errors.handedness}</p>
                )}
              </div>
              
              {/* Medical History */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="medicalHistory"
                    checked={patientInfo.medicalHistory}
                    onCheckedChange={(checked) => 
                      setPatientInfo(prev => ({ ...prev, medicalHistory: checked === true }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="medicalHistory" className="cursor-pointer">
                      I have existing hand tremors or motor difficulties
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      This helps adjust the analysis for pre-existing conditions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="familyHistory"
                    checked={patientInfo.familyHistory}
                    onCheckedChange={(checked) => 
                      setPatientInfo(prev => ({ ...prev, familyHistory: checked === true }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="familyHistory" className="cursor-pointer">
                      Family history of Parkinson's Disease
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Optional - helps personalize recommendations
                    </p>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleNext} className="w-full gap-2" size="lg">
                Continue to Image Upload
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Image Upload */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Upload Drawing Samples</h1>
              <p className="text-muted-foreground">
                Complete all 5 drawing tasks and upload clear photos
              </p>
            </div>
            
            {/* Instructions */}
            <div className="medical-card mb-8">
              <h3 className="font-semibold mb-3">Instructions</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Use plain white paper and a black pen
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Take clear photos in good lighting
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Ensure the drawing fills most of the frame
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Accepted formats: JPG, PNG (max 5MB each)
                </li>
              </ul>
            </div>
            
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {uploadedImages.length} of 5 images uploaded
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((uploadedImages.length / 5) * 100)}%
                </span>
              </div>
              <Progress value={(uploadedImages.length / 5) * 100} className="h-2" />
            </div>
            
            {/* Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {DRAWING_TASKS.map((task) => {
                const image = getImageForTask(task.id);
                const isDragOver = dragOverTaskId === task.id;
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "relative rounded-xl border-2 border-dashed transition-all duration-200",
                      image ? "border-success bg-success/5" : "border-border hover:border-primary/50",
                      isDragOver && "border-primary bg-primary/5",
                    )}
                    onDragOver={(e) => handleDragOver(e, task.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, task.id)}
                  >
                    {image ? (
                      // Uploaded state
                      <div className="p-4">
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                          <img
                            src={image.preview}
                            alt={task.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveImage(task.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute top-2 left-2 p-1.5 rounded-full bg-success text-success-foreground">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{task.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {image.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(image.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Empty state
                      <label className="block p-6 cursor-pointer">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files, task.id)}
                        />
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-sm mb-1">{task.name}</p>
                          <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
                          <p className="text-xs text-primary">
                            Click or drag to upload
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button variant="outline" onClick={handleBack} className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <Button 
                onClick={handleAnalyze} 
                disabled={!canAnalyze || isSubmitting}
                className={cn(
                  "gap-2 w-full sm:w-auto",
                  canAnalyze && !isSubmitting && "animate-pulse"
                )}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Images
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            
            {!canAnalyze && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Please upload all 5 images to continue
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AssessmentPage;
