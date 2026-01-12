import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, X, Copy, Share2, Download, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

type InspectionStatus = "green" | "amber" | "red";

interface InspectionItem {
  id: string;
  category: string;
  item: string;
  status: InspectionStatus;
  comment: string;
  images: string[];
  estimatedCost?: number;
  recommendedAction?: string;
}

const PRE_POPULATED_COMMENTS = {
  brakes: [
    "Brake pads in good condition",
    "Brake pads worn - replacement recommended",
    "Brake fluid level low",
    "Brake discs scored - replacement needed",
  ],
  tires: [
    "Tires in good condition",
    "Tread depth adequate",
    "Tread depth low - replacement recommended",
    "Tire pressure low",
    "Uneven wear pattern detected",
  ],
  fluids: [
    "Oil level good",
    "Oil level low - top-up recommended",
    "Coolant level good",
    "Coolant level low",
    "Transmission fluid level good",
  ],
  lights: [
    "All lights functioning",
    "Headlight not working",
    "Brake light not working",
    "Turn signal not working",
  ],
  suspension: [
    "Suspension in good condition",
    "Worn suspension components detected",
    "Shock absorber leaking",
    "Alignment check recommended",
  ],
  engine: [
    "Engine running smoothly",
    "Engine warning light on",
    "Unusual engine noise detected",
    "Exhaust smoke detected",
  ],
};

const INSPECTION_CATEGORIES = [
  { name: "Brakes", key: "brakes" },
  { name: "Tires", key: "tires" },
  { name: "Fluids", key: "fluids" },
  { name: "Lights", key: "lights" },
  { name: "Suspension", key: "suspension" },
  { name: "Engine", key: "engine" },
];

