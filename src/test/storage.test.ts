import { describe, it, expect, beforeEach } from 'vitest';
import { saveProjects, loadProjects, saveUsers, loadUsers, clearStorage } from '@/utils/storage';
import type { Project, User } from '@/types';

beforeEach(() => {
    localStorage.clear();
});

describe('storage round-trip', () => {
    it('saves and loads projects with dates', () => {
        const now = new Date();
        const projects: Project[] = [{
            id: 'p1',
            name: 'Test',
            finalItem: 'Sword',
            ownerId: 'u1',
            ownerUsername: 'Steve',
            inviteCode: 'ABC123',
            members: [{ userId: 'u1', username: 'Steve', role: 'Miner', joinedAt: now }],
            items: [{
                id: 'i1',
                name: 'Diamond',
                quantityRequired: 3,
                quantityCollected: 1,
                contributions: [{ userId: 'u1', username: 'Steve', quantity: 1, timestamp: now }],
                dependencies: [],
            }],
            activity: [],
            createdAt: now,
            version: 1,
            versionHistory: [{ version: 1, changedBy: 'Steve', timestamp: now, description: 'Init' }],
        }];

        saveProjects(projects);
        const loaded = loadProjects();
        expect(loaded).not.toBeNull();
        expect(loaded!).toHaveLength(1);
        expect(loaded![0].createdAt).toBeInstanceOf(Date);
        expect(loaded![0].items[0].contributions[0].timestamp).toBeInstanceOf(Date);
        expect(loaded![0].name).toBe('Test');
    });

    it('saves and loads users', () => {
        const users: User[] = [{
            id: 'u1', username: 'Test', email: 'test@test.com', password: 'pass',
            role: 'Miner', createdAt: new Date(),
        }];
        saveUsers(users);
        const loaded = loadUsers();
        expect(loaded).not.toBeNull();
        expect(loaded![0].createdAt).toBeInstanceOf(Date);
    });

    it('returns null when nothing stored', () => {
        expect(loadProjects()).toBeNull();
        expect(loadUsers()).toBeNull();
    });

    it('clearStorage removes all data', () => {
        saveProjects([]);
        saveUsers([]);
        clearStorage();
        expect(loadProjects()).toBeNull();
        expect(loadUsers()).toBeNull();
    });
});
