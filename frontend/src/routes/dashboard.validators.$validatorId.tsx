import ErrorState from "@/components/error";
import LogEntry from "@/components/log-entry";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDeleteNode, useRetrieveNode } from "@/lib/api";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { format, fromUnixTime } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Loader2,
  Network,
  Trash2,
} from "lucide-react";
import type React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAccount } from "wagmi";

const ValidatorDetailPage: React.FC = () => {
  const { validatorId } = useParams({
    from: "/dashboard/validators/$validatorId",
  });
  const { toast } = useToast();
  const { address } = useAccount();
  const navigate = useNavigate();
  const { data: node, isLoading, isError, refetch } = useRetrieveNode(validatorId, address);
  const deleteNodeMutation = useDeleteNode();

  const formatMemoryGB = (memory: number): string => `${memory} GiB`;
  const formatStorageGB = (storage: number): string => `${storage} GB`;

  const handleDeleteNode = () => {
    toast({
      title: "Are you sure you want to delete this node?",
      description: "This action cannot be undone.",
      action: (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            deleteNodeMutation.mutate(
              { nodeId: validatorId, address },
              {
                onSuccess: () => {
                  navigate({ to: "/dashboard/validators" });
                  toast({ title: "Node deleted successfully" });
                },
                onError: (error) => {
                  toast({
                    title: "Failed to delete node",
                    description: error.message,
                    variant: "destructive",
                  });
                },
              },
            );
          }}
        >
          Confirm Delete
        </Button>
      ),
    });
  };

  const dummyPerformanceData = [
    { name: "00:00", cpu: 40, memory: 50 },
    { name: "04:00", cpu: 30, memory: 40 },
    { name: "08:00", cpu: 60, memory: 70 },
    { name: "12:00", cpu: 50, memory: 60 },
    { name: "16:00", cpu: 70, memory: 80 },
    { name: "20:00", cpu: 45, memory: 55 },
    { name: "23:59", cpu: 55, memory: 65 },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !node) {
    return (
      <ErrorState
        title="Node Not Found"
        message="The node doesn't exist or couldn't be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{node.name}</h1>
          <p className="text-muted-foreground">ID: {node._id}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={
              node.status === "Running" ? "default" : node.status === "Provisioning" ? "secondary" : "destructive"
            }
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
              <DropdownMenuItem onClick={handleDeleteNode} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Node
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {node.status === "Provisioning" && (
        <Card className="bg-gray-50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-600 mr-2" />
                <span className="font-semibold text-lg">Node Provisioning</span>
              </div>
              <span className="text-sm bg-gray-200 text-gray-600 py-1 px-3 rounded-full">In Progress</span>
            </div>
            <Progress value={100} className="w-full h-2 bg-gray-200 mb-4" />
            <p className="text-gray-500">
              Your node is being set up. This may take several hours. Check back anytime for updates.
            </p>
          </CardContent>
        </Card>
      )}

      {(node.public_ip || node.public_dns) && (
        <Card className="bg-white text-black mb-8">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 mr-4" />
              <div>
                {node.public_ip && (
                  <div className="flex items-center mb-2">
                    <span className="font-semibold mr-2">Public IP:</span>
                    <a
                      href={`http://${node.public_ip}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:underline"
                    >
                      {node.public_ip}
                    </a>
                  </div>
                )}
                {node.public_dns && (
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Public DNS:</span>
                    <a
                      href={`http://${node.public_dns}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:underline"
                    >
                      {node.public_dns}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Instance Type" value={node.instance_type} icon={Cpu} description="Server configuration" />
        <StatCard
          title="Network Performance"
          value={node.instance_info.network_performance}
          icon={Network}
          description="Network capability"
        />
        <StatCard
          title="Last Updated"
          value={format(fromUnixTime(node.updated_at), "PPp")}
          icon={Clock}
          description="Most recent change"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
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
                <SpecItem icon={Cpu} label="vCPU" value={`${node.instance_info.vcpu} cores`} />
                <SpecItem icon={Database} label="Memory" value={formatMemoryGB(node.instance_info.memory)} />
                <SpecItem icon={HardDrive} label="Storage" value={formatStorageGB(node.instance_info.storage)} />
                <SpecItem icon={Network} label="Network" value={node.instance_info.network_performance} />
                <SpecItem icon={Clock} label="Created" value={format(fromUnixTime(node.created_at), "PPp")} />
                <SpecItem
                  icon={node.is_validator ? CheckCircle2 : AlertCircle}
                  label="Validator"
                  value={node.is_validator ? "Yes" : "No"}
                />
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
                {node.logs.map((log, index) => (
                  // @ts-ignore
                  <LogEntry key={index} log={log} />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dummyPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU Usage (%)" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory Usage (%)" />
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
  icon: React.ElementType;
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

const SpecItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex items-center space-x-2">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <span className="font-medium">{label}:</span>
    <span>{value}</span>
  </div>
);

// const LogEntry = ({ log }: { log: any }) => (
//   <div className="mb-4 p-3 rounded-lg bg-muted">
//     <div className="flex items-center justify-between mb-2">
//       <div className="flex items-center">
//         {log.type === "stdout" && <Activity className="mr-2 h-4 w-4 text-blue-500" />}
//         {log.type === "resource_outputs" && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
//         {log.type === "diagnostic" && <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />}
//         {log.type === "resource_op_failed" && <AlertCircle className="mr-2 h-4 w-4 text-red-500" />}
//         <span className="font-medium">{log.message || log.type}</span>
//       </div>
//       <span className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
//     </div>
//     {log.details && <p className="text-sm text-muted-foreground">{log.details}</p>}
//   </div>
// );

export const Route = createFileRoute("/dashboard/validators/$validatorId")({
  component: ValidatorDetailPage,
});
