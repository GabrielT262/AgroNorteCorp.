"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FuelType } from "@/lib/types";
import { Droplet, Fuel } from "lucide-react";

interface FuelGaugeProps {
  fuelType: FuelType;
  currentLevel: number;
  maxLevel: number;
  className?: string;
}

export function FuelGauge({ fuelType, currentLevel, maxLevel, className }: FuelGaugeProps) {
  const displayLevel = typeof currentLevel === 'number' ? currentLevel : 0;
  const percentage = Math.max(0, Math.min(100, (displayLevel / maxLevel) * 100));

  const isDiesel = fuelType === 'Petróleo';
  const color = isDiesel ? 'text-destructive' : 'text-primary';
  const bgColor = isDiesel ? 'bg-destructive' : 'bg-primary';
  const Icon = isDiesel ? Droplet : Fuel;

  return (
    <Card className={cn("w-full max-w-sm", className)}>
        <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
                <CardTitle className="text-xl">{fuelType}</CardTitle>
                <p className="text-muted-foreground text-sm">Tanque Principal</p>
            </div>
            <Icon className={cn("h-8 w-8", color)} />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 pt-0">
             <div className="w-full bg-muted rounded-full h-4 dark:bg-muted/50 overflow-hidden">
                <div className={cn("h-4 rounded-full transition-all duration-500", bgColor)} style={{ width: `${percentage}%` }} />
            </div>
            <div className="text-center">
                <span className="text-3xl font-bold">{displayLevel.toFixed(1)}</span>
                <span className="text-lg text-muted-foreground"> / {maxLevel} gal</span>
            </div>
        </CardContent>
    </Card>
  );
}
