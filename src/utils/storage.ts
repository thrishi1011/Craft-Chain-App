import type { Project, User } from '@/types';

const PROJECTS_KEY = 'craftchain_projects';
const USERS_KEY = 'craftchain_users';

function reviveDates(_key: string, value: unknown): unknown {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
    }
    return value;
}

export function saveProjects(projects: Project[]): void {
    try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch {
        // quota exceeded — silently ignore
    }
}

export function loadProjects(): Project[] | null {
    try {
        const raw = localStorage.getItem(PROJECTS_KEY);
        if (!raw) return null;
        return JSON.parse(raw, reviveDates) as Project[];
    } catch {
        return null;
    }
}

export function saveUsers(users: User[]): void {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {
        // quota exceeded — silently ignore
    }
}

export function loadUsers(): User[] | null {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (!raw) return null;
        return JSON.parse(raw, reviveDates) as User[];
    } catch {
        return null;
    }
}

export function clearStorage(): void {
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.removeItem(USERS_KEY);
}
