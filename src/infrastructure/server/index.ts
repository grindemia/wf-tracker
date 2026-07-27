import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

import { PrismaItemRepository } from '../db/repositories/PrismaItemRepository';
import { PrismaProgressRepository } from '../db/repositories/PrismaProgressRepository';
import { PrismaFarmingRepository } from '../db/repositories/PrismaFarmingRepository';
import { PrismaRelicFarmingRepository } from '../db/repositories/PrismaRelicFarmingRepository';
import { PrismaUserRepository } from '../db/repositories/PrismaUserRepository';

import { User } from '../../domain/entities/User';
import { Item, ItemCategory } from '../../domain/entities/Item';
import { UserProgress } from '../../domain/entities/UserProgress';
import { FarmingItem } from '../../domain/entities/FarmingItem';
import { ItemComponent } from '../../domain/entities/ItemComponent';
import { Relic } from '../../domain/entities/Relic';
import { RelicDrop } from '../../domain/entities/RelicDrop';

import warframesJson from '../db/data/warframes.json';
import relicsJson from '../db/data/relics.json';

import { authMiddleware, adminMiddleware, AuthenticatedRequest } from './authMiddleware';
import { BcryptPasswordHasher } from '../auth/BcryptPasswordHasher';
import { JwtTokenService } from '../auth/JwtTokenService';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

const itemRepo = new PrismaItemRepository(prisma);
const progressRepo = new PrismaProgressRepository(prisma);
const farmingRepo = new PrismaFarmingRepository(prisma);
const relicFarmingRepo = new PrismaRelicFarmingRepository(prisma);
const userRepo = new PrismaUserRepository(prisma);

const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const registerUserUseCase = new RegisterUser(userRepo, passwordHasher);
const loginUserUseCase = new LoginUser(userRepo, passwordHasher, tokenService);

const PORT = process.env.PORT || 3001;

// --- ENDPOINTS ---

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    const user = await registerUserUseCase.execute({ username, email, password });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identity, password } = req.body;
    if (!identity || !password) {
      return res.status(400).json({ error: 'Identidad (usuario/email) y contraseña requeridos.' });
    }
    const result = await loginUserUseCase.execute({ identity, password });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Seeding inicial (Solo administradores)
