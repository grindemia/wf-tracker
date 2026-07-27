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
