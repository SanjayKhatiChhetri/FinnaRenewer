import type { FinnaInstance, FinnaInstanceId } from "./types";

export const FINNA_INSTANCES: Record<FinnaInstanceId, FinnaInstance> = {
  outi: {
    id: "outi",
    name: "Oulu City - OUTI",
    baseUrl: "https://outi.finna.fi",
    authMethod: "MultiILS",
  },
  oula: {
    id: "oula",
    name: "Oulu Uni - OULA",
    baseUrl: "https://oula.finna.fi",
    authMethod: "Database",
  },
};

export const DEFAULT_INSTANCE: FinnaInstanceId = "outi";

export function getFinnaInstance(id: string): FinnaInstance {
  const instance = FINNA_INSTANCES[id as FinnaInstanceId];
  if (!instance) throw new Error(`Unknown Finna instance: ${id}`);
  return instance;
}

export function isValidInstanceId(id: string): id is FinnaInstanceId {
  return id in FINNA_INSTANCES;
}
