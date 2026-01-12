import { useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Download, Share2, Check, X, Clock, Eye } from "lucide-react";
import { format } from "date-fns";

export default function QuoteDetail() {
  const params = useParams<{ id: string }>();
  const [quoteStatus, setQuoteStatus] = useState<"draft" | "sent" | "approved" | "rejected">("sent");
  const [copied, setCopied] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  // Mock quote data (would be fetched from backend)
  const quote = {
    id: params?.id || "Q001",
    quoteNumber: "Q001-2025-001",
    customerName: "John Smith",
    customerEmail: "john@example.com",
    vehicleInfo: "2020 Toyota Corolla, Plate: ABC123",
    createdDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: quoteStatus,
    items: [
      { description: "WOF Inspection", quantity: 1, unitPrice: 45.00, total: 45.00 },
      { description: "Brake Fluid Top-up", quantity: 1, unitPrice: 25.00, total: 25.00 },
      { description: "Oil Filter Replacement", quantity: 1, unitPrice: 35.00, total: 35.00 },
      { description: "Labor (2 hours @ $80/hr)", quantity: 2, unitPrice: 80.00, total: 160.00 },
    ],
    subtotal: 265.00,
    gstAmount: 39.75,
    totalAmount: 304.75,
    notes: "Includes full vehicle inspection and minor maintenance. Parts warranty: 12 months.",
  };

  const shareLink = `${window.location.origin}/quote-approval/${quote.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = () => {
    setQuoteStatus("approved");
    toast.success("Quote approved! Converting to job...");
  };

  const handleReject = () => {
    setQuoteStatus("rejected");
    toast.info("Quote rejected");
  };

  const handleDownloadPDF = () => {
    toast.success("Downloading quote as PDF...");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <Check className="w-4 h-4" />;
      case "rejected":
        return <X className="w-4 h-4" />;
      case "sent":
        return <Eye className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Quote #{quote.quoteNumber}</h1>
              <p className="text-gray-600">
                Expires {format(quote.expiryDate, "MMMM d, yyyy")}
              </p>
            </div>
            <Badge className={`${getStatusColor(quote.status)} flex items-center gap-2 px-4 py-2 text-base`}>
              {getStatusIcon(quote.status)}
              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Quote Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                    <p className="font-semibold text-lg">{quote.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-lg">{quote.customerEmail}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vehicle</p>
                  <p className="font-semibold text-lg">{quote.vehicleInfo}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold">Description</th>
                        <th className="text-right py-3 px-4 font-semibold">Qty</th>
                        <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                        <th className="text-right py-3 px-4 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{item.description}</td>
                          <td className="text-right py-3 px-4">{item.quantity}</td>
                          <td className="text-right py-3 px-4">${item.unitPrice.toFixed(2)}</td>
                          <td className="text-right py-3 px-4 font-semibold">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-2 border-t-2 pt-4">
                  <div className="flex justify-end items-center gap-4">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-lg">${quote.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end items-center gap-4">
                    <span className="text-gray-600">GST (15%):</span>
                    <span className="font-semibold text-lg">${quote.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end items-center gap-4 bg-blue-50 p-4 rounded-lg">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-2xl text-blue-600">${quote.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Actions & Share */}
          <div className="space-y-6">
            {/* Share Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share Quote</CardTitle>
                <CardDescription>Send this quote to your customer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowShareLink(!showShareLink)}
                  variant="outline"
                  className="w-full h-10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Generate Share Link
                </Button>

                {showShareLink && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 bg-transparent text-sm outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">
                      Share this link with your customer for approval
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="w-full h-10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>

            {/* Approval Section */}
            {quote.status !== "approved" && quote.status !== "rejected" && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base">Customer Approval</CardTitle>
                  <CardDescription>Awaiting customer response</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleApprove}
                    className="w-full h-10 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Approved
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="w-full h-10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Mark as Rejected
                  </Button>
                </CardContent>
              </Card>
            )}

            {quote.status === "approved" && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base text-green-900">Quote Approved! ✓</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full h-10 bg-green-600 hover:bg-green-700">
                    Convert to Job
                  </Button>
                  <p className="text-xs text-green-700 mt-3 text-center">
                    Ready to schedule and begin work
                  </p>
                </CardContent>
              </Card>
            )}

            {quote.status === "rejected" && (
              <Card className="border-2 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-base text-red-900">Quote Rejected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700">
                    Customer has rejected this quote. You can create a new quote if needed.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quote Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-semibold">{format(quote.createdDate, "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expires</p>
                  <p className="font-semibold">{format(quote.expiryDate, "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-gray-600">Quote ID</p>
                  <p className="font-semibold font-mono">{quote.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
