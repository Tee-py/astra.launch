import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export const Route = createFileRoute("/dashboard/settings")({
  component: Settings,
});

const SkeletonCard = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-5/6h" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);

function Settings() {
  const { toast } = useToast();
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [debouncedEmailNotifications] = useDebounce(emailNotifications, 500);

  const fetchSettings = useCallback(async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setEmailNotifications(true);
      setAccessKey("dnnsddddd");
      setSecretKey("nrowjfrowjfwojfrowij");
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const updateEmailNotifications = async () => {
      // Simulating an API call to update email notifications
      console.log("Updating email notifications:", debouncedEmailNotifications);
      // Implement actual update logic here
    };
    updateEmailNotifications();
  }, [debouncedEmailNotifications]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulating an API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Settings saved:", { emailNotifications, accessKey, secretKey });
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/4" />
        <SkeletonCard />
        <SkeletonCard />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            <Label htmlFor="email-notifications">Receive email notifications</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AWS Configuration</CardTitle>
          <CardDescription>Manage your AWS access credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-key">Access Key</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="access-key"
                type={showAccessKey ? "text" : "password"}
                placeholder="Enter your AWS Access Key"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="flex-grow"
              />
              <Button variant="outline" size="icon" onClick={() => setShowAccessKey(!showAccessKey)}>
                {showAccessKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret-key">Secret Key</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="secret-key"
                type={showSecretKey ? "text" : "password"}
                placeholder="Enter your AWS Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="flex-grow"
              />
              <Button variant="outline" size="icon" onClick={() => setShowSecretKey(!showSecretKey)}>
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
        {(accessKey || secretKey) && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAccessKey("");
                setSecretKey("");
              }}
            >
              Clear AWS Credentials
            </Button>
          </CardFooter>
        )}
      </Card>

      <Button onClick={handleSaveSettings} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </div>
  );
}
