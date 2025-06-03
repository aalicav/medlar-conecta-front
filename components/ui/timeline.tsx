import * as React from "react";
import { cn } from "@/lib/utils";

const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  />
));
Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isLast?: boolean }
>(({ className, isLast, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex gap-3", className)}
    {...props}
  />
));
TimelineItem.displayName = "TimelineItem";

const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-center", className)}
    {...props}
  />
));
TimelineHeader.displayName = "TimelineHeader";

const TimelineDot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
TimelineDot.displayName = "TimelineDot";

const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-full w-px bg-border", className)}
    {...props}
  />
));
TimelineConnector.displayName = "TimelineConnector";

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 pt-1", className)}
    {...props}
  />
));
TimelineContent.displayName = "TimelineContent";

export {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
}; 