app.post('/api/items/seed', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('Iniciando Seeding en PostgreSQL...');

    // 1. Asegurar usuario por defecto
    const defaultUser = new User({
      id: 'user-grindemia-tenno',
      username: 'Grindemia_Tenno',
      email: 'tenno@grindemia.com',
      passwordHash: 'dummy_hash',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await userRepo.save(defaultUser);

    // 2. Sembrar Warframes
    const parsedWarframes = (warframesJson as any[]).map(w => {
      return new Item({
        id: w.id,
        name: w.name,
        uniqueName: w.uniqueName,
        category: 'WARFRAME',
        masteryPoints: w.masteryPoints,
        maxRank: w.maxRank,
        wikiaUrl: w.wikiaUrl,
        imageUrl: w.imageUrl,
        components: {
          health: w.health,
          shield: w.shield,
          armor: w.armor,
          energy: w.energy,
          sprint: w.sprint
        }
      });
    });

    const initialWeaponsAndCompanions = [
      new Item({ id: 'wp-hek', name: 'Hek', uniqueName: 'hek', category: 'PRIMARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Hek', imageUrl: 'https://cdn.warframestat.us/img/Hek.png' }),
      new Item({ id: 'wp-boltor', name: 'Boltor', uniqueName: 'boltor', category: 'PRIMARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Boltor', imageUrl: 'https://cdn.warframestat.us/img/Boltor.png' }),
      new Item({ id: 'wp-lex', name: 'Lex', uniqueName: 'lex', category: 'SECONDARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Lex', imageUrl: 'https://cdn.warframestat.us/img/Lex.png' }),
      new Item({ id: 'wp-orthos', name: 'Orthos', uniqueName: 'orthos', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Orthos', imageUrl: 'https://cdn.warframestat.us/img/Orthos.png' }),
      new Item({ id: 'wp-skana', name: 'Skana', uniqueName: 'skana', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Skana', imageUrl: 'https://cdn.warframestat.us/img/Skana.png' }),
      new Item({ id: 'cp-carrier', name: 'Carrier', uniqueName: 'carrier', category: 'COMPANION', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Carrier', imageUrl: 'https://cdn.warframestat.us/img/Carrier.png' }),
      new Item({ id: 'cp-diriga', name: 'Diriga', uniqueName: 'diriga', category: 'COMPANION', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Diriga', imageUrl: 'https://cdn.warframestat.us/img/Diriga.png' }),
    ];

    for (const w of parsedWarframes) {
      await itemRepo.save(w);
    }
    for (const item of initialWeaponsAndCompanions) {
      await itemRepo.save(item);
    }

    const lexPrime = new Item({
      id: 'lex-prime',
      name: 'Lex Prime',
      uniqueName: '/Lotus/Types/Weapons/LexPrime',
      category: 'SECONDARY_WEAPON',
      masteryPoints: 3000,
      maxRank: 30,
      wikiaUrl: 'https://warframe.fandom.com/wiki/Lex/Prime',
      imageUrl: 'https://cdn.warframestat.us/img/LexPrime.png'
    });
    await itemRepo.save(lexPrime);

    const orthosPrime = new Item({
      id: 'orthos-prime',
      name: 'Orthos Prime',
      uniqueName: '/Lotus/Types/Weapons/OrthosPrime',
      category: 'MELEE_WEAPON',
      masteryPoints: 3000,
      maxRank: 30,
      wikiaUrl: 'https://warframe.fandom.com/wiki/Orthos/Prime',
      imageUrl: 'https://cdn.warframestat.us/img/OrthosPrime.png'
    });
    await itemRepo.save(orthosPrime);

    const allItems = await itemRepo.findAll();
    const primeItems = allItems.filter(i => i.name.toLowerCase().includes('prime'));

    const getParentItem = (rewardName: string) => {
      const words = rewardName.split(' ');
      const primeIndex = words.indexOf('Prime');
      if (primeIndex !== -1) {
        const parentName = words.slice(0, primeIndex + 1).join(' ');
        return primeItems.find(i => i.name.toLowerCase() === parentName.toLowerCase());
      }
      return null;
    };

    // Sembrar Reliquias
    for (const relicData of relicsJson as any[]) {
      const nameParts = relicData.name.split(' ');
      const era = nameParts[0];
      const name = nameParts.slice(1).join(' ');
      const relicId = `relic-${era.toLowerCase()}-${name.toLowerCase()}`;

      const relic = new Relic({
        id: relicId,
        era,
        name,
        vaulted: relicData.vaulted || false
      });
      await relicFarmingRepo.saveRelic(relic);

      for (const reward of relicData.rewards) {
        const parentItem = getParentItem(reward.item);
        if (parentItem) {
          const componentName = reward.item;
          const componentId = `comp-${componentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

          const component = new ItemComponent({
            id: componentId,
            itemId: parentItem.id,
            name: componentName,
            uniqueName: `/Lotus/Types/Recipes/Farming/${componentName.replace(/ /g, '')}`
          });
          await relicFarmingRepo.saveComponent(component);

          let rarity: 'BRONZE' | 'SILVER' | 'GOLD' = 'BRONZE';
          if (reward.type.toLowerCase() === 'rare') {
            rarity = 'GOLD';
          } else if (reward.type.toLowerCase() === 'uncommon') {
            rarity = 'SILVER';
          }

          const dropId = `drop-${componentId}-${relicId}`;
          const drop = new RelicDrop({
            id: dropId,
            componentId,
            relicId,
            rarity,
            chance: reward.chance
          });
          await relicFarmingRepo.saveDrop(drop);
        }
      }
    }

    res.json({ message: 'Seeding completado exitosamente.' });
  } catch (error: any) {
    console.error('Error durante el seeding:', error);
    res.status(500).json({ error: error.message });
  }
});

// Items
app.get('/api/items', async (req, res) => {
  try {
    const items = await itemRepo.findAll();
    res.json(items.map(item => ({
      id: item.id,
      name: item.name,
      uniqueName: item.uniqueName,
      category: item.category,
      masteryPoints: item.masteryPoints,
      maxRank: item.maxRank,
      wikiaUrl: item.wikiaUrl,
      imageUrl: item.imageUrl,
      components: item.components
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await itemRepo.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });
    res.json({
      id: item.id,
      name: item.name,
      uniqueName: item.uniqueName,
      category: item.category,
      masteryPoints: item.masteryPoints,
      maxRank: item.maxRank,
      wikiaUrl: item.wikiaUrl,
      imageUrl: item.imageUrl,
      components: item.components
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/items/category/:category', async (req, res) => {
  try {
    const items = await itemRepo.findByCategory(req.params.category as ItemCategory);
    res.json(items.map(item => ({
      id: item.id,
      name: item.name,
      uniqueName: item.uniqueName,
      category: item.category,
      masteryPoints: item.masteryPoints,
      maxRank: item.maxRank,
      wikiaUrl: item.wikiaUrl,
      imageUrl: item.imageUrl,
      components: item.components
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/items', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const item = new Item(req.body);
    const saved = await itemRepo.save(item);
    res.json({
      id: saved.id,
      name: saved.name,
      uniqueName: saved.uniqueName,
      category: saved.category,
      masteryPoints: saved.masteryPoints,
      maxRank: saved.maxRank,
      wikiaUrl: saved.wikiaUrl,
      imageUrl: saved.imageUrl,
      components: saved.components
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/items/batch', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const items = (req.body.items || []).map((i: any) => new Item(i));
    await itemRepo.saveMany(items);
    res.json({ message: 'Batch guardado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Progress
app.get('/api/progress', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const progressList = await progressRepo.findByUser(userId);
    res.json(progressList.map(p => ({
      id: p.id,
      userId: p.userId,
      itemId: p.itemId,
      status: p.status,
      currentRank: p.currentRank,
      updatedAt: p.updatedAt
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/progress/detail', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const itemId = req.query.itemId as string;
    const progress = await progressRepo.findByUserAndItem(userId, itemId);
    if (!progress) return res.status(404).json({ error: 'Progreso no encontrado' });
    res.json({
      id: progress.id,
      userId: progress.userId,
      itemId: progress.itemId,
      status: progress.status,
      currentRank: progress.currentRank,
      updatedAt: progress.updatedAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/progress', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const progress = new UserProgress({
      ...req.body,
      userId: userId // Forzamos que sea del usuario autenticado
    });
    const saved = await progressRepo.save(progress);
    res.json({
      id: saved.id,
      userId: saved.userId,
      itemId: saved.itemId,
      status: saved.status,
      currentRank: saved.currentRank,
      updatedAt: saved.updatedAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/progress/mastery-points', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const total = await progressRepo.getUserTotalMasteryPoints(userId);
    res.json({ totalMasteryPoints: total });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Farming
app.get('/api/farming', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const farmingItems = await farmingRepo.findByUser(userId);
    res.json(farmingItems.map(f => ({
      id: f.id,
      userId: f.userId,
      itemId: f.itemId,
      notes: f.notes,
      addedAt: f.addedAt
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/farming/detail', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const itemId = req.query.itemId as string;
    const farming = await farmingRepo.findByUserAndItem(userId, itemId);
    if (!farming) return res.status(404).json({ error: 'Objetivo de farmeo no encontrado' });
    res.json({
      id: farming.id,
      userId: farming.userId,
      itemId: farming.itemId,
      notes: farming.notes,
      addedAt: farming.addedAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/farming', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const item = new FarmingItem({
      ...req.body,
      userId: userId // Forzamos que sea del usuario autenticado
    });
    const saved = await farmingRepo.save(item);
    res.json({
      id: saved.id,
      userId: saved.userId,
      itemId: saved.itemId,
      notes: saved.notes,
      addedAt: saved.addedAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/farming', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const itemId = req.query.itemId as string;
    await farmingRepo.delete(userId, itemId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Relic Farming
app.get('/api/relic-farming/components', async (req, res) => {
  try {
    const itemId = req.query.itemId as string;
    const components = await relicFarmingRepo.findComponentsByItemId(itemId);
    res.json(components.map(c => ({
      id: c.id,
      itemId: c.itemId,
      name: c.name,
      uniqueName: c.uniqueName
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/relic-farming/drops', async (req, res) => {
  try {
    const componentId = req.query.componentId as string;
    const drops = await relicFarmingRepo.findDropsByComponentId(componentId);
    res.json(drops.map(d => ({
      drop: {
        id: d.drop.id,
        componentId: d.drop.componentId,
        relicId: d.drop.relicId,
        rarity: d.drop.rarity,
        chance: d.drop.chance
      },
      relic: {
        id: d.relic.id,
        era: d.relic.era,
        name: d.relic.name,
        vaulted: d.relic.vaulted
      }
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/relic-farming/components', async (req, res) => {
  try {
    const comp = new ItemComponent(req.body);
    const saved = await relicFarmingRepo.saveComponent(comp);
    res.json({
      id: saved.id,
      itemId: saved.itemId,
      name: saved.name,
      uniqueName: saved.uniqueName
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/relic-farming/relics', async (req, res) => {
  try {
    const relic = new Relic(req.body);
    const saved = await relicFarmingRepo.saveRelic(relic);
    res.json({
      id: saved.id,
      era: saved.era,
      name: saved.name,
      vaulted: saved.vaulted
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/relic-farming/drops', async (req, res) => {
  try {
    const drop = new RelicDrop(req.body);
    const saved = await relicFarmingRepo.saveDrop(drop);
    res.json({
      id: saved.id,
      componentId: saved.componentId,
      relicId: saved.relicId,
      rarity: saved.rarity,
      chance: saved.chance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../../../client');
  app.use(express.static(clientPath));

  // Cualquier petición que no coincida con las rutas de la API, se delega al index.html del cliente
  app.get('*any', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor Express levantado en el puerto ${PORT}`);
});
