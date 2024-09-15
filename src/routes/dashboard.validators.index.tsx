import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Link, createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Clock, HelpCircle, Loader2, Server } from "lucide-react";
import { useState } from "react";

interface Node {
  id: number;
  name: string;
  status: "Active" | "Pending" | "Inactive" | "Error";
  instanceType: string;
  startTime: Date;
  isValidator: boolean;
}

const EC2_INSTANCE_TYPES = [
  "t3.micro",
  "t3.small",
  "t3.medium",
  "t3.large",
  "c5.large",
  "c5.xlarge",
  "r5.large",
  "r5.xlarge",
  "m5.large",
  "m5.xlarge",
];

const STATUS_COLORS = {
  Active: "bg-green-500 hover:bg-green-500",
  Pending: "bg-yellow-500 hover:bg-yellow-500",
  Inactive: "bg-gray-500 hover:bg-gray-500",
  Error: "bg-red-500 hover:bg-red-500",
};

function NodesAndValidators() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 1,
      name: "Orion",
      status: "Active",
      instanceType: "t3.medium",
      startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isValidator: false,
    },
    {
      id: 2,
      name: "Cassiopeia",
      status: "Pending",
      instanceType: "c5.large",
      startTime: new Date(),
      isValidator: false,
    },
    {
      id: 3,
      name: "Andromeda",
      status: "Inactive",
      instanceType: "t3.small",
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isValidator: false,
    },
    {
      id: 4,
      name: "Centaurus",
      status: "Error",
      instanceType: "r5.large",
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isValidator: false,
    },
    {
      id: 5,
      name: "Pegasus",
      status: "Active",
      instanceType: "m5.large",
      startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      isValidator: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateNode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const instanceType = formData.get("instanceType") as string;

    if (!name || !instanceType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newNode: Node = {
        id: nodes.length + 1,
        name,
        status: "Pending",
        instanceType,
        startTime: new Date(),
        isValidator: false,
      };
      setNodes([...nodes, newNode]);
      toast({
        title: "Success",
        description: `Node "${name}" created successfully.`,
      });
      setIsDialogOpen(false);

      // TODO: Implement redirection to the node detail page
      // Example:
      // navigate(`/dashboard/nodes/${newNode.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create node. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nodes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Node</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Node</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNode} className="space-y-4">
              <div>
                <Label htmlFor="name">Node Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="instanceType">EC2 Instance Type</Label>
                <Select name="instanceType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instance type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EC2_INSTANCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                <Switch id="isValidator" name="isValidator" disabled />
                <div className="flex-grow">
                  <Label htmlFor="isValidator" className="text-sm font-medium">
                    Validator Node
                  </Label>
                  <p className="text-xs text-muted-foreground">Run this node as a validator (Coming Soon)</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Validator nodes help secure the network and earn rewards. This feature will be available in a
                        future update.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Node"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node) => (
          <Card key={node.id} className="overflow-hidden">
            <CardHeader className="bg-secondary">
              <CardTitle className="flex justify-between items-center">
                <span>{node.name}</span>
                <Badge className={`${STATUS_COLORS[node.status]} text-white`}>{node.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Server className="w-4 h-4 mr-2" />
                  <span className="text-sm">Instance: {node.instanceType}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">Uptime: {formatDistanceToNow(node.startTime, { addSuffix: true })}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/dashboard/validators/$validatorId" params={{ validatorId: String(node.id) }}>
                  View Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export const Route = createFileRoute("/dashboard/validators/")({
  component: NodesAndValidators,
});
