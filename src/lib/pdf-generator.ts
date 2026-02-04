import { jsPDF } from 'jspdf';
import type { PredictionResult } from './api';

export async function generatePDFReport(
  result: PredictionResult,
  images: File[]
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: string; color?: number[] }) => {
    if (options?.fontSize) doc.setFontSize(options.fontSize);
    if (options?.fontStyle) doc.setFont('helvetica', options.fontStyle);
    if (options?.color) doc.setTextColor(options.color[0], options.color[1], options.color[2]);
    doc.text(text, x, y);
    doc.setTextColor(0, 0, 0); // Reset to black
  };

  // Header
  addText('Parkinson\'s Disease Early Detection System', margin, yPos, { fontSize: 18, fontStyle: 'bold' });
  yPos += 10;
  addText('Assessment Report', margin, yPos, { fontSize: 14, fontStyle: 'normal', color: [100, 100, 100] });
  yPos += 15;

  // Divider line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Patient Information
  addText('Patient Information', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Age: ${result.patientInfo.age}`, margin, yPos);
  doc.text(`Gender: ${result.patientInfo.gender}`, margin + 60, yPos);
  doc.text(`Handedness: ${result.patientInfo.handedness}`, margin + 120, yPos);
  yPos += 6;
  doc.text(`Assessment Date: ${new Date(result.timestamp).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, yPos);
  yPos += 15;

  // Overall Risk Assessment
  addText('Overall Risk Assessment', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 10;

  // Risk level with color
  const riskColors: Record<string, number[]> = {
    low: [16, 185, 129],
    moderate: [245, 158, 11],
    elevated: [249, 115, 22],
    high: [239, 68, 68]
  };
  const riskColor = riskColors[result.riskLevel] || [100, 100, 100];
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`${result.overallRisk}%`, margin, yPos);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const riskLabels: Record<string, string> = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    elevated: 'Elevated Risk',
    high: 'High Risk'
  };
  doc.text(riskLabels[result.riskLevel] || 'Unknown', margin + 30, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.text(`Confidence: ${result.confidence}%`, margin, yPos);
  yPos += 6;
  
  if (result.ageAdjusted) {
    doc.setTextColor(100, 100, 100);
    doc.text(`Age Context: ${result.ageContext}`, margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }
  yPos += 10;

  // Individual Image Scores
  addText('Individual Image Analysis', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 10;

  doc.setFontSize(10);
  result.individualScores.forEach((score, index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${score.taskType}`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Score: ${score.score}%`, margin + 80, yPos);
    yPos += 5;
    doc.setTextColor(100, 100, 100);
    doc.text(score.notes, margin + 5, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;
  });
  yPos += 5;

  // Detailed Metrics
  addText('Detailed Metrics', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 10;

  doc.setFontSize(10);
  const metrics = [
    { label: 'Tremor Detection Score', value: result.detailedMetrics.tremorScore },
    { label: 'Micrographia Score', value: result.detailedMetrics.micrographiaScore },
    { label: 'Spiral Consistency', value: result.detailedMetrics.spiralConsistency },
    { label: 'Line Waviness', value: result.detailedMetrics.lineWaviness },
    { label: 'Speed Variation', value: result.detailedMetrics.speedVariation },
  ];

  metrics.forEach(metric => {
    doc.text(`${metric.label}:`, margin, yPos);
    doc.text(`${metric.value}%`, margin + 80, yPos);
    yPos += 6;
  });
  yPos += 10;

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  // Recommendations
  addText('Recommendations', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
  yPos += 10;

  doc.setFontSize(10);
  result.recommendations.forEach((rec, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - margin * 2);
    lines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 2;
  });
  yPos += 10;

  // Disclaimer
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const disclaimer = 'DISCLAIMER: This assessment is for screening purposes only and should not be considered a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and diagnosis. The results are based on handwriting analysis patterns and should be interpreted in conjunction with clinical evaluation.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2);
  disclaimerLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  yPos += 10;
  doc.setFontSize(8);
  doc.text('© 2024 Parkinson\'s Early Detection System. All rights reserved.', margin, yPos);

  return doc.output('blob');
}

export function downloadPDFReport(blob: Blob, filename: string = 'parkinsons-assessment-report.pdf') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
