import React, { useState, useEffect, useMemo } from 'react';

// Capa de Dominio (Entidades y Repositorios)
import { Item, ItemCategory } from '../domain/entities/Item';
import { UserProgress } from '../domain/entities/UserProgress';
import { FarmingItem } from '../domain/entities/FarmingItem';
import { ItemComponent } from '../domain/entities/ItemComponent';
import { Relic } from '../domain/entities/Relic';
import { RelicDrop } from '../domain/entities/RelicDrop';

import { ApiItemRepository, ApiProgressRepository, ApiFarmingRepository, ApiRelicFarmingRepository } from '../infrastructure/db/repositories/ApiRepositories';

// Capa de Aplicación (Casos de Uso)
import { MarkItemAsMastered } from '../application/use-cases/mastery/MarkItemAsMastered';
import { AddItemToFarmingList } from '../application/use-cases/farming/AddItemToFarmingList';
import { GetFarmingPathByItemId, GetFarmingPathOutput } from '../application/use-cases/farming/GetFarmingPathByItemId';

// Cargar catálogo completo sincronizado de Warframes
import warframesJson from '../infrastructure/db/data/warframes.json';
import relicsJson from '../infrastructure/db/data/relics.json';

// Instanciar repositorios y casos de uso de API una sola vez
const itemRepo = new ApiItemRepository();
const progressRepo = new ApiProgressRepository();
const farmingRepo = new ApiFarmingRepository();
const relicFarmingRepo = new ApiRelicFarmingRepository();

const markItemAsMasteredUseCase = new MarkItemAsMastered(progressRepo, itemRepo);
const addItemToFarmingListUseCase = new AddItemToFarmingList(farmingRepo, itemRepo);
const getFarmingPathUseCase = new GetFarmingPathByItemId(relicFarmingRepo, itemRepo);


