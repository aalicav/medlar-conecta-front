import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import React from "react";

type StepStatus = "completed" | "rejected" | "current" | "pending";

interface StepProps {
  title: string;
  description?: string;
  status: StepStatus;
  icon?: React.ReactNode;
}

export function Step({ title, description, status, icon }: StepProps) {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-500 border-green-500";
      case "rejected":
        return "text-red-500 border-red-500";
      case "current":
        return "text-blue-500 border-blue-500";
      default:
        return "text-gray-400 border-gray-300";
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-100";
      case "rejected":
        return "bg-red-100";
      case "current":
        return "bg-blue-100";
      default:
        return "bg-gray-100";
    }
  };

  const getDefaultIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5" />;
      case "rejected":
        return <XCircle className="h-5 w-5" />;
      case "current":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex items-start">
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 border-2",
          getStatusColor(),
          getBackgroundColor()
        )}
      >
        {icon || getDefaultIcon()}
      </div>
      <div className="flex-grow">
        <h4 className={cn("font-medium", getStatusColor())}>{title}</h4>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

interface StepperProps {
  children: React.ReactNode;
  className?: string;
}

export function Stepper({ children, className }: StepperProps) {
  const steps = React.Children.toArray(children);

  return (
    <div className={cn("space-y-6", className)}>
      {steps.map((step, index) => (
        <div key={index} className="relative">
          {index < steps.length - 1 && (
            <div className="absolute top-10 left-5 h-full w-0 border-l-2 border-dashed border-gray-300 -z-10" />
          )}
          {step}
        </div>
      ))}
    </div>
  );
} 