export default function DVIInspection() {
  const [inspectionNumber] = useState("DVI-2025-001");
  const [customerName] = useState("John Smith");
  const [vehicleInfo] = useState("2020 Toyota Corolla, Plate: ABC123");
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    {
      id: "1",
      category: "Brakes",
      item: "Brake Pads",
      status: "green",
      comment: "Brake pads in good condition",
      images: [],
    },
    {
      id: "2",
      category: "Tires",
      item: "Tire Condition",
      status: "amber",
      comment: "Tread depth low - replacement recommended",
      images: [],
      estimatedCost: 600,
      recommendedAction: "Replace all 4 tires",
    },
  ]);
  const [showShareLink, setShowShareLink] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const shareLink = `${window.location.origin}/dvi-report/${inspectionNumber}`;

  const handleAddItem = (category: string) => {
    const newItem: InspectionItem = {
      id: Date.now().toString(),
      category,
      item: `${category} Check`,
      status: "green",
      comment: "",
      images: [],
    };
    setInspectionItems([...inspectionItems, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<InspectionItem>) => {
    setInspectionItems(
      inspectionItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setInspectionItems(inspectionItems.filter((item) => item.id !== id));
  };

  const handleImageUpload = (id: string, files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
    handleUpdateItem(id, {
      images: [...(inspectionItems.find((i) => i.id === id)?.images || []), ...newImages],
    });
    toast.success(`${files.length} image(s) uploaded`);
  };

  const handleRemoveImage = (itemId: string, imageIndex: number) => {
    const item = inspectionItems.find((i) => i.id === itemId);
    if (item) {
      const newImages = item.images.filter((_, idx) => idx !== imageIndex);
      handleUpdateItem(itemId, { images: newImages });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
  };

  const handleGenerateReport = () => {
    toast.success("Generating DVI report...");
  };

  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case "green":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "amber":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "red":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBgColor = (status: InspectionStatus) => {
    switch (status) {
      case "green":
        return "bg-green-50 border-green-200";
      case "amber":
        return "bg-amber-50 border-amber-200";
      case "red":
        return "bg-red-50 border-red-200";
    }
  };

  const redCount = inspectionItems.filter((i) => i.status === "red").length;
  const amberCount = inspectionItems.filter((i) => i.status === "amber").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Digital Vehicle Inspection</h1>
              <p className="text-gray-600">Inspection #{inspectionNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">{format(new Date(), "MMM d, yyyy")}</p>
            </div>
          </div>

          {/* Vehicle Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold text-lg">{customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-semibold text-lg">{vehicleInfo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Issues Found</p>
                  <div className="flex gap-2 mt-1">
                    {redCount > 0 && (
                      <Badge className="bg-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {redCount} Critical
                      </Badge>
                    )}
                    {amberCount > 0 && (
                      <Badge className="bg-amber-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {amberCount} Warning
                      </Badge>
                    )}
                    {redCount === 0 && amberCount === 0 && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        All Good
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Inspection Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {INSPECTION_CATEGORIES.map((cat) => (
                <Button
                  key={cat.key}
                  variant={selectedCategory === cat.key ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.key)}
                  className="whitespace-nowrap"
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Inspection Items */}
            <div className="space-y-4">
              {inspectionItems.map((item) => (
                <Card key={item.id} className={`border-2 ${getStatusBgColor(item.status)}`}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Item Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(item.status)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.item}</h3>
                            <p className="text-sm text-gray-600">{item.category}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Status Selection */}
                      <div className="flex gap-2">
                        {(["green", "amber", "red"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateItem(item.id, { status })}
                            className={`
                              px-4 py-2 rounded-lg font-medium transition-all
                              ${
                                item.status === status
                                  ? status === "green"
                                    ? "bg-green-600 text-white"
                                    : status === "amber"
                                    ? "bg-amber-600 text-white"
                                    : "bg-red-600 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }
                            `}
                          >
                            {status === "green" ? "✓ Good" : status === "amber" ? "⚠ Warning" : "✗ Issue"}
                          </button>
                        ))}
                      </div>

                      {/* Comment Selection */}
                      <div>
                        <label className="text-sm font-medium block mb-2">Comment</label>
                        <select
                          value={item.comment}
                          onChange={(e) => handleUpdateItem(item.id, { comment: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a comment...</option>
                          {PRE_POPULATED_COMMENTS[
                            item.category.toLowerCase() as keyof typeof PRE_POPULATED_COMMENTS
                          ]?.map((comment, idx) => (
                            <option key={idx} value={comment}>
                              {comment}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={item.comment}
                          onChange={(e) => handleUpdateItem(item.id, { comment: e.target.value })}
                          placeholder="Or enter custom comment..."
                          className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-20"
                        />
                      </div>

                      {/* Recommended Action & Cost */}
                      {item.status !== "green" && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium block mb-2">Recommended Action</label>
                            <input
                              type="text"
                              value={item.recommendedAction || ""}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { recommendedAction: e.target.value })
                              }
                              placeholder="e.g., Replace tires"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-2">Estimated Cost</label>
                            <input
                              type="number"
                              value={item.estimatedCost || ""}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { estimatedCost: parseFloat(e.target.value) })
                              }
                              placeholder="$0.00"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                      {/* Image Upload */}
                      <div>
                        <label className="text-sm font-medium block mb-2">Images</label>
                        <div className="flex gap-2 mb-3">
                          {item.images.map((image, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={image}
                                alt={`Inspection ${idx}`}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => handleRemoveImage(item.id, idx)}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                          <Upload className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Upload Images</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(item.id, e.target.files)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Item Button */}
            <div className="flex gap-2 flex-wrap">
              {INSPECTION_CATEGORIES.map((cat) => (
                <Button
                  key={cat.key}
                  variant="outline"
                  onClick={() => handleAddItem(cat.name)}
                  className="h-10"
                >
                  + Add {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Share Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share Report</CardTitle>
                <CardDescription>Send to customer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowShareLink(!showShareLink)}
                  variant="outline"
                  className="w-full h-10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Generate Link
                </Button>

                {showShareLink && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg text-xs">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 bg-transparent outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-2 hover:bg-gray-200 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerateReport}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </Button>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold text-lg">{inspectionItems.length}</span>
                </div>
                <div className="flex justify-between items-center text-green-700">
                  <span>Good</span>
                  <span className="font-semibold">
                    {inspectionItems.filter((i) => i.status === "green").length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-amber-700">
                  <span>Warning</span>
                  <span className="font-semibold">{amberCount}</span>
                </div>
                <div className="flex justify-between items-center text-red-700">
                  <span>Critical</span>
                  <span className="font-semibold">{redCount}</span>
                </div>

                {redCount > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-900">
                      {redCount} critical issue{redCount > 1 ? "s" : ""} found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-base font-semibold">
              Save & Complete Inspection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
