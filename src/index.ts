import { InMemoryUserRepository } from './infrastructure/db/repositories/InMemoryUserRepository';
import { InMemoryItemRepository } from './infrastructure/db/repositories/InMemoryItemRepository';
import { InMemoryProgressRepository } from './infrastructure/db/repositories/InMemoryProgressRepository';
import { InMemoryFarmingRepository } from './infrastructure/db/repositories/InMemoryFarmingRepository';

import { User } from './domain/entities/User';
import { Item } from './domain/entities/Item';

import { MarkItemAsMastered } from './application/use-cases/mastery/MarkItemAsMastered';
import { AddItemToFarmingList } from './application/use-cases/farming/AddItemToFarmingList';

async function runSimulation() {
  console.log('--- 🪐 Grindemia WF-Tracker Simulación ---');
  console.log('Inicializando repositorios en memoria (Clean Architecture)...');

  // 1. Instanciar repositorios
  const userRepository = new InMemoryUserRepository();
  const itemRepository = new InMemoryItemRepository();
  const progressRepository = new InMemoryProgressRepository(itemRepository);
  const farmingRepository = new InMemoryFarmingRepository();

  // 2. Inicializar Casos de Uso
  const markItemAsMasteredUseCase = new MarkItemAsMastered(progressRepository, itemRepository);
  const addItemToFarmingListUseCase = new AddItemToFarmingList(farmingRepository, itemRepository);

  // 3. Crear datos iniciales (Seeding)
  console.log('\nCargando catálogo básico de ítems (Simulación de API/Dataset)...');
  const excalibur = new Item({
    id: 'warframe-excalibur',
    name: 'Excalibur',
    uniqueName: '/Lotus/Types/Warframes/Excalibur',
    category: 'WARFRAME',
    masteryPoints: 6000,
    maxRank: 30
  });

  const orthos = new Item({
    id: 'weapon-orthos',
    name: 'Orthos',
    uniqueName: '/Lotus/Types/Weapons/Melee/Orthos',
    category: 'MELEE_WEAPON',
    masteryPoints: 3000,
    maxRank: 30
  });

  await itemRepository.saveMany([excalibur, orthos]);
  console.log(`Catálogo cargado con: ${excalibur.name} (Warframe) y ${orthos.name} (Arma Cuerpo a Cuerpo).`);

  // Crear usuario
  const user = new User({
    id: 'user-123',
    username: 'Grindemia_Tenno',
    email: 'tenno@grindemia.com',
    passwordHash: 'secured_password_hash',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await userRepository.save(user);
  console.log(`Usuario creado: ${user.username} (ID: ${user.id})`);

  // 4. Ejecutar Caso de Uso: Agregar ítem al planificador de farmeo
  console.log('\n--- CASO DE USO: Agregar ítem al planificador de farmeo ---');
  try {
    const farmingResult = await addItemToFarmingListUseCase.execute({
      userId: user.id,
      itemId: orthos.id,
      notes: 'Faltan componentes en Reliquias Meso O4 (Hoja y Plano)'
    });
    console.log('✅ Ítem añadido a la lista de farmeo con éxito:');
    console.log(JSON.stringify(farmingResult, null, 2));
  } catch (error: any) {
    console.error('❌ Error al añadir a la lista de farmeo:', error.message);
  }

  // 5. Ejecutar Caso de Uso: Marcar un ítem como Masterizado (Rango Máximo)
  console.log('\n--- CASO DE USO: Marcar ítem como Masterizado ---');
  try {
    const masteryResult = await markItemAsMasteredUseCase.execute({
      userId: user.id,
      itemId: excalibur.id
    });
    console.log('✅ Ítem marcado como Masterizado con éxito:');
    console.log(JSON.stringify(masteryResult, null, 2));
  } catch (error: any) {
    console.error('❌ Error al marcar como masterizado:', error.message);
  }

  // 6. Verificar puntos de maestría finales
  const totalMastery = await progressRepository.getUserTotalMasteryPoints(user.id);
  console.log(`\n🏆 Puntos de Maestría Totales de ${user.username}: ${totalMastery} XP`);
  console.log('----------------------------------------------------');
}

runSimulation().catch(console.error);
