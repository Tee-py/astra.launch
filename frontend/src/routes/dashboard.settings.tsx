import ErrorState from "@/components/error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAccountSettings, useUserInfo } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CloudCog, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export const Route = createFileRoute("/dashboard/settings")({
  component: Settings,
});

const SkeletonCard = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);

function Settings() {
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    send_email_notification: false,
    notification_email: "",
    aws_access_key: "",
    aws_secret_key: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    aws: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { address } = useAccount();

  const { data: userInfo, isLoading, error, refetch } = useUserInfo(address);
  const updateSettingsMutation = useUpdateAccountSettings();

  useEffect(() => {
    if (userInfo) {
      setLocalSettings({
        send_email_notification: userInfo.settings.send_email_notification,
        notification_email: userInfo.settings.notification_email || "",
        aws_access_key: userInfo.settings.aws_access_key || "",
        aws_secret_key: userInfo.settings.aws_secret_key || "",
      });
    }
  }, [userInfo]);

  const validateSettings = () => {
    const newErrors = { email: "", aws: "" };

    if (localSettings.send_email_notification && !isValidEmail(localSettings.notification_email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (localSettings.aws_access_key || localSettings.aws_secret_key) {
      if (!localSettings.aws_access_key || !localSettings.aws_secret_key) {
        newErrors.aws = "Both AWS Access Key and Secret Key must be provided";
      }
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.aws;
  };

  const handleSaveSettings = async () => {
    if (!validateSettings()) return;

    try {
      const settingsToUpdate = {
        send_email_notification: localSettings.send_email_notification,
        notification_email: localSettings.send_email_notification ? localSettings.notification_email : undefined,
        aws_access_key: localSettings.aws_access_key || undefined,
        aws_secret_key: localSettings.aws_secret_key || undefined,
      };

      await updateSettingsMutation.mutateAsync({
        settings: settingsToUpdate,
        address,
      });
      queryClient.invalidateQueries({ queryKey: ["userInfo", address] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailNotificationChange = (checked: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      send_email_notification: checked,
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setLocalSettings((prev) => ({ ...prev, notification_email: email }));
    setErrors((prev) => ({ ...prev, email: "" }));
  };

  const handleAwsCredentialChange = (field: "aws_access_key" | "aws_secret_key", value: string) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, aws: "" }));
  };

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
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

  if (error) {
    return (
      <ErrorState
        title="Settings Unavailable"
        message=" We're having trouble loading your settings. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(userInfo?.settings);
  const hasErrors = !!errors.email || !!errors.aws;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">
            <Mail className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="aws">
            <CloudCog className="mr-2 h-4 w-4" />
            AWS Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive updates and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Switch
                  id="email-notifications"
                  checked={localSettings.send_email_notification}
                  onCheckedChange={handleEmailNotificationChange}
                />
                <div>
                  <Label htmlFor="email-notifications" className="font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                </div>
              </div>
              {localSettings.send_email_notification && (
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={localSettings.notification_email}
                    onChange={handleEmailChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="aws">
          <Card>
            <CardHeader>
              <CardTitle>AWS Credentials</CardTitle>
              <CardDescription>Securely manage your AWS access keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  Storing AWS credentials here poses security risks. Consider using IAM roles for enhanced security.
                  <a
                    href="https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline ml-1"
                  >
                    Learn about AWS IAM best practices
                  </a>
                  .
                </AlertDescription>
              </Alert>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-key">Access Key</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="access-key"
                      type={showAccessKey ? "text" : "password"}
                      placeholder="Enter your AWS Access Key"
                      value={localSettings.aws_access_key}
                      onChange={(e) => handleAwsCredentialChange("aws_access_key", e.target.value)}
                      className={`flex-grow ${errors.aws ? "border-red-500" : ""}`}
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
                      value={localSettings.aws_secret_key}
                      onChange={(e) => handleAwsCredentialChange("aws_secret_key", e.target.value)}
                      className={`flex-grow ${errors.aws ? "border-red-500" : ""}`}
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowSecretKey(!showSecretKey)}>
                      {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {errors.aws && <p className="text-sm text-red-500">{errors.aws}</p>}
              </div>
              {(localSettings.aws_access_key || localSettings.aws_secret_key) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setLocalSettings((prev) => ({
                      ...prev,
                      aws_access_key: "",
                      aws_secret_key: "",
                    }));
                    setErrors((prev) => ({ ...prev, aws: "" }));
                  }}
                  className="mt-4"
                >
                  Clear AWS Credentials
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleSaveSettings}
        disabled={updateSettingsMutation.isPending || !hasChanges || hasErrors}
        className="w-full"
      >
        {updateSettingsMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save All Settings"
        )}
      </Button>
    </div>
  );
}
