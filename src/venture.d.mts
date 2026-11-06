export type Capability = 'product' | 'research' | 'engineering' | 'operations' | 'growth';
export type Role = 'founder' | 'coordinator' | 'builder' | 'reviewer';
export type ProjectStatus = 'draft' | 'awaiting_approval' | 'active' | 'verified' | 'completed' | 'blocked' | 'rejected';
export type TaskStatus = 'ready' | 'in_progress' | 'in_review' | 'verified' | 'blocked';

export interface ProjectBrief {
  title: string;
  audience: string;
  scope: string;
  constraints: string[];
  assumptions: string[];
  successCriteria: string[];
  artifacts: string[];
  risks: string[];
  decisionsNeeded: string[];
}

export interface TaskPlan {
  id: string;
  title: string;
  capability: Capability;
  priority?: string;
  dependencies: string[];
  criteria: string[];
  expectedArtifacts: string[];
  requiredEvidence: string[];
}

export interface Artifact { path: string; sha256: string }
export interface Submission { id: string; artifacts: Artifact[]; commit: string | null }
export interface Task extends TaskPlan {
  owner: Role;
  status: TaskStatus;
  submission: Submission | null;
  reviews: { submission: Submission; passed: boolean; evidence: string; finding: string | null }[];
}

export interface Project {
  id: string;
  goal: string;
  version: number;
  status: ProjectStatus;
  brief: ProjectBrief | null;
  tasks: Task[];
  decisions: { version: number; action: string; reference: string }[];
  events: { id: string; hash: string; type: string; actor: Role; version: number; taskId: string | null }[];
}

type EventFields = { id: string; version: number };
export type VentureEvent = EventFields & (
  | { type: 'plan'; actor: 'coordinator'; brief: ProjectBrief; tasks: TaskPlan[] }
  | { type: 'approve' | 'reject' | 'complete'; actor: 'founder'; reference: string }
  | { type: 'start'; actor: 'builder'; taskId: string }
  | { type: 'submit'; actor: 'builder'; taskId: string; artifacts: Artifact[]; commit?: string }
  | { type: 'review'; actor: 'reviewer'; taskId: string; submissionId: string; passed: boolean; evidence: string; finding?: string }
);
export const capabilities: Capability[];
export function openVenture(path: string): {
  create(id: string, goal: string): Project;
  get(id: string): Project | null;
  append(id: string, event: VentureEvent): Project;
  events(id: string): VentureEvent[];
  close(): void;
};
export function proofPack(project: Project, events: VentureEvent[]): object;
