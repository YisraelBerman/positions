import React from 'react';
import { cn } from "../../lib/utils";

const Alert = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border p-4",
        {
          "bg-red-50 text-red-700 border-red-200": variant === "destructive",
          "bg-gray-50 text-gray-700 border-gray-200": variant === "default",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const AlertDescription = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
};

export { Alert, AlertDescription };