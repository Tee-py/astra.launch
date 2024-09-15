import EmptyNodesState from "@/components/empty-nodes";
import ErrorState from "@/components/error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useCreateNode, useListNodes } from "@/lib/api";
import { Link, createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import { Clock, HelpCircle, Loader2, Server } from "lucide-react";
import { type FC, useState } from "react";
import { useAccount } from "wagmi";

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
  Error: "bg-red-500 hover:bg-red-500",
  Running: "bg-green-500 hover:bg-green-500",
  Provisioning: "bg-yellow-500 hover:bg-yellow-500",
};

const NodesSkeleton: FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, index) => (
      <Card key={index} className="overflow-hidden">
        <CardHeader className="bg-secondary">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Skeleton className="w-4 h-4 mr-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-center">
              <Skeleton className="w-4 h-4 mr-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

function NodesAndValidators() {
  const { address } = useAccount();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const createNodeMutation = useCreateNode();
  const {
    data: nodes,
    isLoading: isLoadingNodes,
    isError: isErrorNodes,
    refetch: refetchNodes,
  } = useListNodes(address);

  const handleCreateNode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const instanceType = formData.get("instanceType") as string;
    const isValidator = formData.get("isValidator") === "on";

    if (!name || !instanceType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNodeMutation.mutateAsync({
        node: { name, instance_type: instanceType, is_validator: isValidator },
        address,
      });

      toast({
        title: "Success",
        description: `Node "${name}" created successfully.`,
      });
      setIsDialogOpen(false);
      refetchNodes(); // Refresh the list of nodes
    } catch (error) {
      toast({
        title: "Error",
        description: JSON.stringify(error),
        variant: "destructive",
      });
    }
  };

  if (isLoadingNodes) {
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Nodes</h1>
          <Skeleton className="h-10 w-28" />
        </div>
        <NodesSkeleton />
      </>
    );
  }

  if (isErrorNodes) {
    return (
      <ErrorState
        title="Nodes Unavailable"
        message=" We're having trouble loading your nodes. Please try again."
        onRetry={() => refetchNodes()}
      />
    );
  }

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
              <Button type="submit" className="w-full" disabled={createNodeMutation.isPending}>
                {createNodeMutation.isPending ? (
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

      {nodes && nodes.length === 0 ? (
        <EmptyNodesState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes?.map((node) => (
            <Card key={node._id} className="overflow-hidden">
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
                    <span className="text-sm">Instance: {node.instance_type}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      Creation Date: {formatDistanceToNow(fromUnixTime(node.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/dashboard/validators/$validatorId" params={{ validatorId: String(node._id) }}>
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export const Route = createFileRoute("/dashboard/validators/")({
  component: NodesAndValidators,
});
