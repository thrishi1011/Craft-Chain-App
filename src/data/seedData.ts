import { User, Project } from '@/types';

export const seedUsers: User[] = [
  {
    id: 'user-1',
    username: 'SteveBuilder',
    email: 'steve@craftchain.io',
    password: 'demo123',
    role: 'Miner',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'user-2',
    username: 'AlexMiner',
    email: 'alex@craftchain.io',
    password: 'demo123',
    role: 'Crafter',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'user-3',
    username: 'NotchPlanner',
    email: 'notch@craftchain.io',
    password: 'demo123',
    role: 'Planner',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export const seedProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Diamond Pickaxe Craft',
    finalItem: 'Diamond Pickaxe',
    ownerId: 'user-1',
    ownerUsername: 'SteveBuilder',
    inviteCode: 'DEMO01',
    members: [
      { userId: 'user-1', username: 'SteveBuilder', role: 'Miner', joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { userId: 'user-2', username: 'AlexMiner', role: 'Crafter', joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
      { userId: 'user-3', username: 'NotchPlanner', role: 'Planner', joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
    items: [
      {
        id: 'item-1',
        name: 'Diamond',
        quantityRequired: 3,
        quantityCollected: 2,
        contributions: [
          { userId: 'user-1', username: 'SteveBuilder', quantity: 1, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
          { userId: 'user-2', username: 'AlexMiner', quantity: 1, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        ],
        dependencies: [],
      },
      {
        id: 'item-2',
        name: 'Stick',
        quantityRequired: 2,
        quantityCollected: 2,
        contributions: [
          { userId: 'user-1', username: 'SteveBuilder', quantity: 2, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        ],
        dependencies: [
          {
            id: 'item-2-1',
            name: 'Oak Planks',
            quantityRequired: 2,
            quantityCollected: 2,
            parentId: 'item-2',
            contributions: [
              { userId: 'user-2', username: 'AlexMiner', quantity: 2, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
            ],
            dependencies: [
              {
                id: 'item-2-1-1',
                name: 'Oak Log',
                quantityRequired: 1,
                quantityCollected: 1,
                parentId: 'item-2-1',
                contributions: [
                  { userId: 'user-1', username: 'SteveBuilder', quantity: 1, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
                ],
                dependencies: [],
              },
            ],
          },
        ],
      },
      {
        id: 'item-3',
        name: 'Crafting Table',
        quantityRequired: 1,
        quantityCollected: 0,
        contributions: [],
        enchantment: { name: 'Efficiency', level: 2, extraResourceCost: 10 },
        dependencies: [
          {
            id: 'item-3-1',
            name: 'Oak Planks',
            quantityRequired: 4,
            quantityCollected: 0,
            parentId: 'item-3',
            contributions: [],
            dependencies: [
              {
                id: 'item-3-1-1',
                name: 'Oak Log',
                quantityRequired: 1,
                quantityCollected: 0,
                parentId: 'item-3-1',
                contributions: [],
                dependencies: [],
              },
            ],
          },
        ],
      },
    ],
    activity: [
      { id: 'act-1', type: 'project_created', message: 'SteveBuilder created the project', username: 'SteveBuilder', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { id: 'act-2', type: 'member_joined', message: 'AlexMiner joined the project', username: 'AlexMiner', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
      { id: 'act-3', type: 'member_joined', message: 'NotchPlanner joined the project', username: 'NotchPlanner', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { id: 'act-4', type: 'contribution', message: 'SteveBuilder contributed 1× Diamond', username: 'SteveBuilder', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { id: 'act-5', type: 'contribution', message: 'SteveBuilder contributed 2× Stick', username: 'SteveBuilder', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { id: 'act-6', type: 'item_completed', message: 'Stick is fully collected!', username: 'SteveBuilder', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { id: 'act-7', type: 'contribution', message: 'AlexMiner contributed 1× Diamond', username: 'AlexMiner', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    version: 1,
    versionHistory: [{ version: 1, changedBy: 'SteveBuilder', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), description: 'Initial plan created' }],
  },
];
