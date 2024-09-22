import { type ApiflyDefinition } from "@vseplet/apifly/types";

export type GuardenDefinition = ApiflyDefinition<
  {
    token: string | null;
    currentEnv: string | null;
    secrets: Record<string, Record<string, string>>;
  },
  {
    generateToken: {
      args: [userId: string];
      returns: { success: boolean; message: string; token: string };
    };
    selectEnvironment: {
      args: [envName: string];
      returns: { success: boolean; message: string };
    };
    createEnvironment: {
      args: [envName: string];
      returns: { success: boolean; message: string };
    };
    fetchSecrets: {
      args: [envName: string];
      returns: {
        currentEnv: string;
        success: boolean;
        secrets?: Record<string, string>;
        message?: string;
      };
    };
    addSecret: {
      args: [envName: string, key: string, value: string];
      returns: { success: boolean; message: string };
    };
    updateSecret: {
      args: [envName: string, key: string, value: string];
      returns: { success: boolean; message: string };
    };
    deleteSecret: {
      args: [envName: string, key: string];
      returns: { success: boolean; message: string };
    };
    getCurrentEnvironment: {
      args: [];
      returns: { success: boolean; currentEnv: string | null };
    };
    getEnvironments: {
      args: [];
      returns: { success: boolean; environments: string[] };
    };
  },
  {
    token: string;
  }
>;