// Parsear Warframes del dataset JSON sincronizado con CDN de imágenes
const PARSED_WARFRAMES = (warframesJson as any[]).map(w => {
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

// Catálogo de armas y compañeros iniciales adicionales con CDN de imágenes correctas
const INITIAL_WEAPONS_AND_COMPANIONS = [
  new Item({ id: 'wp-hek', name: 'Hek', uniqueName: 'hek', category: 'PRIMARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Hek', imageUrl: 'https://cdn.warframestat.us/img/Hek.png' }),
  new Item({ id: 'wp-boltor', name: 'Boltor', uniqueName: 'boltor', category: 'PRIMARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Boltor', imageUrl: 'https://cdn.warframestat.us/img/Boltor.png' }),
  new Item({ id: 'wp-lex', name: 'Lex', uniqueName: 'lex', category: 'SECONDARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Lex', imageUrl: 'https://cdn.warframestat.us/img/Lex.png' }),
  new Item({ id: 'wp-orthos', name: 'Orthos', uniqueName: 'orthos', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Orthos', imageUrl: 'https://cdn.warframestat.us/img/Orthos.png' }),
  new Item({ id: 'wp-skana', name: 'Skana', uniqueName: 'skana', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Skana', imageUrl: 'https://cdn.warframestat.us/img/Skana.png' }),
  new Item({ id: 'cp-carrier', name: 'Carrier', uniqueName: 'carrier', category: 'COMPANION', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Carrier', imageUrl: 'https://cdn.warframestat.us/img/Carrier.png' }),
  new Item({ id: 'cp-diriga', name: 'Diriga', uniqueName: 'diriga', category: 'COMPANION', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Diriga', imageUrl: 'https://cdn.warframestat.us/img/Diriga.png' }),
];



// Seeding para el Buscador de Farmeo de Reliquias
let hasSeeded = false;
async function seedRelicFarmingData() {
  if (hasSeeded) return;
  hasSeeded = true;
  // 1. Asegurar ítems Prime básicos
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

  // Obtener todos los ítems Prime en el catálogo para el mapeo dinámico
  const allItems = await itemRepo.findAll();
  const primeItems = allItems.filter(i => i.name.toLowerCase().includes('prime'));

  // Helper para asociar nombres de recompensa (ej: "Saryn Prime Blueprint" -> "Saryn Prime")
  const getParentItem = (rewardName: string) => {
    const words = rewardName.split(' ');
    const primeIndex = words.indexOf('Prime');
    if (primeIndex !== -1) {
      const parentName = words.slice(0, primeIndex + 1).join(' ');
      return primeItems.find(i => i.name.toLowerCase() === parentName.toLowerCase());
    }
    return null;
  };

  // 2. Procesar las reliquias del JSON descargado de forma dinámica
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

    // Mapear drops y crear componentes dinámicamente si pertenecen a un ítem en catálogo
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
}

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const CURRENT_USER_ID = currentUser?.id || '';

  const [items, setItems] = useState<Item[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [farmingList, setFarmingList] = useState<FarmingItem[]>([]);

  // Estados de formularios y filtros
  const [activeTab, setActiveTab] = useState<ItemCategory | 'ALL' | 'FARMING'>('ALL');
  const [masteryFilter, setMasteryFilter] = useState<'ALL' | 'PENDING' | 'MASTERED'>('ALL');
  const [vaultFilter, setVaultFilter] = useState<'ALL' | 'ACTIVE' | 'VAULTED'>('ALL');
  const [selectedFarmItem, setSelectedFarmItem] = useState('');
  const [farmNotes, setFarmNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para el Buscador de Reliquias
  const [selectedFarmingPathItemId, setSelectedFarmingPathItemId] = useState('-lotus-powersuits-saryn-sarynprime');
  const [selectedFarmingPath, setSelectedFarmingPath] = useState<GetFarmingPathOutput | null>(null);
  const [hideVaultedRelics, setHideVaultedRelics] = useState(false);
  const [vaultedItemIds, setVaultedItemIds] = useState<Set<string>>(new Set());

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedFarmingPathItemId);
  }, [items, selectedFarmingPathItemId]);

  // Obtener estado de progreso de un ítem
  const getItemStatus = (itemId: string) => {
    const prog = progressList.find(p => p.itemId === itemId);
    return prog ? prog.status : 'PENDING';
  };

  // Comprobar si está en el planificador
  const isItemBeingFarmed = (itemId: string) => {
    return farmingList.some(f => f.itemId === itemId);
  };

  // Cargar estado inicial desde repositorios
  const fetchAllData = async () => {
    const allItems = await itemRepo.findAll();
    const allProg = await progressRepo.findByUser(CURRENT_USER_ID);
    const allFarm = await farmingRepo.findByUser(CURRENT_USER_ID);

    // Calcular items que están en el Vault mediante llamada eficiente al backend
    const response = await fetch('/api/relic-farming/vaulted');
    const vaultedArray = await response.json();
    const vaultedIds = new Set<string>(vaultedArray);
    setVaultedItemIds(vaultedIds);

    setItems(allItems);
    setProgressList(allProg);
    setFarmingList(allFarm);
  };

  useEffect(() => {
    if (token && currentUser) {
      fetchAllData();
    }
  }, [token, currentUser]);

  // Consultar la ruta de farmeo de reliquias cuando cambie la selección o la lista de farmeo
  useEffect(() => {
    if (selectedFarmingPathItemId) {
      getFarmingPathUseCase.execute({ itemId: selectedFarmingPathItemId })
        .then(path => {
          setSelectedFarmingPath(path);
        })
        .catch(err => {
          console.error(err);
          setSelectedFarmingPath(null);
        });
    } else {
      setSelectedFarmingPath(null);
    }
  }, [selectedFarmingPathItemId, farmingList, items]);

  // Estadísticas del Checklist (en lugar de Rango de Maestría / XP de cuenta)
  const totalItemsCount = useMemo(() => {
    return items.length;
  }, [items]);

  const masteredCount = useMemo(() => {
    return progressList.filter(p => p.status === 'MASTERED').length;
  }, [progressList]);

  const completionPercent = useMemo(() => {
    if (totalItemsCount === 0) return 0;
    return Math.round((masteredCount / totalItemsCount) * 100);
  }, [masteredCount, totalItemsCount]);

  // Filtrar ítems de la checklist
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeTab === 'FARMING') {
      result = result.filter(i => isItemBeingFarmed(i.id));
    } else if (activeTab !== 'ALL') {
      result = result.filter(i => i.category === activeTab);
    }
    // Filtro de Maestría
    if (masteryFilter === 'PENDING') {
      result = result.filter(i => getItemStatus(i.id) !== 'MASTERED');
    } else if (masteryFilter === 'MASTERED') {
      result = result.filter(i => getItemStatus(i.id) === 'MASTERED');
    }
    
    // Filtro de Vault (independiente)
    if (vaultFilter === 'ACTIVE') {
      result = result.filter(i => !vaultedItemIds.has(i.id));
    } else if (vaultFilter === 'VAULTED') {
      result = result.filter(i => vaultedItemIds.has(i.id));
    }
    return result;
  }, [items, activeTab, masteryFilter, vaultFilter, progressList, vaultedItemIds, farmingList]);

  // Manejo de Caso de Uso: Marcar como Masterizado
  const handleMarkAsMastered = async (itemId: string) => {
    try {
      setErrorMsg('');
      const currentStatus = getItemStatus(itemId);
      
      if (currentStatus === 'MASTERED') {
        // Alternar estado: regresarlo a PENDING
        const progress = await progressRepo.findByUserAndItem(CURRENT_USER_ID, itemId);
        if (progress) {
          progress.updateRank(0, 30);
          await progressRepo.save(progress);
        }
        await fetchAllData();
      } else {
        await markItemAsMasteredUseCase.execute({
          userId: CURRENT_USER_ID,
          itemId
        });
        await fetchAllData();
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // Manejo de Caso de Uso: Agregar ítem al planificador
  const handleAddToFarm = async (itemId: string, notes: string = '') => {
    try {
      setErrorMsg('');
      const existing = farmingList.find(f => f.itemId === itemId);
      if (existing) {
        await farmingRepo.delete(CURRENT_USER_ID, itemId);
      } else {
        await addItemToFarmingListUseCase.execute({
          userId: CURRENT_USER_ID,
          itemId,
          notes: notes || 'Planificado para farmear'
        });
      }
      await fetchAllData();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // Agregar desde formulario general
  const handleFormAddToFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmItem) return;
    await handleAddToFarm(selectedFarmItem, farmNotes);
    setSelectedFarmItem('');
    setFarmNotes('');
  };

  // Eliminar de la lista de farmeo
  const handleRemoveFromFarm = async (itemId: string) => {
    try {
      await farmingRepo.delete(CURRENT_USER_ID, itemId);
      await fetchAllData();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };



  if (!token || !currentUser) {
    return (
      <LoginRegisterView 
        onLoginSuccess={(jwt, user) => {
          localStorage.setItem('token', jwt);
          localStorage.setItem('user', JSON.stringify(user));
          setToken(jwt);
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div>
      {/* BARRA DE NAVEGACIÓN GRINDEMIA */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="brand">
            ⚡ GRINDEMIA <span>HUD</span>
          </a>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#e6c229', fontSize: '14px', borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '15px' }}>
              🟢 Tenno: <strong>{currentUser?.username}</strong>
            </span>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setCurrentUser(null);
              }}
              style={{
                background: 'transparent',
                border: '1px solid #ff6600',
                color: '#ff6600',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
                boxShadow: '0 0 5px rgba(255,102,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ff6600';
                e.currentTarget.style.color = '#090a0f';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255,102,0,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#ff6600';
                e.currentTarget.style.boxShadow = '0 0 5px rgba(255,102,0,0.2)';
              }}
            >
              Cerrar Sesión
            </button>
            <a 
              href="https://www.youtube.com/@Grindemia" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="youtube-badge"
            >
              📺 CANAL YOUTUBE
            </a>
          </div>
        </div>
      </header>

      <div className="container">
        {/* HUD DE PROGRESO DE COMPLETADO (SIN MÉTRICA DE EXPERIENCIA/VINCULACIÓN DE CUENTA) */}
        <section className="mastery-hud-card">
          <div className="hud-header">
            <div className="tenno-info">
              <div className="mastery-sigil" style={{ fontSize: '1.1rem' }}>
                {completionPercent}%
              </div>
              <div>
                <span style={{ color: 'var(--color-accent-gold)', fontSize: '0.75rem', fontFamily: 'var(--font-title)', letterSpacing: '2px', fontWeight: 'bold' }}>
                  OPERADOR ACTIVO
                </span>
                <h2 className="tenno-name">Grindemia_Tenno</h2>
              </div>
            </div>
            <div className="rank-display">
              COMPLETADO: {masteredCount} / {totalItemsCount}
            </div>
          </div>
          <div className="xp-bar-container">
            <div className="xp-bar-labels">
              <span>PROGRESO DE COMPLETADO DE LA LISTA</span>
              <span>{completionPercent}% de los ítems masterizados</span>
            </div>
            <div className="xp-bar-bg">
              <div className="xp-bar-fill" style={{ width: `${completionPercent}%` }}></div>
            </div>
          </div>
        </section>

        {errorMsg && (
          <div style={{ background: 'rgba(255, 85, 0, 0.1)', border: '1px solid var(--color-accent-orange)', color: '#ff6600', padding: '0.85rem 1.25rem', fontSize: '0.85rem', fontFamily: 'var(--font-title)', letterSpacing: '1px', borderLeftWidth: '4px' }}>
            ⚠️ COMUNICACIÓN INTERRUMPIDA: {errorMsg}
          </div>
        )}

        {selectedFarmingPathItemId && selectedItem && (
          <div className="modal-overlay" onClick={() => setSelectedFarmingPathItemId('')}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  🌌 Ficha Técnica: <span className="gold-text">{selectedItem.name}</span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => handleMarkAsMastered(selectedItem.id)}
                    className={`btn-slanted ${getItemStatus(selectedItem.id) === 'MASTERED' ? 'btn-slanted-mastered' : 'btn-slanted-pending'}`}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                  >
                    {getItemStatus(selectedItem.id) === 'MASTERED' ? '✓ MAX' : 'MARCAR MAX'}
                  </button>
                  <button className="modal-close-btn" onClick={() => setSelectedFarmingPathItemId('')}>
                    &times;
                  </button>
                </div>
              </div>
              
              <div className="modal-body">
                {/* Sección 1: Información Básica (Ficha Técnica) */}
                <div className="modal-item-info">
                  <div className="modal-item-left">
                    {selectedItem.imageUrl && (
                      <img 
                        src={selectedItem.imageUrl} 
                        alt={selectedItem.name} 
                        className="modal-item-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://cdn.warframestat.us/img/excalibur.png';
                        }}
                      />
                    )}
                  </div>
                  <div className="modal-item-right">
                    <div className="modal-info-grid">
                      <div className="info-cell">
                        <span className="info-cell-label">Categoría</span>
                        <span className="info-cell-val highlight-cyan">{selectedItem.category.replace('_', ' ')}</span>
                      </div>
                      <div className="info-cell">
                        <span className="info-cell-label">Puntos de Maestría</span>
                        <span className="info-cell-val highlight-gold">+{selectedItem.masteryPoints} XP</span>
                      </div>
                      <div className="info-cell">
                        <span className="info-cell-label">Rango Máximo</span>
                        <span className="info-cell-val">Rango {selectedItem.maxRank}</span>
                      </div>
                      {selectedItem.wikiaUrl && (
                        <div className="info-cell">
                          <span className="info-cell-label">Base de Datos</span>
                          <a 
                            href={selectedItem.wikiaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="info-cell-link"
                          >
                            Ver en Wiki Fandom 🔗
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Stats de Warframe si aplica */}
                    {selectedItem.category === 'WARFRAME' && selectedItem.components && (
                      <div className="modal-stats-container">
                        <h4 className="modal-section-subtitle">Estadísticas Base</h4>
                        <div className="modal-stats-grid">
                          <div className="modal-stat-card">
                            <span className="stat-card-icon">❤️</span>
                            <span className="stat-card-name">Salud</span>
                            <span className="stat-card-val red">{selectedItem.components.health}</span>
                          </div>
                          <div className="modal-stat-card">
                            <span className="stat-card-icon">🛡️</span>
                            <span className="stat-card-name">Escudo</span>
                            <span className="stat-card-val cyan">{selectedItem.components.shield}</span>
                          </div>
                          <div className="modal-stat-card">
                            <span className="stat-card-icon">⚙️</span>
                            <span className="stat-card-name">Armadura</span>
                            <span className="stat-card-val">{selectedItem.components.armor}</span>
                          </div>
                          <div className="modal-stat-card">
                            <span className="stat-card-icon">⚡</span>
                            <span className="stat-card-name">Energía</span>
                            <span className="stat-card-val gold">{selectedItem.components.energy}</span>
                          </div>
                          <div className="stat-card-wide">
                            <span className="stat-card-name">🏃 Velocidad de Carrera</span>
                            <span className="stat-card-val cyan">{selectedItem.components.sprint}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección 2: Ruta de Obtención / Farmeo */}
                <div className="modal-farming-section">
                  <h4 className="modal-section-title-divider">
                    <span>🛸 RUTA DE OBTENCIÓN Y RELIQUIAS</span>
                  </h4>

                  {selectedFarmingPath && selectedFarmingPath.components && selectedFarmingPath.components.length > 0 ? (
                    <>
                      <div className="modal-filters" style={{ margin: '0 0 1rem 0', justifyContent: 'flex-start', paddingBottom: '0.5rem' }}>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            className="input-checkbox"
                            checked={hideVaultedRelics}
                            onChange={e => setHideVaultedRelics(e.target.checked)}
                          />
                          Ocultar reliquias en el vault (🔒)
                        </label>
                      </div>

                      <div className="relic-components-grid">
                        {selectedFarmingPath.components.map(comp => {
                          const displayedRelics = hideVaultedRelics
                            ? comp.relics.filter(r => !r.vaulted)
                            : comp.relics;

                          return (
                            <div className="relic-comp-card" key={comp.componentId}>
                              <div className="relic-comp-card-header">
                                <span className="relic-comp-name">{comp.name}</span>
                              </div>
                              
                              <div className="relic-comp-card-body">
                                {displayedRelics.length === 0 ? (
                                  <p className="no-relics-text">
                                    No hay reliquias activas en rotación.
                                  </p>
                                ) : (
                                  <div className="relic-tags-list">
                                    {displayedRelics.map(relic => {
                                      let rarityLabel = 'Bronce';
                                      if (relic.rarity === 'GOLD') {
                                        rarityLabel = 'Oro';
                                      } else if (relic.rarity === 'SILVER') {
                                        rarityLabel = 'Plata';
                                      }
                                      const chanceText = relic.chance ? `${(relic.chance * 100).toFixed(0)}%` : '';

                                      return (
                                        <span 
                                          className={`relic-tag rarity-${relic.rarity.toLowerCase()} ${relic.vaulted ? 'vaulted' : 'active'}`} 
                                          key={relic.relicId}
                                          title={`${relic.era} ${relic.name} - Rareza: ${rarityLabel} (${relic.vaulted ? 'Vaulted' : 'Activa'})`}
                                        >
                                          {relic.era} {relic.name} ({chanceText}){relic.vaulted ? '🔒' : ''}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div className="relic-comp-card-footer">
                                <button
                                  onClick={() => handleAddToFarm(selectedItem.id, `Farmeando reliquias para: ${comp.name}`)}
                                  className={`btn-slanted btn-slanted-farm ${isItemBeingFarmed(selectedItem.id) ? 'active' : ''}`}
                                  style={{ width: '100%' }}
                                >
                                  {isItemBeingFarmed(selectedItem.id) ? '🎯 EN LISTA' : '＋ AÑADIR'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="standard-obtention-card">
                      <p className="standard-obtention-text">
                        {selectedItem.name.toLowerCase().includes('prime') ? (
                          "Este item Prime es de edición limitada y no cuenta con reliquias activas en la base de datos o se encuentra temporalmente en el Vault del Vacío."
                        ) : (
                          `Los componentes y planos de ${selectedItem.name} se adquieren de forma estándar en el juego: comprando el plano en el Mercado por créditos, completando misiones específicas, o derrotando jefes de planeta en el Sistema de Origen.`
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO EN REJILLAS DEL JUEGO */}
        {/* INVENTARIO / CHECKLIST DE COMPLETADO */}
          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">
                ⚙️ Inventario de Maestría <span>/ Archivos ({filteredItems.length})</span>
              </h3>
            </div>
            <div className="panel-body">
              <div className="inventory-filters-row">
                <div className="tabs">
                  {(['ALL', 'WARFRAME', 'PRIMARY_WEAPON', 'SECONDARY_WEAPON', 'MELEE_WEAPON', 'COMPANION', 'FARMING'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    >
                      {tab === 'ALL' ? 'Todos' : tab === 'FARMING' ? '🎯 Planificador' : tab.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                
                <div className="filters-group-container">
                  <div className="mastery-filters">
                    <span className="filter-label">Maestría:</span>
                    <button
                      onClick={() => setMasteryFilter('ALL')}
                      className={`filter-btn ${masteryFilter === 'ALL' ? 'active' : ''}`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setMasteryFilter('PENDING')}
                      className={`filter-btn ${masteryFilter === 'PENDING' ? 'active' : ''}`}
                    >
                      Pendientes
                    </button>
                    <button
                      onClick={() => setMasteryFilter('MASTERED')}
                      className={`filter-btn ${masteryFilter === 'MASTERED' ? 'active gold' : ''}`}
                    >
                      Masterizados
                    </button>
                  </div>

                  <div className="mastery-filters">
                    <span className="filter-label">Estado Vault:</span>
                    <button
                      onClick={() => setVaultFilter('ALL')}
                      className={`filter-btn ${vaultFilter === 'ALL' ? 'active' : ''}`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setVaultFilter('ACTIVE')}
                      className={`filter-btn ${vaultFilter === 'ACTIVE' ? 'active' : ''}`}
                    >
                      Activos 🛸
                    </button>
                    <button
                      onClick={() => setVaultFilter('VAULTED')}
                      className={`filter-btn ${vaultFilter === 'VAULTED' ? 'active orange' : ''}`}
                    >
                      Vaulted 🔒
                    </button>
                  </div>
                </div>
              </div>

              {/* REJILLA DE TARJETAS DE INVENTARIO */}
              {activeTab !== 'ALL' && activeTab !== 'WARFRAME' && activeTab !== 'FARMING' ? (
                <div className="coming-soon-container">
                  <div className="coming-soon-content">
                    <span className="coming-soon-icon">📡</span>
                    <h3 className="coming-soon-title">MÓDULO EN DESARROLLO</h3>
                    <p className="coming-soon-subtitle">
                      La base de datos de reliquias y el registro de maestría para <span className="highlight-tag">{activeTab.replace('_', ' ')}s</span> estarán disponibles en la próxima transmisión de Grindemia HUD.
                    </p>
                    <div className="coming-soon-loader">
                      <div className="coming-soon-loader-bar"></div>
                    </div>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="empty-checklist-container">
                  <span className="empty-checklist-icon">{activeTab === 'FARMING' ? '🎯' : '🛸'}</span>
                  <h4 className="empty-checklist-title">
                    {activeTab === 'FARMING' ? 'TU PLANIFICADOR ESTÁ VACÍO' : 'SIN ARCHIVOS DETECTADOS'}
                  </h4>
                  <p className="empty-checklist-subtitle">
                    {activeTab === 'FARMING' 
                      ? 'Agrega Warframes y armas al planificador pulsando el botón ＋ en sus tarjetas para realizar el seguimiento de sus componentes y reliquias activas.'
                      : 'No se encontraron ítems que coincidan con la combinación seleccionada de filtros de Maestría y Estado de Vault.'
                    }
                  </p>
                </div>
              ) : (
                <div className="inventory-grid">
                  {filteredItems.map(item => {
                    const status = getItemStatus(item.id);
                    const isFarmed = isItemBeingFarmed(item.id);
                    const isMastered = status === 'MASTERED';
                    const isPrime = item.name.toLowerCase().includes('prime');
                    return (
                      <div 
                        className={`item-card clickable ${isMastered ? 'mastered' : ''} ${isPrime ? 'prime-item' : 'normal-item'}`} 
                        key={item.id}
                        onClick={() => {
                          setSelectedFarmingPathItemId(item.id);
                        }}
                        title="Haz clic para ver detalles e información de obtención"
                      >
                        <div className="item-card-header">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span className="item-card-cat">{item.category.replace('_', ' ')}</span>
                            {isPrime && (
                              <span className="prime-badge">
                                🌌 Reliquias
                              </span>
                            )}
                          </div>
                          <span className="item-card-name">{item.name}</span>
                        </div>

                        <div className="item-card-body">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="item-thumbnail"
                              onError={(e) => {
                                // Fallback si la imagen falla (reemplazamos por un ícono representativo genérico)
                                (e.target as HTMLImageElement).src = 'https://cdn.warframestat.us/img/excalibur.png';
                              }}
                            />
                          )}
                          <span className="item-card-xp">
                            {isMastered ? '✓ MAX' : 'PENDIENTE'}
                          </span>
                          {isFarmed && (
                            <div 
                              style={{ 
                                fontSize: '10px', 
                                color: '#00e5ff', 
                                marginTop: '8px', 
                                fontStyle: 'italic', 
                                background: 'rgba(0, 229, 255, 0.05)', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                borderLeft: '2px solid #00e5ff', 
                                width: '100%', 
                                textAlign: 'left', 
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={farmingList.find(f => f.itemId === item.id)?.notes}
                            >
                              📋 {farmingList.find(f => f.itemId === item.id)?.notes || 'Farmeando'}
                            </div>
                          )}
                        </div>

                        {/* HOVER OVERLAYS (Estadísticas o indicaciones de click) */}
                        {/* HOVER OVERLAYS (Estadísticas base) */}
                        {item.category === 'WARFRAME' && item.components && (
                          <div className="item-stats-overlay">
                            <h4 style={{ color: 'var(--color-accent-gold)', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.8rem', textAlign: 'center' }}>
                              Estadísticas Base
                            </h4>
                            <div className="stat-row">
                              <span className="stat-label">❤️ Salud</span>
                              <span className="stat-val red">{item.components.health}</span>
                            </div>
                            <div className="stat-row">
                              <span className="stat-label">🛡️ Escudo</span>
                              <span className="stat-val cyan">{item.components.shield}</span>
                            </div>
                            <div className="stat-row">
                              <span className="stat-label">⚙️ Armadura</span>
                              <span className="stat-val">{item.components.armor}</span>
                            </div>
                            <div className="stat-row">
                              <span className="stat-label">⚡ Energía</span>
                              <span className="stat-val gold">{item.components.energy}</span>
                            </div>
                            <div className="stat-row">
                              <span className="stat-label">🏃 Velocidad</span>
                              <span className="stat-val cyan">{item.components.sprint}</span>
                            </div>
                          </div>
                        )}

                        {/* Barra de progreso inferior en cada carta */}
                        <div className="rank-indicator-bar">
                          <div 
                            className="rank-indicator-fill" 
                            style={{ width: isMastered ? '100%' : '0%' }}
                          ></div>
                        </div>

                        <div className="item-card-footer">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsMastered(item.id);
                            }}
                            className={`btn-slanted ${isMastered ? 'btn-slanted-mastered' : 'btn-slanted-pending'}`}
                          >
                            {isMastered ? '✓ MAX' : 'MASTER'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToFarm(item.id, 'Planificado desde Inventario');
                            }}
                            className={`btn-slanted btn-slanted-farm ${isFarmed ? 'active' : ''}`}
                            title={isFarmed ? 'Remover del Planificador' : 'Añadir al Planificador'}
                          >
                            {isFarmed ? '🎯' : '＋'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
      </div>
    </div>
  );
}

function LoginRegisterView({ onLoginSuccess }: { onLoginSuccess: (token: string, user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identity, setIdentity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en el inicio de sesión.');
        onLoginSuccess(data.token, data.user);
      } else {
        // Registro
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en el registro.');
        
        // Auto-login tras registro exitoso
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || 'Error al iniciar sesión tras registrar.');
        onLoginSuccess(loginData.token, loginData.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #111422 0%, #090a0f 100%)',
      fontFamily: "'Inter', sans-serif",
      color: '#fff',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(9, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        boxShadow: '0 0 30px rgba(0, 229, 255, 0.15), inset 0 0 15px rgba(0, 229, 255, 0.05)',
        borderRadius: '8px',
        padding: '35px 30px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Adorno Orokin arriba */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, transparent, #e6c229 50%, transparent)'
        }}></div>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#00e5ff',
            textShadow: '0 0 10px rgba(0, 229, 255, 0.4)',
            margin: 0,
            textTransform: 'uppercase'
          }}>
            ⚡ GRINDEMIA <span style={{ color: '#fff' }}>HUD</span>
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#8b9bb4',
            marginTop: '8px',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            Terminal de Acceso Orokin
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 102, 0, 0.1)',
            border: '1px solid #ff6600',
            color: '#ff6600',
            borderRadius: '4px',
            padding: '10px 12px',
            fontSize: '13px',
            marginBottom: '20px',
            boxShadow: '0 0 10px rgba(255, 102, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#e6c229',
                marginBottom: '6px',
                letterSpacing: '1px'
              }}>
                Nombre de Tenno (Usuario)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ej: Grindemia_Tenno"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                  borderRadius: '4px',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#00e5ff';
                  e.target.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.2)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(0, 229, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#e6c229',
              marginBottom: '6px',
              letterSpacing: '1px'
            }}>
              {isLogin ? 'Tenno ID o Email' : 'Correo Electrónico'}
            </label>
            <input
              type={isLogin ? 'text' : 'email'}
              required
              value={isLogin ? identity : email}
              onChange={e => isLogin ? setIdentity(e.target.value) : setEmail(e.target.value)}
              placeholder={isLogin ? "Usuario o email" : "ejemplo@tenno.com"}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: '4px',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#00e5ff';
                e.target.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(0, 229, 255, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#e6c229',
              marginBottom: '6px',
              letterSpacing: '1px'
            }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: '4px',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#00e5ff';
                e.target.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(0, 229, 255, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #e6c229, #cfa71d)',
              border: 'none',
              borderRadius: '4px',
              padding: '14px',
              color: '#090a0f',
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(230, 194, 41, 0.3)',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(230, 194, 41, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(230, 194, 41, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Sincronizando...' : (isLogin ? 'Iniciar Conexión' : 'Registrar Tenno')}
          </button>
        </form>

        <div style={{
          marginTop: '25px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '20px'
        }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00e5ff',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
              letterSpacing: '0.5px'
            }}
          >
            {isLogin ? '¿Nuevo recluta? Crea tu cuenta' : '¿Ya tienes cuenta? Inicia conexión'}
          </button>
        </div>
      </div>
    </div>
  );
}
