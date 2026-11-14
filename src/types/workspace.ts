export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceInput {
  name: string;
  description: string;
  color: string;
}