import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { config } from "@/wagmi";
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { signMessage } from "@wagmi/core";
import {
  Activity,
  ArrowUpRight,
  Clock,
  CpuIcon,
  Database,
  Github,
  Globe,
  Home,
  MessageCircle,
  Server,
  Settings,
  ShieldCheck,
  Twitter,
  Zap,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const NavItem = ({ href, icon: Icon, children }: { href: string; icon: typeof Home; children: ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={`w-full justify-start text-lg ${isActive ? "bg-secondary" : ""} p-6`}
      asChild
    >
      <Link to={href}>
        <Icon className="mr-3 h-5 w-5" />
        {children}
      </Link>
    </Button>
  );
};

const ExternalLink = ({ href, icon: Icon, children }: { href: string; icon: typeof Github; children: string }) => (
  <Button variant="ghost" className="w-full justify-start text-base group p-0 h-auto hover:bg-accent" asChild>
    <Link to={href} target="_blank" rel="noopener noreferrer" className="py-2 px-3 flex items-center w-full">
      <Icon className="mr-3 h-5 w-5" />
      {children}
      <ArrowUpRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
    </Link>
  </Button>
);

const DashboardLayout = () => {
  const { toast } = useToast();
  const location = useLocation();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<Record<string, string | number> | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDashboardData({
        totalNodes: 5,
        activeNodes: 4,
        totalCapacity: 500,
        avgReqPerSec: 150,
        uptime: 99.9,
        avgResponseTime: 50,
        totalValidators: 2,
        networkCoverage: 1,
      });
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const handleConnect = async () => {
    try {
      await connect(
        { connector: connectors[0] },
        {
          async onSuccess({ accounts }) {
            const message = "Welcome to astra.launch! Please sign this message to continue";
            const signature = signMessage(config, {
              account: accounts[0],
              message,
            });
            localStorage.setItem(`sig:${accounts[0].toLowerCase()}`, `${accounts[0]}:${signature}`);
          },
        },
      );
    } catch (error) {
      toast({ title: "Failed to connect wallet or sign message. Please try again.", variant: "destructive" });
    }
  };

  const handleDisconnect = () => {
    if (address) {
      localStorage.removeItem(`sig:${address.toLowerCase()}`);
    }
    disconnect();
    toast({ title: "Wallet disconnected successfully." });
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-72 bg-card p-6 flex flex-col shadow-md">
        <div className="flex items-center mb-10">
          <div className="w-10 h-10 bg-primary rounded-full mr-3" />
          <Link to="/">
            <h1 className="text-3xl font-bold">astra.launch</h1>
          </Link>
        </div>
        <nav className="space-y-3 mb-auto">
          <NavItem href="/dashboard" icon={Home}>
            Dashboard
          </NavItem>
          <NavItem href="/dashboard/validators" icon={Server}>
            Nodes & Validators
          </NavItem>
          <NavItem href="/dashboard/settings" icon={Settings}>
            Settings
          </NavItem>
        </nav>
        <div className="mt-auto space-y-2">
          <ExternalLink href="https://github.com/Tee-py/astra.launch" icon={Github}>
            GitHub
          </ExternalLink>
          <ExternalLink href="https://x.com/devteepy" icon={Twitter}>
            Twitter
          </ExternalLink>
          <ExternalLink href="https://github.com/Tee-py/astra.launch/issues/new" icon={MessageCircle}>
            Report Issue
          </ExternalLink>
          <div className="py-2 text-center">
            <span className="text-small text-gray-500 font-semibold">v1.0.0</span>
          </div>
          <div className="flex justify-center">
            {isConnected ? (
              <div className="w-full">
                <Button onClick={handleDisconnect} variant="destructive" className="w-full">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} variant="default" className="w-full">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {location.pathname === "/dashboard" ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">
                Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
              </h1>
              <Button asChild>
                <Link to="/dashboard/validators">Manage Nodes</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Nodes"
                value={dashboardData?.totalNodes}
                icon={Server}
                description="Active and inactive nodes in your network"
              />
              <StatCard
                title="Active Nodes"
                value={dashboardData?.activeNodes}
                icon={Activity}
                description="Currently operational nodes"
              />
              <StatCard
                title="Total Capacity"
                value={`${dashboardData?.totalCapacity} GB`}
                icon={Database}
                description="Combined storage across all nodes"
              />
              <StatCard
                title="Network Coverage"
                value={`${dashboardData?.networkCoverage} Region`}
                icon={Globe}
                description="Geographic distribution of your nodes"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PerformanceCard
                title="Avg. Requests/s"
                value={dashboardData?.avgReqPerSec}
                icon={Zap}
                description="Average requests handled per second"
              />
              <PerformanceCard
                title="Uptime"
                value={`${dashboardData?.uptime}%`}
                icon={Clock}
                description="Overall network availability"
              />
              <PerformanceCard
                title="Avg. Response Time"
                value={`${dashboardData?.avgResponseTime}ms`}
                icon={CpuIcon}
                description="Average time to process requests"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Validator Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ValidatorCard
                  title="Active Validators"
                  value={dashboardData?.totalValidators}
                  description="Nodes securing the network"
                />
                <ValidatorTeaser />
              </div>
            </div>
          </div>
        ) : null}
        <Outlet />
      </main>
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
  value: string | number;
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

const PerformanceCard = ({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
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

const ValidatorCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const ValidatorTeaser = () => (
  <Card className="relative overflow-hidden">
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
      <Badge variant="secondary" className="text-lg py-2 px-4">
        Coming Soon
      </Badge>
    </div>
    <CardHeader>
      <CardTitle className="flex items-center">
        <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
        Become a Validator
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Secure the network and earn rewards by running a validator node</p>
    </CardContent>
  </Card>
);

const SkeletonDashboard = () => {
  const SkeletonCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[100px] mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );

  const SkeletonSidebarItem = () => <Skeleton className="w-full h-12 mb-3" />;

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-72 bg-card p-6 flex flex-col shadow-md">
        <div className="flex items-center mb-10">
          <Skeleton className="w-10 h-10 rounded-full mr-3" />
          <Skeleton className="h-8 w-32" />
        </div>
        <nav className="space-y-3 mb-auto">
          <SkeletonSidebarItem />
          <SkeletonSidebarItem />
          <SkeletonSidebarItem />
        </nav>
        <div className="mt-auto space-y-2">
          <SkeletonSidebarItem />
          <SkeletonSidebarItem />
          <SkeletonSidebarItem />
          <div className="py-2 flex justify-center">
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="w-full h-10" />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div>
            <Skeleton className="h-8 w-[200px] mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});
