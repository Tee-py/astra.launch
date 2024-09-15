import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Database,
  Pause,
  Play,
  Server,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Mock data
const mockNodeData = {
  id: "1",
  name: "Validator Node Alpha",
  status: "Provisioning",
  type: "Validator",
  createdAt: "2023-09-15T10:00:00Z",
  specs: {
    cpu: "4 vCPU",
    memory: "16 GB",
    storage: "500 GB SSD",
  },
  performance: {
    uptime: "99.9%",
    avgResponseTime: "50ms",
    requestsPerSecond: 150,
  },
  provisioningProgress: 30,
};

const mockLogs = [
  {
    timestamp: "2023-09-15T10:00:00Z",
    type: "info",
    message: "Node deployment started",
    details: "Initializing deployment process",
  },
  {
    timestamp: "2023-09-15T10:01:30Z",
    type: "info",
    message: "Installing dependencies",
    details: "Setting up runtime environment",
  },
  {
    timestamp: "2023-09-15T10:03:00Z",
    type: "success",
    message: "Node successfully deployed",
    details: "All components installed and configured",
  },
  {
    timestamp: "2023-09-15T10:03:30Z",
    type: "info",
    message: "Starting validator process",
    details: "Initializing validator software",
  },
  {
    timestamp: "2023-09-15T10:04:00Z",
    type: "success",
    message: "Validator is now active",
    details: "Node is participating in network consensus",
  },
  {
    timestamp: "2023-09-15T12:00:00Z",
    type: "info",
    message: "Scheduled maintenance started",
    details: "Performing routine system updates",
  },
  {
    timestamp: "2023-09-15T12:15:00Z",
    type: "success",
    message: "Maintenance completed successfully",
    details: "All updates applied, system optimized",
  },
  {
    timestamp: "2023-09-15T14:30:00Z",
    type: "warning",
    message: "High CPU usage detected",
    details: "CPU utilization exceeded 80% for 5 minutes",
  },
  {
    timestamp: "2023-09-15T14:45:00Z",
    type: "info",
    message: "Optimizing node performance",
    details: "Adjusting resource allocation",
  },
  {
    timestamp: "2023-09-15T15:00:00Z",
    type: "success",
    message: "Node performance optimized",
    details: "CPU usage now within normal range",
  },
];

const generateMockChartData = () => {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      timestamp: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      requests: Math.floor(Math.random() * 200) + 50,
      responseTime: Math.floor(Math.random() * 100) + 20,
    });
  }
  return data;
};

const mockChartData = generateMockChartData();

const ValidatorDetailPage: React.FC = () => {
  // const { validatorId: id } = Route.useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [node, setNode] = useState(mockNodeData);
  const [logs, setLogs] = useState(mockLogs);
  const [chartData, setChartData] = useState(mockChartData);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setNode(mockNodeData);
      setLogs(mockLogs);
      setChartData(mockChartData);
      setIsLoading(false);
    };

    fetchData();

    // Simulate provisioning progress
    if (node.status === "Provisioning") {
      const interval = setInterval(() => {
        setNode((prevNode) => {
          const newProgress = prevNode.provisioningProgress + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return { ...prevNode, status: "Active", provisioningProgress: 100 };
          }
          return { ...prevNode, provisioningProgress: newProgress };
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [node.status]);

  const handleStatusChange = (action: "pause" | "resume" | "delete") => {
    switch (action) {
      case "pause":
        setNode({ ...node, status: "Paused" });
        toast({ title: "Node paused successfully", description: "The node has been temporarily suspended." });
        break;
      case "resume":
        setNode({ ...node, status: "Active" });
        toast({ title: "Node resumed successfully", description: "The node is now active and processing requests." });
        break;
      case "delete":
        toast({
          title: "Are you sure you want to delete this node?",
          description: "This action cannot be undone.",
          action: (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // Perform deletion logic here
                toast({ title: "Node deleted successfully" });
              }}
            >
              Confirm Delete
            </Button>
          ),
        });
        break;
    }
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{node.name}</h1>
          <p className="text-muted-foreground">ID: {node.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={node.status === "Active" ? "default" : node.status === "Provisioning" ? "secondary" : "outline"}
          >
            {node.status}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {node.status === "Active" ? (
                <DropdownMenuItem onClick={() => handleStatusChange("pause")}>
                  <Pause className="mr-2 h-4 w-4" /> Pause Node
                </DropdownMenuItem>
              ) : node.status === "Paused" ? (
                <DropdownMenuItem onClick={() => handleStatusChange("resume")}>
                  <Play className="mr-2 h-4 w-4" /> Resume Node
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => handleStatusChange("delete")} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Node
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {node.status === "Provisioning" && (
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Provisioning in progress</span>
              <span>{node.provisioningProgress}%</span>
            </div>
            <Progress value={node.provisioningProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Your node is being set up. This process typically takes 5-10 minutes.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Uptime" value={node.performance.uptime} icon={Clock} description="Last 30 days" />
        <StatCard
          title="Avg. Response Time"
          value={node.performance.avgResponseTime}
          icon={Activity}
          description="Last 24 hours"
        />
        <StatCard
          title="Requests/s"
          value={node.performance.requestsPerSecond.toString()}
          icon={Server}
          description="Average over last hour"
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Node Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Cpu className="mr-2 h-4 w-4" />
                  <span className="font-medium">CPU:</span>
                  <span className="ml-2">{node.specs.cpu}</span>
                </div>
                <div className="flex items-center">
                  <Database className="mr-2 h-4 w-4" />
                  <span className="font-medium">Memory:</span>
                  <span className="ml-2">{node.specs.memory}</span>
                </div>
                <div className="flex items-center">
                  <Database className="mr-2 h-4 w-4" />
                  <span className="font-medium">Storage:</span>
                  <span className="ml-2">{node.specs.storage}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="font-medium">Created:</span>
                  <span className="ml-2">{new Date(node.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Node Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {logs.map((log, index) => (
                  <div key={index} className="mb-4 p-3 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {log.type === "info" && <Activity className="mr-2 h-4 w-4 text-blue-500" />}
                        {log.type === "success" && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
                        {log.type === "warning" && <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />}
                        {log.type === "error" && <AlertCircle className="mr-2 h-4 w-4 text-red-500" />}
                        <span className="font-medium">{log.message}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics (Last 24 Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#8884d8" name="Requests" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#82ca9d"
                      name="Resp. Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: typeof Activity;
  description: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

const SkeletonLoader: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-64" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2" />
                    <Skeleton className="h-4 w-24 mr-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2" />
                    <Skeleton className="h-4 w-32 mr-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const Route = createFileRoute("/dashboard/validators/$validatorId")({
  component: ValidatorDetailPage,
});
