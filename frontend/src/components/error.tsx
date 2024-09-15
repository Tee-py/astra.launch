import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import type React from "react";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  retryButtonText?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ title, message, onRetry, retryButtonText = "Reload" }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
      <div className="text-red-500 mb-4">
        <AlertCircle size={64} />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">{message}</p>
      <Button onClick={onRetry} className="flex items-center space-x-2">
        <RefreshCw className="w-4 h-4" />
        <span>{retryButtonText}</span>
      </Button>
    </div>
  );
};

export default ErrorState;
