import jsPDF from 'jspdf';
import { Branding } from '@/config/branding';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';
import type { Farm, Batch, WeeklyEntry, ScanHistory, Sale, UserProfile } from '@/types/models';
import { calculateTotalRevenue, calculateTotalBirdsSold } from '@/lib/calculations';

/**
 * Creates a standard jsPDF document with the company branding if available, or PoultryGuardLite branding as fallback.
 * @param title The title of the report.
 * @param userProfile The user profile containing company information.
 * @param orientation 'portrait' or 'landscape'
 * @returns A jsPDF instance and the next available Y coordinate for content.
 */
export async function createBrandedPDF(
  title: string, 
  userProfile: UserProfile | null,
  orientation: 'portrait' | 'landscape' = 'portrait', 
  version: string = '1.2'
) {
  const doc = new jsPDF({ orientation });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const logoUrl = userProfile?.companyLogoUrl || Branding.reports.headerLogo;
  let logoData: string | null = null;
  
  try {
    if (logoUrl) {
      logoData = await fetchImageAsBase64(logoUrl);
      doc.addImage(logoData, 'PNG', 14, 10, 40, 40, '', 'FAST'); // assuming square logo, 40x40
    }
  } catch {
    // Silent fallback
  }

  // Header Text
  const startX = logoData ? 60 : 14;
  let currentHeaderY = 16;
  
  doc.setFontSize(16);
  doc.setTextColor('#F4A900'); 
  doc.text(userProfile?.companyName || Branding.appName, startX, currentHeaderY);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  if (userProfile?.address) {
    currentHeaderY += 6;
    doc.text(userProfile.address, startX, currentHeaderY);
  } else {
    currentHeaderY += 6;
    doc.text(Branding.tagline, startX, currentHeaderY);
  }

  if (userProfile?.phoneNumber || userProfile?.companyEmail) {
    currentHeaderY += 6;
    const contactParts = [];
    if (userProfile.phoneNumber) contactParts.push(`Tel: ${userProfile.phoneNumber}`);
    if (userProfile.companyEmail) contactParts.push(`Email: ${userProfile.companyEmail}`);
    doc.text(contactParts.join(' | '), startX, currentHeaderY);
  }

  if (userProfile?.website) {
    currentHeaderY += 6;
    doc.text(`Web: ${userProfile.website}`, startX, currentHeaderY);
  }

  if (userProfile?.gstNumber) {
    currentHeaderY += 6;
    doc.text(`GST/VAT: ${userProfile.gstNumber}`, startX, currentHeaderY);
  }

  // Tagline / Date on the right
  const now = new Date();
  doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Report Version: ${version}`, pageWidth - 14, 25, { align: 'right' });

  // Divider
  const headerBottomY = Math.max(52, currentHeaderY + 8);
  doc.setDrawColor(200);
  doc.line(14, headerBottomY, pageWidth - 14, headerBottomY);

  // Title
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text(title, 14, headerBottomY + 10);

  // Footer function to add on every page
  const addFooter = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages = (doc as any).getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setDrawColor(200);
      doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
      
      doc.setFontSize(10);
      doc.setTextColor('#F4A900');
      doc.text(userProfile?.companyName || Branding.appName, 14, pageHeight - 8);
      
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Powered by PoultryGuardLite | Version ${version}`, 60, pageHeight - 8);
      doc.text(Branding.copyright, 14, pageHeight - 4);

      doc.text(`Generated On: ${now.toLocaleDateString()}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
      doc.text(`Page ${i} of ${pages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    }
  };

  return { doc, startY: headerBottomY + 18, addFooter, pageWidth, pageHeight };
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

