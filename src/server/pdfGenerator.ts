import { jsPDF } from "jspdf";
import { format } from "date-fns";

export interface DVIReportData {
  dviId: number;
  jobId: number;
  vehicleInfo: string;
  inspectionDate: Date;
  technician: string;
  comments: Record<string, string>;
  notes?: string;
  images: string[];
  status: "green" | "amber" | "red";
  companyName: string;
  companyPhone: string;
  companyEmail: string;
}

export interface PPIData {
  inspectionId: number;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    plate: string;
    vin?: string;
  };
  inspectorName: string;
  inspectionDate: Date;
  items: Array<{
    label: string;
    status: "green" | "amber" | "red";
    comment?: string;
  }>;
  overallNotes?: string;
  companyName: string;
  companyLogo?: string;
}

export interface QuoteData {
  quoteId: number;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  vehicleInfo: string;
  createdDate: Date;
  expiryDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  notes?: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
}

export interface InvoiceData {
  invoiceId: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  jobNumber: string;
  jobDescription: string;
  invoiceDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  notes?: string;
  paymentTerms?: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  companyLogo?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export function generateDVIReportPDF(data: DVIReportData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 51, 102); // Dark blue
  doc.text("Digital Vehicle Inspection Report", pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 15;

  // Company info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.companyName}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;
  doc.text(`${data.companyPhone} | ${data.companyEmail}`, pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 15;

  // Report details
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Report Details", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  const details = [
    [`DVI ID: ${data.dviId}`, `Inspection Date: ${format(data.inspectionDate, "dd/MM/yyyy")}`],
    [`Job ID: ${data.jobId}`, `Technician: ${data.technician}`],
    [`Vehicle: ${data.vehicleInfo}`, `Status: ${data.status.toUpperCase()}`],
  ];

  details.forEach((row) => {
    doc.text(row[0], 20, yPosition);
    doc.text(row[1], pageWidth / 2, yPosition);
    yPosition += 7;
  });

  yPosition += 5;

  // Inspection findings
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Inspection Findings", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  Object.entries(data.comments).forEach(([category, comment]) => {
    if (comment) {
      doc.setFont(undefined as any, "bold");
      doc.text(`${category}:`, 20, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal");
      const wrappedText = doc.splitTextToSize(comment, pageWidth - 40);
      doc.text(wrappedText, 25, yPosition);
      yPosition += wrappedText.length * 5 + 3;
    }
  });

  yPosition += 5;

