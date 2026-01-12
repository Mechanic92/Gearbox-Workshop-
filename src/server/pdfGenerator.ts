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
