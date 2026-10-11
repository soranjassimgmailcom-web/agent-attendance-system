export const agentJobRoles = [
  { value: "UNASSIGNED", label: "Role not assigned" },
  { value: "RECEPTION", label: "Reception" },
  { value: "INFO_DESK_AUDIT", label: "Info Desk and Audit" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "SCAN", label: "Scan" },
  { value: "TREASURY", label: "Treasury" },
  { value: "CENTER_TECHNICAL", label: "Center Technical" },
  { value: "SIMULATION_ESTIMATION", label: "Simulation and Estimation" },
] as const;

export type AgentJobRole = (typeof agentJobRoles)[number]["value"];

export const activityCategories: Record<AgentJobRole, readonly string[]> = {
  UNASSIGNED: [],
  RECEPTION: [
    "Customer visit to the company",
    "Anomaly cases",
    "SM no reading",
    "MM no reading",
    "One-shot bill",
    "Dunning",
    "Other cases",
  ],
  INFO_DESK_AUDIT: ["Customer auditing", "Inspections", "Pending cases"],
  WAREHOUSE: ["SM meter replacement", "MM meter replacement", "Meter installed", "Pending case"],
  SCAN: [
    "Move-in scan",
    "Move-out scan",
    "Change-holder scan",
    "TAPO scan",
    "Solar scan",
    "Pending case",
  ],
  TREASURY: ["OTC", "FE-Cashier", "Back End", "E-psulla", "Pending case"],
  CENTER_TECHNICAL: [
    "Softmax",
    "Multidrive",
    "Repelling online",
    "Repelling offline",
    "Pending case",
  ],
  SIMULATION_ESTIMATION: ["Simulation", "Estimation", "Pending cases"],
};

export function isAgentJobRole(value: unknown): value is AgentJobRole {
  return (
    typeof value === "string" &&
    agentJobRoles.some((jobRole) => jobRole.value === value)
  );
}

export function getAgentJobRoleLabel(value: AgentJobRole) {
  return agentJobRoles.find((jobRole) => jobRole.value === value)?.label ?? value;
}
