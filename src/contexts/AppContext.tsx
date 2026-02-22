import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, RequiredItem, ActivityEntry, Enchantment, VersionEntry } from '@/types';
import { seedProjects } from '@/data/seedData';
import { generateId, generateInviteCode, updateItemInTree, flattenItems } from '@/utils/helpers';
import { saveProjects, loadProjects } from '@/utils/storage';

interface ContributeResult {
  success: boolean;
  error?: string;
  itemCompleted?: boolean;
  projectCompleted?: boolean;
}

interface AppContextType {
  projects: Project[];
  createProject: (data: { name: string; finalItem: string; items: RequiredItem[] }, user: { id: string; username: string; role: string }) => Project;
  joinProject: (inviteCode: string, user: { id: string; username: string; role: string }) => { success: boolean; error?: string; projectId?: string; projectName?: string };
  contribute: (projectId: string, itemId: string, qty: number, user: { id: string; username: string }) => ContributeResult;
  removeCollaborator: (projectId: string, userId: string, ownerUsername: string) => void;
  regenerateInviteCode: (projectId: string, ownerUsername: string) => string;
  addEnchantment: (projectId: string, itemId: string, enchantment: Enchantment, username: string) => boolean;
  updateProjectPlan: (projectId: string, items: RequiredItem[], user: { id: string; username: string }, description: string) => boolean;
}

const AppContext = createContext<AppContextType>(null!);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = loadProjects();
    return saved && saved.length > 0 ? saved : seedProjects;
  });

  // Persist projects on every change
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const createProject = (data: { name: string; finalItem: string; items: RequiredItem[] }, user: { id: string; username: string; role: string }): Project => {
    const project: Project = {
      id: generateId(),
      name: data.name,
      finalItem: data.finalItem,
      ownerId: user.id,
      ownerUsername: user.username,
      inviteCode: generateInviteCode(),
      members: [{ userId: user.id, username: user.username, role: user.role as any, joinedAt: new Date() }],
      items: data.items,
      activity: [{ id: generateId(), type: 'project_created', message: `${user.username} created the project`, username: user.username, timestamp: new Date() }],
      createdAt: new Date(),
      version: 1,
      versionHistory: [{ version: 1, changedBy: user.username, timestamp: new Date(), description: 'Initial plan created' }],
    };
    setProjects(prev => [...prev, project]);
    return project;
  };

  const joinProject = (inviteCode: string, user: { id: string; username: string; role: string }) => {
    const project = projects.find(p => p.inviteCode.toUpperCase() === inviteCode.toUpperCase());
    if (!project) return { success: false, error: 'Invalid code — check with your owner' };
    if (project.members.some(m => m.userId === user.id)) return { success: false, error: "You're already on this team!" };

    setProjects(prev => prev.map(p => {
      if (p.id !== project.id) return p;
      return {
        ...p,
        members: [...p.members, { userId: user.id, username: user.username, role: user.role as any, joinedAt: new Date() }],
        activity: [{ id: generateId(), type: 'member_joined', message: `${user.username} joined the project`, username: user.username, timestamp: new Date() }, ...p.activity],
      };
    }));
    return { success: true, projectId: project.id, projectName: project.name };
  };

  const contribute = (projectId: string, itemId: string, qty: number, user: { id: string; username: string }): ContributeResult => {
    if (qty < 1) return { success: false, error: 'Quantity must be at least 1' };

    let itemCompleted = false;
    let projectCompleted = false;
    let error: string | undefined;

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;

      // Find item in dependency tree
      const allItems = flattenItems(p.items);
      const item = allItems.find(i => i.id === itemId);
      if (!item) return p;

      // Check dependency gating
      if (item.dependencies && item.dependencies.length > 0) {
        const depsMet = item.dependencies.every(dep => dep.quantityCollected >= dep.quantityRequired);
        if (!depsMet) {
          error = 'Complete sub-dependencies first!';
          return p;
        }
      }

      const remaining = item.quantityRequired - item.quantityCollected;
      if (remaining <= 0) return p;
      if (qty > remaining) {
        error = `Can't contribute more than ${remaining} remaining`;
        return p;
      }

      const newCollected = item.quantityCollected + qty;
      itemCompleted = newCollected >= item.quantityRequired;

      const newItems = updateItemInTree(p.items, itemId, i => ({
        ...i,
        quantityCollected: newCollected,
        contributions: [...i.contributions, { userId: user.id, username: user.username, quantity: qty, timestamp: new Date() }],
      }));

      const allNew = flattenItems(newItems);
      projectCompleted = allNew.every(i => i.quantityCollected >= i.quantityRequired);

      const newActivity: ActivityEntry[] = [
        { id: generateId(), type: 'contribution', message: `${user.username} contributed ${qty}× ${item.name}`, username: user.username, timestamp: new Date() },
      ];
      if (itemCompleted) {
        newActivity.unshift({ id: generateId(), type: 'item_completed', message: `${item.name} is fully collected!`, username: user.username, timestamp: new Date() });
      }
      if (projectCompleted) {
        newActivity.unshift({ id: generateId(), type: 'project_completed', message: '🏆 Project is 100% complete!', username: user.username, timestamp: new Date() });
      }

      return { ...p, items: newItems, activity: [...newActivity, ...p.activity], completedAt: projectCompleted ? new Date() : p.completedAt };
    }));

    if (error) return { success: false, error };
    return { success: true, itemCompleted, projectCompleted };
  };

  const removeCollaborator = (projectId: string, userId: string, ownerUsername: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const member = p.members.find(m => m.userId === userId);
      if (!member) return p;
      return {
        ...p,
        members: p.members.filter(m => m.userId !== userId),
        activity: [{ id: generateId(), type: 'member_removed', message: `${ownerUsername} removed ${member.username}`, username: ownerUsername, timestamp: new Date() }, ...p.activity],
      };
    }));
  };

  const regenerateInviteCode = (projectId: string, ownerUsername: string): string => {
    const newCode = generateInviteCode();
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        inviteCode: newCode,
        activity: [{ id: generateId(), type: 'code_regenerated', message: `${ownerUsername} regenerated the invite code`, username: ownerUsername, timestamp: new Date() }, ...p.activity],
      };
    }));
    return newCode;
  };

  const addEnchantment = (projectId: string, itemId: string, enchantment: Enchantment, username: string): boolean => {
    let success = false;
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const newItems = updateItemInTree(p.items, itemId, item => {
        success = true;
        return { ...item, enchantment };
      });
      if (!success) return p;
      return {
        ...p,
        items: newItems,
        activity: [{ id: generateId(), type: 'enchantment_added', message: `${username} enchanted an item with ${enchantment.name} ${enchantment.level}`, username, timestamp: new Date() }, ...p.activity],
      };
    }));
    return success;
  };

  const updateProjectPlan = (projectId: string, items: RequiredItem[], user: { id: string; username: string }, description: string): boolean => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const newVersion = p.version + 1;
      const versionEntry: VersionEntry = { version: newVersion, changedBy: user.username, timestamp: new Date(), description };
      return {
        ...p,
        items,
        version: newVersion,
        versionHistory: [...p.versionHistory, versionEntry],
        activity: [{ id: generateId(), type: 'plan_updated', message: `${user.username} updated the crafting plan (v${newVersion})`, username: user.username, timestamp: new Date() }, ...p.activity],
      };
    }));
    return true;
  };

  return (
    <AppContext.Provider value={{ projects, createProject, joinProject, contribute, removeCollaborator, regenerateInviteCode, addEnchantment, updateProjectPlan }}>
      {children}
    </AppContext.Provider>
  );
};
