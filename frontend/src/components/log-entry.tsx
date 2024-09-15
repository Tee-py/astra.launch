import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, fromUnixTime } from "date-fns";
import { Activity, AlertCircle, ChevronDown, ChevronUp, Clock, HelpCircle, Play, XCircle } from "lucide-react";
import { type FC, useState } from "react";

interface LogEntryProps {
  log: {
    type: "stdout" | "diagnostic" | "resource_pre" | "resource_op_failed";
    message?: string;
    timestamp: number;
    sequence: number;
    severity?: string;
    resource_urn?: string;
    operation?: string;
    error?: string;
  };
}

const logTypeConfig = {
  stdout: { icon: Activity, color: "blue", label: "Output" },
  resource_pre: { icon: Play, color: "green", label: "Resource Pre" },
  diagnostic: { icon: AlertCircle, color: "yellow", label: "Diagnostic" },
  resource_op_failed: { icon: XCircle, color: "red", label: "Operation Failed" },
};

const MAX_MESSAGE_LENGTH = 150;

const LogEntry: FC<LogEntryProps> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { icon: Icon, color, label } = logTypeConfig[log.type] || { icon: HelpCircle, color: "gray", label: "Unknown" };

  const truncatedMessage =
    log.message && log.message.length > MAX_MESSAGE_LENGTH
      ? `${log.message.substring(0, MAX_MESSAGE_LENGTH)}...`
      : log.message;

  const renderDetails = () => {
    switch (log.type) {
      case "diagnostic":
        return `Severity: ${log.severity}`;
      case "resource_pre":
      case "resource_op_failed":
        return `Resource: ${log.resource_urn}\nOperation: ${log.operation}${log.error ? `\nError: ${log.error}` : ""}`;
      default:
        return null;
    }
  };

  return (
    <Card
      className="mb-3 overflow-hidden transition-all duration-200 hover:shadow-md border-l-4"
      style={{ borderLeftColor: `var(--${color}-500)` }}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className={`h-4 w-4 text-${color}-500 flex-shrink-0`} />
            <Badge variant="secondary" className={`bg-${color}-100 text-${color}-800 text-xs px-2 py-0.5`}>
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">#{log.sequence}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Clock className="h-3 w-3 mr-1" />
                <span>{format(fromUnixTime(log.timestamp), "MMM d, HH:mm")}</span>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{format(fromUnixTime(log.timestamp), "PPpp")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-1">
          {log.message && (
            <>
              <p className="text-sm leading-relaxed text-foreground/90 break-words">
                {isExpanded ? log.message : truncatedMessage}
              </p>
              {log.message.length > MAX_MESSAGE_LENGTH && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-0 h-6 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          {renderDetails() && (
            <div className="mt-2 bg-muted/50 p-2 rounded-sm text-xs text-muted-foreground">
              <p className="whitespace-pre-wrap">{renderDetails()}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LogEntry;
