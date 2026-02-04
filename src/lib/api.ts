const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface PatientInfo {
  age: number;
  gender: string;
  handedness: string;
  medicalHistory: boolean;
  familyHistory: boolean;
}

export interface IndividualScore {
  imageId: number;
  taskType: string;
  score: number;
  notes: string;
}

export interface DetailedMetrics {
  tremorScore: number;
  micrographiaScore: number;
  spiralConsistency: number;
  lineWaviness: number;
  speedVariation: number;
}

export interface PredictionResult {
  success: boolean;
  overallRisk: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  confidence: number;
  individualScores: IndividualScore[];
  detailedMetrics: DetailedMetrics;
  ageAdjusted: boolean;
  ageContext: string;
  recommendations: string[];
  timestamp: string;
  patientInfo: {
    age: number;
    gender: string;
    handedness: string;
  };
}

export interface ModelStatus {
  loaded: boolean;
  message?: string;
  model_path?: string;
  input_shape?: string;
  output_shape?: string;
  total_params?: number;
  error?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  model_loaded: boolean;
  version: string;
  error?: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return await response.json();
  } catch (error) {
    return { 
      status: 'unhealthy', 
      model_loaded: false,
      version: '0.0.0',
      error: error instanceof Error ? error.message : 'Cannot connect to backend server'
    };
  }
}

export async function checkModelStatus(): Promise<ModelStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/model-status`);
    const data = await response.json();
    return data;
  } catch (error) {
    return { 
      loaded: false, 
      error: 'Cannot connect to backend. Ensure server is running on port 5000.' 
    };
  }
}

export async function predictParkinsons(
  images: File[],
  patientInfo: PatientInfo
): Promise<PredictionResult> {
  const formData = new FormData();
  
  images.forEach((image) => {
    formData.append('images', image);
  });
  
  formData.append('age', patientInfo.age.toString());
  formData.append('gender', patientInfo.gender);
  formData.append('handedness', patientInfo.handedness);
  formData.append('medicalHistory', patientInfo.medicalHistory.toString());
  formData.append('familyHistory', patientInfo.familyHistory.toString());
  
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Prediction failed');
  }
  
  return await response.json();
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'text-risk-low';
    case 'moderate':
      return 'text-risk-moderate';
    case 'elevated':
      return 'text-risk-elevated';
    case 'high':
      return 'text-risk-high';
    default:
      return 'text-muted-foreground';
  }
}

export function getRiskBgColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'bg-risk-low-bg';
    case 'moderate':
      return 'bg-risk-moderate-bg';
    case 'elevated':
      return 'bg-risk-elevated-bg';
    case 'high':
      return 'bg-risk-high-bg';
    default:
      return 'bg-muted';
  }
}

export function getRiskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'Low Risk';
    case 'moderate':
      return 'Moderate Risk - Monitor Symptoms';
    case 'elevated':
      return 'Elevated Risk - Consult Healthcare Provider';
    case 'high':
      return 'High Risk - Seek Medical Evaluation Soon';
    default:
      return 'Unknown';
  }
}

export function getAgeWarning(age: number): { type: 'info' | 'warning' | 'standard'; message: string } | null {
  if (age < 25) {
    return {
      type: 'warning',
      message: 'Drawing variations in younger individuals are often due to other factors. This assessment is most accurate for individuals 40+.'
    };
  } else if (age < 40) {
    return {
      type: 'info',
      message: "Parkinson's typically affects individuals over 60. Results will be adjusted for your age group."
    };
  } else if (age >= 40 && age <= 60) {
    return {
      type: 'info',
      message: "You're in the early-onset risk category. Pay attention to other symptoms."
    };
  }
  return null;
}