  // Notes
  if (data.comments) {
    doc.setFontSize(9);
    doc.setFont(undefined as any, "bold");
    doc.text("Additional Notes:", 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined as any, "normal");
    const notes = doc.splitTextToSize(data.notes || "No additional notes", pageWidth - 40);
    doc.text(notes, 25, yPosition);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateQuotePDF(data: QuoteData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 51, 102);
  doc.text("QUOTE", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // Company info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.companyName, 20, yPosition);
  yPosition += 5;
  doc.setFontSize(9);
  doc.text(`${data.companyPhone} | ${data.companyEmail}`, 20, yPosition);
  yPosition += 12;

  // Quote number and dates
  doc.setFontSize(10);
  doc.text(`Quote #: ${data.quoteNumber}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Date: ${format(data.createdDate, "dd/MM/yyyy")}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Expires: ${format(data.expiryDate, "dd/MM/yyyy")}`, 20, yPosition);
  yPosition += 12;

  // Customer info
  doc.setFont(undefined as any, "bold");
  doc.text("Bill To:", 20, yPosition);
  yPosition += 5;
  doc.setFont(undefined as any, "normal");
  doc.text(data.customerName, 20, yPosition);
  yPosition += 5;
  doc.text(data.customerEmail, 20, yPosition);
  yPosition += 5;
  doc.text(`Vehicle: ${data.vehicleInfo}`, 20, yPosition);
  yPosition += 12;

  // Items table
  const tableTop = yPosition;
  const colWidths = [80, 25, 30, 30];
  const headers = ["Description", "Qty", "Unit Price", "Total"];

  // Header row
  doc.setFont(undefined as any, "bold");
  doc.setFillColor(0, 51, 102);
  doc.setTextColor(255, 255, 255);
  let xPos = 20;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop, { align: "left" });
    xPos += colWidths[i];
  });

  yPosition = tableTop + 8;
  doc.setFont(undefined as any, "normal");
  doc.setTextColor(0, 0, 0);

  // Data rows
  data.items.forEach((item) => {
    doc.text(item.description, 20, yPosition);
    doc.text(item.quantity.toString(), 100, yPosition, { align: "center" });
    doc.text(`$${item.unitPrice.toFixed(2)}`, 130, yPosition, { align: "right" });
    doc.text(`$${item.total.toFixed(2)}`, 160, yPosition, { align: "right" });
    yPosition += 7;
  });

  yPosition += 5;

  // Totals
  doc.setFont(undefined as any, "bold");
  doc.text("Subtotal:", 130, yPosition, { align: "right" });
  doc.text(`$${data.subtotal.toFixed(2)}`, 160, yPosition, { align: "right" });
  yPosition += 7;

  doc.text("GST (15%):", 130, yPosition, { align: "right" });
  doc.text(`$${data.gstAmount.toFixed(2)}`, 160, yPosition, { align: "right" });
  yPosition += 7;

  doc.setFontSize(12);
  doc.text("TOTAL:", 130, yPosition, { align: "right" });
  doc.text(`$${data.totalAmount.toFixed(2)}`, 160, yPosition, { align: "right" });

  yPosition += 12;
  doc.setFontSize(9);
  doc.setFont(undefined as any, "normal");
  doc.text("Notes:", 20, yPosition);
  yPosition += 5;
  const notesWrapped = doc.splitTextToSize(data.notes || "", 170);
  doc.text(notesWrapped, 20, yPosition);

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateInvoicePDF(data: InvoiceData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 51, 102);
  doc.text("INVOICE", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // Company info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.companyName, 20, yPosition);
  yPosition += 5;
  doc.setFontSize(9);
  doc.text(data.companyAddress, 20, yPosition);
  yPosition += 5;
  doc.text(`${data.companyPhone} | ${data.companyEmail}`, 20, yPosition);
  yPosition += 12;

  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.invoiceNumber}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Date: ${format(data.invoiceDate, "dd/MM/yyyy")}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Due: ${format(data.dueDate, "dd/MM/yyyy")}`, 20, yPosition);
  yPosition += 12;

  // Bill to
  doc.setFont(undefined as any, "bold");
  doc.text("Bill To:", 20, yPosition);
  yPosition += 5;
  doc.setFont(undefined as any, "normal");
  doc.text(data.customerName, 20, yPosition);
  yPosition += 5;
  doc.text(data.customerAddress, 20, yPosition);
  yPosition += 5;
  doc.text(data.customerEmail, 20, yPosition);
  yPosition += 12;

  // Items table
  const tableTop = yPosition;
  const colWidths = [80, 25, 30, 30];
  const headers = ["Description", "Qty", "Unit Price", "Total"];

  doc.setFont(undefined as any, "bold");
  doc.setFillColor(0, 51, 102);
  doc.setTextColor(255, 255, 255);
  let xPos = 20;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop, { align: "left" });
    xPos += colWidths[i];
  });

  yPosition = tableTop + 8;
  doc.setFont(undefined as any, "normal");
  doc.setTextColor(0, 0, 0);

  data.items.forEach((item) => {
    doc.text(item.description, 20, yPosition);
    doc.text(item.quantity.toString(), 100, yPosition, { align: "center" });
    doc.text(`$${item.unitPrice.toFixed(2)}`, 130, yPosition, { align: "right" });
    doc.text(`$${item.total.toFixed(2)}`, 160, yPosition, { align: "right" });
    yPosition += 7;
  });

  yPosition += 5;

  // Totals
  doc.setFont(undefined as any, "bold");
  doc.text("Subtotal:", 130, yPosition, { align: "right" });
  doc.text(`$${data.subtotal.toFixed(2)}`, 160, yPosition, { align: "right" });
  yPosition += 7;

  doc.text("GST (15%):", 130, yPosition, { align: "right" });
  doc.text(`$${data.gstAmount.toFixed(2)}`, 160, yPosition, { align: "right" });
  yPosition += 7;

  doc.setFontSize(12);
  doc.text("TOTAL DUE:", 130, yPosition, { align: "right" });
  doc.text(`$${data.totalAmount.toFixed(2)}`, 160, yPosition, { align: "right" });

  yPosition += 12;
  doc.setFontSize(9);
  doc.setFont(undefined as any, "normal");

  if (data.bankDetails) {
    doc.setFont(undefined as any, "bold");
    doc.text("Bank Details:", 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined as any, "normal");
    doc.text(`Account: ${data.bankDetails.accountName}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Number: ${data.bankDetails.accountNumber}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Bank: ${data.bankDetails.bankName}`, 20, yPosition);
    yPosition += 10;
  }

  if (data.paymentTerms) {
    doc.setFont(undefined as any, "bold");
    doc.text("Payment Terms:", 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined as any, "normal");
    const termsWrapped = doc.splitTextToSize(data.paymentTerms, 170);
    doc.text(termsWrapped, 20, yPosition);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export function generatePPIReportPDF(data: PPIData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("PRE-PURCHASE INSPECTION", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Vehicle Info Box
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(20, yPosition, pageWidth - 40, 35, "F");
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text("VEHICLE INFORMATION", 25, yPosition + 7);
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont(undefined as any, "bold");
  doc.text(`${data.vehicleInfo.year} ${data.vehicleInfo.make} ${data.vehicleInfo.model}`, 25, yPosition + 17);
  
  doc.setFontSize(10);
  doc.setFont(undefined as any, "normal");
  doc.text(`Plate: ${data.vehicleInfo.plate}`, 25, yPosition + 27);
  if (data.vehicleInfo.vin) {
      doc.text(`VIN: ${data.vehicleInfo.vin}`, pageWidth / 2, yPosition + 27);
  }
  yPosition += 45;

  // Inspection Details
  doc.setFontSize(9);
  doc.text(`Inspector: ${data.inspectorName}`, 20, yPosition);
  doc.text(`Date: ${format(data.inspectionDate, "PPP")}`, pageWidth - 20, yPosition, { align: "right" });
  yPosition += 10;

  // Items List
  data.items.forEach((item, index) => {
    if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
    }

    // Status Indicator
    const colors: Record<string, number[]> = {
        green: [34, 197, 94],
        amber: [234, 179, 8],
        red: [239, 68, 68]
    };
    const color = colors[item.status];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(23, yPosition - 1, 2, "F");

    doc.setFontSize(10);
    doc.setFont(undefined as any, "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(item.label, 30, yPosition);
    
    yPosition += 5;
    if (item.comment) {
        doc.setFont(undefined as any, "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const wrapped = doc.splitTextToSize(item.comment, pageWidth - 50);
        doc.text(wrapped, 30, yPosition);
        yPosition += (wrapped.length * 4) + 5;
    } else {
        yPosition += 3;
    }
  });

  // Overall Notes
  if (data.overallNotes) {
    if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
    }
    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont(undefined as any, "bold");
    doc.text("OVERALL ASSESSMENT", 20, yPosition);
    yPosition += 7;
    doc.setFont(undefined as any, "normal");
    doc.setFontSize(10);
    const wrappedNotes = doc.splitTextToSize(data.overallNotes, pageWidth - 40);
    doc.text(wrappedNotes, 20, yPosition);
  }

  // Branding
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`© ${new Date().getFullYear()} ${data.companyName} - Powered by Gearbox OS`, pageWidth / 2, pageHeight - 10, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
