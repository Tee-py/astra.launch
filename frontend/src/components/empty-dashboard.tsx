import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wallet } from "lucide-react";

const EmptyState = () => (
  <div className="h-full flex items-center justify-center">
    <Card className="w-full max-w-md text-center">
      <CardHeader />
      <CardContent>
        <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-6">Connect your wallet to view your dashboard and manage your nodes.</p>
      </CardContent>
    </Card>
  </div>
);

export default EmptyState;
