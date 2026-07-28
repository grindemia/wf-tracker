import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let currentDir = '';
try {
  currentDir = __dirname;
} catch {
  currentDir = path.dirname(fileURLToPath(import.meta.url));
}

const warframesJson = JSON.parse(fs.readFileSync(path.join(currentDir, '../data/warframes.json'), 'utf8'));
const relicsJson = JSON.parse(fs.readFileSync(path.join(currentDir, '../data/relics.json'), 'utf8'));

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // 1. Crear usuarios por defecto (y un admin de prueba para producción)
  const dummyHash = await bcrypt.hash('dummy_pass', 10);
  const adminHash = await bcrypt.hash('admin123_orokin', 10);

  // Asegurar usuario común
  await prisma.user.upsert({
    where: { id: 'user-grindemia-tenno' },
    update: {},
    create: {
      id: 'user-grindemia-tenno',
      username: 'Grindemia_Tenno',
      email: 'tenno@grindemia.com',
      passwordHash: dummyHash,
      role: 'USER'
    }
  });

  // Asegurar administrador para tareas de mantención
  await prisma.user.upsert({
    where: { id: 'user-admin' },
    update: {},
    create: {
      id: 'user-admin',
      username: 'Admin_Orokin',
      email: 'admin@grindemia.com',
      passwordHash: adminHash,
      role: 'ADMIN'
    }
  });

  // 2. Sembrar catálogo de items
  console.log('📦 Sembrando Warframes y items base...');
  
  // Warframes del JSON
  for (const w of warframesJson as any[]) {
    await prisma.item.upsert({
      where: { id: w.id },
      update: {
        name: w.name,
        uniqueName: w.uniqueName,
        category: 'WARFRAME',
        masteryPoints: w.masteryPoints,
        maxRank: w.maxRank,
        wikiaUrl: w.wikiaUrl,
        imageUrl: w.imageUrl,
        components: JSON.stringify({
          health: w.health,
          shield: w.shield,
          armor: w.armor,
          energy: w.energy,
          sprint: w.sprint
        })
      },
      create: {
        id: w.id,
        name: w.name,
        uniqueName: w.uniqueName,
        category: 'WARFRAME',
        masteryPoints: w.masteryPoints,
        maxRank: w.maxRank,
        wikiaUrl: w.wikiaUrl,
        imageUrl: w.imageUrl,
        components: JSON.stringify({
          health: w.health,
          shield: w.shield,
          armor: w.armor,
          energy: w.energy,
          sprint: w.sprint
        })
      }
    });
  }

  // Items base (armas y compañeros)
  const initialItems = [
    { id: 'wp-hek', name: 'Hek', uniqueName: 'hek', category: 'PRIMARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Hek', imageUrl: 'https://cdn.warframestat.us/img/Hek.png' },
    { id: 'wp-boltor', name: 'Boltor', uniqueName: 'boltor', category: 'PRIMARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Boltor', imageUrl: 'https://cdn.warframestat.us/img/Boltor.png' },
    { id: 'wp-lex', name: 'Lex', uniqueName: 'lex', category: 'SECONDARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Lex', imageUrl: 'https://cdn.warframestat.us/img/Lex.png' },
    { id: 'wp-orthos', name: 'Orthos', uniqueName: 'orthos', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Orthos', imageUrl: 'https://cdn.warframestat.us/img/Orthos.png' },
    { id: 'wp-skana', name: 'Skana', uniqueName: 'skana', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Skana', imageUrl: 'https://cdn.warframestat.us/img/Skana.png' },
    { id: 'cp-carrier', name: 'Carrier', uniqueName: 'carrier', category: 'COMPANION', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Carrier', imageUrl: 'https://cdn.warframestat.us/img/Carrier.png' },
    { id: 'cp-diriga', name: 'Diriga', uniqueName: 'diriga', category: 'COMPANION', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Diriga', imageUrl: 'https://cdn.warframestat.us/img/Diriga.png' },
    { id: 'lex-prime', name: 'Lex Prime', uniqueName: '/Lotus/Types/Weapons/LexPrime', category: 'SECONDARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Lex/Prime', imageUrl: 'https://cdn.warframestat.us/img/LexPrime.png' },
    { id: 'orthos-prime', name: 'Orthos Prime', uniqueName: '/Lotus/Types/Weapons/OrthosPrime', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Orthos/Prime', imageUrl: 'https://cdn.warframestat.us/img/OrthosPrime.png' }
  ];

  for (const item of initialItems) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        uniqueName: item.uniqueName,
        category: item.category,
        masteryPoints: item.masteryPoints,
        maxRank: item.maxRank,
        wikiaUrl: item.wikiaUrl,
        imageUrl: item.imageUrl
      },
      create: {
        id: item.id,
        name: item.name,
        uniqueName: item.uniqueName,
        category: item.category,
        masteryPoints: item.masteryPoints,
        maxRank: item.maxRank,
        wikiaUrl: item.wikiaUrl,
        imageUrl: item.imageUrl
      }
    });
  }

  // 3. Sembrar Reliquias
  console.log('🪐 Sembrando Reliquias y tablas de drop...');
  
  // Obtener items Prime cargados
  const dbItems = await prisma.item.findMany();
  const primeItems = dbItems.filter(i => i.name.toLowerCase().includes('prime'));

  const getParentItem = (rewardName: string) => {
    const words = rewardName.split(' ');
    const primeIndex = words.indexOf('Prime');
    if (primeIndex !== -1) {
      const parentName = words.slice(0, primeIndex + 1).join(' ');
      return primeItems.find(i => i.name.toLowerCase() === parentName.toLowerCase());
    }
    return null;
  };

  for (const relicData of relicsJson as any[]) {
    const nameParts = relicData.name.split(' ');
    const era = nameParts[0];
    const name = nameParts.slice(1).join(' ');
    const relicId = `relic-${era.toLowerCase()}-${name.toLowerCase()}`;

    // Crear/actualizar Reliquia
    await prisma.relic.upsert({
      where: { id: relicId },
      update: {
        era,
        name,
        vaulted: relicData.vaulted || false
      },
      create: {
        id: relicId,
        era,
        name,
        vaulted: relicData.vaulted || false
      }
    });

    for (const reward of relicData.rewards) {
      const parentItem = getParentItem(reward.item);
      if (parentItem) {
        const componentName = reward.item;
        const componentId = `comp-${componentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        // Crear/actualizar Componente
        await prisma.itemComponent.upsert({
          where: { id: componentId },
          update: {
            itemId: parentItem.id,
            name: componentName,
            uniqueName: `/Lotus/Types/Recipes/Farming/${componentName.replace(/ /g, '')}`
          },
          create: {
            id: componentId,
            itemId: parentItem.id,
            name: componentName,
            uniqueName: `/Lotus/Types/Recipes/Farming/${componentName.replace(/ /g, '')}`
          }
        });

        let rarity = 'BRONZE';
        if (reward.type.toLowerCase() === 'rare') {
          rarity = 'GOLD';
        } else if (reward.type.toLowerCase() === 'uncommon') {
          rarity = 'SILVER';
        }

        const dropId = `drop-${componentId}-${relicId}`;

        // Crear/actualizar Drop
        await prisma.relicDropTable.upsert({
          where: { id: dropId },
          update: {
            componentId,
            relicId,
            rarity,
            chance: reward.chance
          },
          create: {
            id: dropId,
            componentId,
            relicId,
            rarity,
            chance: reward.chance
          }
        });
      }
    }
  }

  console.log('✅ Seeding finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