export async function generateWeeklyReportPdf(
  farm: Farm,
  batch: Batch,
  entries: WeeklyEntry[],
  scans: ScanHistory[],
  userProfile: UserProfile | null
) {
  const { doc, startY, addFooter } = await createBrandedPDF(`Weekly Report: ${batch.batchName}`, userProfile, 'portrait');

  doc.setFontSize(12);
  doc.setTextColor(50);
  doc.text(`Farm: ${farm.name}`, 14, startY);
  doc.text(`Batch: ${batch.batchName}`, 14, startY + 8);
  doc.text(`Initial Birds: ${batch.totalBirds}`, 14, startY + 16);

  let currentY = startY + 28;

  // Entries Table
  if (entries.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(20);
    doc.text('Weekly Entries', 14, currentY);
    
    const tableData = entries.map((e, index) => [
      `Week ${index + 1}`,
      formatDate(e.entryDate || new Date()),
      e.mortalityCount.toString(),
      e.feedConsumedKg.toString(),
      e.waterConsumedLitres.toString(),
      e.averageWeightKg.toString()
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Week', 'Date', 'Mortality', 'Feed (kg)', 'Water (L)', 'Avg Weight (g)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: '#F4A900', textColor: '#ffffff' },
      styles: { fontSize: 10 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // AI Scans Table
  if (scans.length > 0) {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(20);
    doc.text('AI Scans History', 14, currentY);

    const scanData = scans.map(s => [
      formatDate(s.createdAt),
      s.result.diseaseName,
      s.result.confidence,
      s.result.severity
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Date', 'Disease Identified', 'Confidence', 'Severity']],
      body: scanData,
      theme: 'grid',
      headStyles: { fillColor: '#F4A900', textColor: '#ffffff' },
      styles: { fontSize: 10 },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const severity = data.cell.raw;
          if (severity === 'High' || severity === 'Critical') {
            data.cell.styles.textColor = '#ef4444';
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
  }

  addFooter();
  return doc;
}

export async function generateSalesReportPdf(
  farm: Farm,
  sales: Sale[],
  batches: Batch[],
  userProfile: UserProfile | null
) {
  const { doc, startY, addFooter, pageWidth, pageHeight } = await createBrandedPDF(`SALES REPORT`, userProfile, 'landscape', '1.2');

  // FARM INFORMATION
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FARM INFORMATION', 14, startY);
  
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.setFont('helvetica', 'normal');
  doc.text(`Farm Name: ${farm.name}`, 14, startY + 6);
  doc.text(`Owner Name: ${farm.ownerName}`, 14, startY + 12);
  doc.text(`Location: ${farm.address || 'N/A'}`, pageWidth / 2, startY + 6);
  
  const activeBatches = batches.filter(b => b.status === 'Active').length;
  doc.text(`Active Batches: ${activeBatches}`, pageWidth / 2, startY + 12);
  
  doc.setDrawColor(220);
  doc.line(14, startY + 16, pageWidth - 14, startY + 16);

  // SUMMARY CARDS
  const totalRevenue = calculateTotalRevenue(sales);
  const totalBirdsSold = calculateTotalBirdsSold(sales);
  const totalWeight = sales.reduce((acc, sale) => acc + (sale.totalWeight || 0), 0);
  const averagePricePerKg = totalWeight > 0 ? totalRevenue / totalWeight : 0;
  const totalProfit = sales.reduce((acc, sale) => acc + (sale.estimatedProfit || 0), 0);
  const numberOfSales = sales.length;

  let currentY = startY + 24;
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 14, currentY);
  
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.setFont('helvetica', 'normal');
  const cw = (pageWidth - 28) / 5; // column width
  doc.text(`Total Revenue\n$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, currentY + 6);
  doc.text(`Birds Sold\n${totalBirdsSold.toLocaleString()}`, 14 + cw, currentY + 6);
  doc.text(`Avg Price/Kg\n$${averagePricePerKg.toFixed(2)}`, 14 + cw * 2, currentY + 6);
  doc.text(`Est. Profit\n$${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + cw * 3, currentY + 6);
  doc.text(`Number of Sales\n${numberOfSales}`, 14 + cw * 4, currentY + 6);

  currentY += 18;
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 8;

  const batchMap = new Map(batches.map(b => [b.id, b.batchName]));

  if (sales.length > 0) {
    // SALES TABLE
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES RECORDS', 14, currentY);
    doc.setFont('helvetica', 'normal');

    const tableData = sales.map(s => [
      s.saleDate ? formatDate(s.saleDate) : 'Unknown',
      batchMap.get(s.batchId) || 'Unknown Batch',
      s.buyerName,
      s.birdsSold.toString(),
      `${s.averageWeight} kg`,
      `$${s.pricePerKg.toFixed(2)}`,
      `$${s.revenue.toFixed(2)}`,
      'Completed',
      s.notes || '-'
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Sale Date', 'Batch', 'Buyer Name', 'Birds Sold', 'Avg Weight', 'Price/Kg', 'Total Amount', 'Status', 'Notes']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: '#F4A900', textColor: '#ffffff' },
      styles: { fontSize: 9 },
    });

    // ANALYTICS SECTION
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Check pagination for analytics
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALYTICS', 14, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.setFont('helvetica', 'normal');

    const highestSale = Math.max(...sales.map(s => s.revenue));
    const lowestSale = Math.min(...sales.map(s => s.revenue));
    const avgRevPerSale = numberOfSales > 0 ? totalRevenue / numberOfSales : 0;
    const avgBirdsSold = numberOfSales > 0 ? Math.round(totalBirdsSold / numberOfSales) : 0;
    
    // Most sold batch
    const batchSalesCount: Record<string, number> = {};
    sales.forEach(s => {
      batchSalesCount[s.batchId] = (batchSalesCount[s.batchId] || 0) + 1;
    });
    const mostSoldBatchId = Object.keys(batchSalesCount).reduce((a, b) => batchSalesCount[a] > batchSalesCount[b] ? a : b, '');
    const mostSoldBatchName = batchMap.get(mostSoldBatchId) || 'Unknown';

    doc.text(`Highest Sale: $${highestSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, currentY + 8);
    doc.text(`Lowest Sale: $${lowestSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, currentY + 14);
    
    doc.text(`Avg Revenue / Sale: $${avgRevPerSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + cw * 1.5, currentY + 8);
    doc.text(`Avg Birds Sold: ${avgBirdsSold}`, 14 + cw * 1.5, currentY + 14);
    
    doc.text(`Most Sold Batch: ${mostSoldBatchName}`, 14 + cw * 3, currentY + 8);
    doc.text(`Total Sales Value: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + cw * 3, currentY + 14);

  } else {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('No sales records found for this farm.', 14, currentY + 10);
  }

  addFooter();
  return doc;
}