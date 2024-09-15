import { useMutation, useQuery } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.PROD ? "https://astralaunch-production.up.railway.app" : "http://localhost:8080";

// Types

interface CreateNode {
  name: string;
  instance_type: string;
  is_validator?: boolean;
}

interface LogEntry {
  sequence: number;
  timestamp: number;
  type: "unknown" | "stdout" | "diagnostic" | "resource_pre" | "resource_outputs" | "resource_op_failed" | "summary";
  message?: string;
  severity?: string;
  resource_urn?: string;
  operation?: string;
  outputs?: Record<string, unknown>;
  error?: string;
  result?: string;
}

interface Node {
  _id: string;
  name: string;
  instance_type: string;
  instance_info: { vcpu: number; memory: number; storage: number; network_performance: string; description: string };
  is_validator: boolean;
  status: "Provisioning" | "Running" | "Error";
  created_at: number;
  updated_at: number;
  owner: string;
  logs: LogEntry[];
  public_ip?: string;
  public_dns?: string;
  error?: string;
}

interface AccountSettings {
  send_email_notification: boolean;
  telegram_handle?: string;
  notification_email?: string;
  aws_access_key?: string;
  aws_secret_key?: string;
}

interface UserInfo {
  address: string;
  settings: AccountSettings;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "An error occurred");
  }
  return response.json();
};

const getAuthHeader = (address?: `0x${string}`) => {
  if (address) {
    const authItem = localStorage.getItem(`sig:${address}`);
    if (authItem) {
      return { Authorization: authItem };
    }
  }
  throw new Error("No authorization found");
};

// API functions

export const useUserInfo = (address?: `0x${string}`) => {
  return useQuery<UserInfo>({
    queryKey: ["userInfo", address],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/accounts/info`, {
        headers: getAuthHeader(address),
      });
      return handleResponse(response);
    },
    retry: 1,
  });
};

export const useCreateNode = () => {
  return useMutation({
    mutationFn: async ({ node, address }: { node: CreateNode; address?: `0x${string}` }) => {
      const response = await fetch(`${API_BASE_URL}/nodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(address),
        },
        body: JSON.stringify(node),
      });
      return handleResponse(response);
    },
    // throwOnError: true,
  });
};

export const useListNodes = (address?: `0x${string}`) => {
  return useQuery<Node[]>({
    queryKey: ["nodes", address],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/nodes`, {
        headers: getAuthHeader(address),
      });
      return handleResponse(response);
    },
    retry: 1,
  });
};

export const useRetrieveNode = (nodeId: string, address?: `0x${string}`) => {
  return useQuery<Node>({
    queryKey: ["node", nodeId, address],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}`, {
        headers: getAuthHeader(address),
      });
      return handleResponse(response);
    },
    retry: 1,
  });
};

export const useDeleteNode = () => {
  return useMutation({
    mutationFn: async ({ nodeId, address }: { nodeId: string; address?: `0x${string}` }) => {
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}`, {
        method: "DELETE",
        headers: getAuthHeader(address),
      });
      return handleResponse(response);
    },
  });
};

export const useUpdateAccountSettings = () => {
  return useMutation({
    mutationFn: async ({ settings, address }: { settings: AccountSettings; address?: `0x${string}` }) => {
      const response = await fetch(`${API_BASE_URL}/accounts/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(address),
        },
        body: JSON.stringify(settings),
      });
      return handleResponse(response);
    },
  });
};
