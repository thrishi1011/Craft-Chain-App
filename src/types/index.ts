export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'Miner' | 'Crafter' | 'Planner';
  createdAt: Date;
}

export interface Enchantment {
  name: string;
  level: number;
  extraResourceCost: number; // percentage increase
}

export const ENCHANTMENT_OPTIONS = [
  { name: 'Efficiency', maxLevel: 5, costPct: 10, description: 'Faster gathering' },
  { name: 'Unbreaking', maxLevel: 3, costPct: 15, description: 'Increased durability' },
  { name: 'Fortune', maxLevel: 3, costPct: 20, description: 'More drops' },
  { name: 'Sharpness', maxLevel: 5, costPct: 10, description: 'Extra damage' },
  { name: 'Protection', maxLevel: 4, costPct: 12, description: 'Reduced damage' },
  { name: 'Mending', maxLevel: 1, costPct: 25, description: 'XP repairs' },
] as const;

export interface RequiredItem {
  id: string;
  name: string;
  quantityRequired: number;
  quantityCollected: number;
  contributions: Contribution[];
  dependencies?: RequiredItem[];
  enchantment?: Enchantment;
  parentId?: string;
}

export interface Contribution {
  userId: string;
  username: string;
  quantity: number;
  timestamp: Date;
}

export interface ActivityEntry {
  id: string;
  type: 'contribution' | 'item_completed' | 'project_completed' | 'member_joined' | 'member_removed' | 'project_created' | 'code_regenerated' | 'enchantment_added' | 'plan_updated';
  message: string;
  username: string;
  timestamp: Date;
}

export interface VersionEntry {
  version: number;
  changedBy: string;
  timestamp: Date;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  finalItem: string;
  ownerId: string;
  ownerUsername: string;
  inviteCode: string;
  members: ProjectMember[];
  items: RequiredItem[];
  activity: ActivityEntry[];
  createdAt: Date;
  completedAt?: Date;
  version: number;
  versionHistory: VersionEntry[];
}

export interface ProjectMember {
  userId: string;
  username: string;
  role: 'Miner' | 'Crafter' | 'Planner';
  joinedAt: Date;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  createdAt: Date;
}

export type ViewType = 'landing' | 'login' | 'signup' | 'dashboard' | 'project';
