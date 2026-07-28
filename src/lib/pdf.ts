import jsPDF from 'jspdf';
import { Branding } from '@/config/branding';

/**
 * Creates a standard jsPDF document with the PoultryGuardLite branding.
 * @param title The title of the report.
 * @param orientation 'portrait' or 'landscape'
 * @returns A jsPDF instance and the next available Y coordinate for content.
 */
export async function createBrandedPDF(title: string, orientation: 'portrait' | 'landscape' = 'portrait') {
  const doc = new jsPDF({ orientation });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Try to load the report header logo
  try {
    const imgData = await fetchImageAsBase64(Branding.reports.headerLogo);
    // Add logo (approx 40x10 mm)
    doc.addImage(imgData, 'PNG', 14, 10, 40, 10);
  } catch {
    // Fallback if image fails to load
    doc.setFontSize(16);
    doc.setTextColor('#F4A900'); // Primary color
    doc.text(Branding.appName, 14, 16);
  }

  // Tagline / Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(Branding.tagline, 14, 25);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 25, { align: 'right' });

  // Divider
  doc.setDrawColor(200);
  doc.line(14, 28, pageWidth - 14, 28);

  // Title
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text(title, 14, 38);

  // Footer function to add on every page
  const addFooter = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setDrawColor(200);
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
      
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(Branding.copyright, 14, pageHeight - 8);
      doc.text(`Page ${i} of ${pages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  };

  return { doc, startY: 45, addFooter };
}

/** Helper to fetch image and convert to base64 for jsPDF */
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}