import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfitSpeedometerProps {
  quotedPrice: number;
  totalCosts: number;
  className?: string;
}

/**
 * Profit Speedometer Component
 * 
 * Real-time visual indicator of job profitability.
 * Shows profit margin as a percentage with color-coded feedback:
 * - Green (40%+): High profit
 * - Orange (20-40%): Medium profit
 * - Red (<20%): Low profit
 * 
 * Designed for mobile-first with large, easy-to-read display.
 */
export function ProfitSpeedometer({ quotedPrice, totalCosts, className }: ProfitSpeedometerProps) {
  const profitData = useMemo(() => {
    const profit = quotedPrice - totalCosts;
    const profitMargin = quotedPrice > 0 ? (profit / quotedPrice) * 100 : 0;
    
    let color = "profit-low";
    let bgColor = "bg-destructive/10";
    let borderColor = "border-destructive";
    
    if (profitMargin >= 40) {
      color = "profit-high";
      bgColor = "bg-green-500/10";
      borderColor = "border-green-500";
    } else if (profitMargin >= 20) {
      color = "profit-medium";
      bgColor = "bg-orange-500/10";
      borderColor = "border-orange-500";
    }
    
    return {
      profit,
      profitMargin: Math.max(0, profitMargin),
      color,
      bgColor,
      borderColor,
    };
  }, [quotedPrice, totalCosts]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Profit Speedometer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Large circular profit indicator */}
          <div
            className={`relative w-48 h-48 rounded-full border-8 ${profitData.borderColor} ${profitData.bgColor} flex items-center justify-center`}
          >
            <div className="text-center">
              <div className={`text-5xl font-bold ${profitData.color} animate-profit`}>
                {profitData.profitMargin.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Profit Margin</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-base">
              <span className="text-muted-foreground">Quoted Price:</span>
              <span className="font-semibold">${quotedPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-base">
              <span className="text-muted-foreground">Total Costs:</span>
              <span className="font-semibold">${totalCosts.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Profit:</span>
              <span className={`font-bold ${profitData.color}`}>
                ${profitData.profit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Profit guidance */}
          <div className="w-full text-sm text-center text-muted-foreground">
            {profitData.profitMargin >= 40 && "Excellent profit margin! 🎯"}
            {profitData.profitMargin >= 20 && profitData.profitMargin < 40 && "Good profit margin ✓"}
            {profitData.profitMargin < 20 && profitData.profitMargin > 0 && "Low profit margin - review costs ⚠️"}
            {profitData.profitMargin <= 0 && "Loss on this job! 🚨"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
