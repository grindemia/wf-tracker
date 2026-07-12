import React, { useState, useEffect, useMemo } from 'react';

// Capa de Dominio (Entidades y Repositorios)
import { Item, ItemCategory } from '../domain/entities/Item';
import { UserProgress } from '../domain/entities/UserProgress';
import { FarmingItem } from '../domain/entities/FarmingItem';

import { InMemoryItemRepository } from '../infrastructure/db/repositories/InMemoryItemRepository';
import { InMemoryProgressRepository } from '../infrastructure/db/repositories/InMemoryProgressRepository';
import { InMemoryFarmingRepository } from '../infrastructure/db/repositories/InMemoryFarmingRepository';

// Capa de Aplicación (Casos de Uso)
import { MarkItemAsMastered } from '../application/use-cases/mastery/MarkItemAsMastered';
import { AddItemToFarmingList } from '../application/use-cases/farming/AddItemToFarmingList';

// Instanciar repositorios y casos de uso en memoria una sola vez
const itemRepo = new InMemoryItemRepository();
const progressRepo = new InMemoryProgressRepository(itemRepo);
const farmingRepo = new InMemoryFarmingRepository();

const markItemAsMasteredUseCase = new MarkItemAsMastered(progressRepo, itemRepo);
const addItemToFarmingListUseCase = new AddItemToFarmingList(farmingRepo, itemRepo);

const CURRENT_USER_ID = 'user-grindemia-tenno';

// Catálogo de ítems inicial con imágenes oficiales del repositorio wfcd
const INITIAL_ITEMS = [
  new Item({ id: 'wf-excalibur', name: 'Excalibur', uniqueName: 'excalibur', category: 'WARFRAME', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Excalibur', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/excalibur.png' }),
  new Item({ id: 'wf-rhino', name: 'Rhino', uniqueName: 'rhino', category: 'WARFRAME', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Rhino', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/rhino.png' }),
  new Item({ id: 'wf-ember', name: 'Ember', uniqueName: 'ember', category: 'WARFRAME', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Ember', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/ember.png' }),
  new Item({ id: 'wf-loki', name: 'Loki', uniqueName: 'loki', category: 'WARFRAME', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Loki', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/loki.png' }),
  
  new Item({ id: 'wp-hek', name: 'Hek', uniqueName: 'hek', category: 'PRIMARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Hek', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/hek.png' }),
  new Item({ id: 'wp-boltor', name: 'Boltor', uniqueName: 'boltor', category: 'PRIMARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Boltor', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/boltor.png' }),
  
  new Item({ id: 'wp-lex', name: 'Lex', uniqueName: 'lex', category: 'SECONDARY_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Lex', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/lex.png' }),
  
  new Item({ id: 'wp-orthos', name: 'Orthos', uniqueName: 'orthos', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Orthos', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/orthos.png' }),
  new Item({ id: 'wp-skana', name: 'Skana', uniqueName: 'skana', category: 'MELEE_WEAPON', masteryPoints: 3000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Skana', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/skana.png' }),
  
  new Item({ id: 'cp-carrier', name: 'Carrier', uniqueName: 'carrier', category: 'COMPANION', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Carrier', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/carrier.png' }),
  new Item({ id: 'cp-diriga', name: 'Diriga', uniqueName: 'diriga', category: 'COMPANION', masteryPoints: 6000, maxRank: 30, wikiaUrl: 'https://warframe.fandom.com/wiki/Diriga', imageUrl: 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/diriga.png' }),
];

// Seed inicial si el repositorio está vacío
INITIAL_ITEMS.forEach(i => itemRepo.save(i));

export function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [farmingList, setFarmingList] = useState<FarmingItem[]>([]);
  const [totalMasteryXP, setTotalMasteryXP] = useState(0);

  // Estados de formularios y filtros
  const [activeTab, setActiveTab] = useState<ItemCategory | 'ALL'>('ALL');
  const [selectedFarmItem, setSelectedFarmItem] = useState('');
  const [farmNotes, setFarmNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar estado inicial desde repositorios
  const fetchAllData = async () => {
    const allItems = await itemRepo.findAll();
    const allProg = await progressRepo.findByUser(CURRENT_USER_ID);
    const allFarm = await farmingRepo.findByUser(CURRENT_USER_ID);
    const xp = await progressRepo.getUserTotalMasteryPoints(CURRENT_USER_ID);

    setItems(allItems);
    setProgressList(allProg);
    setFarmingList(allFarm);
    setTotalMasteryXP(xp);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Calcular Rango de Maestría dinámico (Fórmula de progresión del juego)
  const masteryRank = useMemo(() => {
    if (totalMasteryXP <= 0) return 0;
    // Cada rango requiere 1000 * Rango^2 de XP
    return Math.floor(Math.sqrt(totalMasteryXP / 1000)) + 1;
  }, [totalMasteryXP]);

  const nextRankXP = useMemo(() => {
    const nextRank = masteryRank + 1;
    return (nextRank - 1) * (nextRank - 1) * 1000 + 2000;
  }, [masteryRank]);

  const xpPercent = useMemo(() => {
    return Math.min(100, Math.round((totalMasteryXP / nextRankXP) * 100));
  }, [totalMasteryXP, nextRankXP]);

  // Filtrar ítems de la checklist
  const filteredItems = useMemo(() => {
    if (activeTab === 'ALL') return items;
    return items.filter(i => i.category === activeTab);
  }, [items, activeTab]);

  // Manejo de Caso de Uso: Marcar como Masterizado
  const handleMarkAsMastered = async (itemId: string) => {
    try {
      setErrorMsg('');
      const currentStatus = getItemStatus(itemId);
      
      if (currentStatus === 'MASTERED') {
        // Alternar estado: si ya está masterizado, regresarlo a PENDING (para interactividad)
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
      // Si ya está en la lista de farmeo, lo removemos
      const existing = farmingList.find(f => f.itemId === itemId);
      if (existing) {
        await farmingRepo.delete(CURRENT_USER_ID, itemId);
      } else {
        await addItemToFarmingListUseCase.execute({
          userId: CURRENT_USER_ID,
          itemId,
          notes: notes || 'Farming activo'
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

  // Obtener estado de progreso de un ítem
  const getItemStatus = (itemId: string) => {
    const prog = progressList.find(p => p.itemId === itemId);
    return prog ? prog.status : 'PENDING';
  };

  // Comprobar si está en el planificador
  const isItemBeingFarmed = (itemId: string) => {
    return farmingList.some(f => f.itemId === itemId);
  };

  return (
    <div>
      {/* BARRA DE NAVEGACIÓN GRINDEMIA */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="brand">
            ⚡ GRINDEMIA <span>HUD</span>
          </a>
          <a 
            href="https://www.youtube.com/@Grindemia" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="youtube-badge"
          >
            🔴 TRANSMISIÓN YOUTUBE
          </a>
        </div>
      </header>

      <div className="container">
        {/* HUD DE PROGRESO DEL TENNO (ESTILO WARFRAME) */}
        <section className="mastery-hud-card">
          <div className="hud-header">
            <div className="tenno-info">
              <div className="mastery-sigil">
                {masteryRank}
              </div>
              <div>
                <span style={{ color: 'var(--color-accent-gold)', fontSize: '0.75rem', fontFamily: 'var(--font-title)', letterSpacing: '2px', fontWeight: 'bold' }}>
                  OPERADOR ACTIVO
                </span>
                <h2 className="tenno-name">Grindemia_Tenno</h2>
              </div>
            </div>
            <div className="rank-display">
              MAESTRÍA: RANGO {masteryRank}
            </div>
          </div>
          <div className="xp-bar-container">
            <div className="xp-bar-labels">
              <span>PUNTOS DE MAESTRÍA GENERADOS</span>
              <span>{totalMasteryXP} / {nextRankXP} XP ({xpPercent}%)</span>
            </div>
            <div className="xp-bar-bg">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }}></div>
            </div>
          </div>
        </section>

        {errorMsg && (
          <div style={{ background: 'rgba(255, 85, 0, 0.1)', border: '1px solid var(--color-accent-orange)', color: '#ff6600', padding: '0.85rem 1.25rem', fontSize: '0.85rem', fontFamily: 'var(--font-title)', letterSpacing: '1px', borderLeftWidth: '4px' }}>
            ⚠️ COMUNICACIÓN INTERRUMPIDA: {errorMsg}
          </div>
        )}

        {/* CONTENIDO EN REJILLAS DEL JUEGO */}
        <div className="grid">
          {/* INVENTARIO / CHECKLIST DE MAESTRÍA */}
          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">
                ⚙️ Inventario de Maestría <span>/ Archivos</span>
              </h3>
            </div>
            <div className="panel-body">
              <div className="tabs">
                {(['ALL', 'WARFRAME', 'PRIMARY_WEAPON', 'SECONDARY_WEAPON', 'MELEE_WEAPON', 'COMPANION'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab === 'ALL' ? 'Todos' : tab.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* REJILLA DE TARJETAS DE INVENTARIO */}
              <div className="inventory-grid">
                {filteredItems.map(item => {
                  const status = getItemStatus(item.id);
                  const isFarmed = isItemBeingFarmed(item.id);
                  const isMastered = status === 'MASTERED';
                  return (
                    <div className={`item-card ${isMastered ? 'mastered' : ''}`} key={item.id}>
                      <div className="item-card-header">
                        <span className="item-card-cat">{item.category.replace('_', ' ')}</span>
                        <span className="item-card-name">{item.name}</span>
                      </div>

                      <div className="item-card-body">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="item-thumbnail"
                            onError={(e) => {
                              // Fallback si la imagen falla
                              (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/excalibur.png';
                            }}
                          />
                        )}
                        <span className="item-card-xp">
                          {isMastered ? 'MAX RANGO' : `+${item.masteryPoints} XP`}
                        </span>
                      </div>

                      {/* Barra de progreso inferior en cada carta */}
                      <div className="rank-indicator-bar">
                        <div 
                          className="rank-indicator-fill" 
                          style={{ width: isMastered ? '100%' : '0%' }}
                        ></div>
                      </div>

                      <div className="item-card-footer">
                        <button
                          onClick={() => handleMarkAsMastered(item.id)}
                          className={`btn-slanted ${isMastered ? 'btn-slanted-mastered' : 'btn-slanted-pending'}`}
                        >
                          {isMastered ? '✓ MAX' : 'MASTER'}
                        </button>
                        <button
                          onClick={() => handleAddToFarm(item.id, 'Añadido desde Inventario')}
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
            </div>
          </section>

          {/* COLUMNA DERECHA: FUNDICIÓN Y COMUNICADOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* PANEL DE FUNDICIÓN (PLANIFICADOR) */}
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title">
                  🔧 Fundición <span>/ Objetivos Activos</span>
                </h3>
              </div>
              <div className="panel-body">
                <form onSubmit={handleFormAddToFarm} style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Elegir Componente a Fabricar</label>
                    <select
                      className="input-select"
                      value={selectedFarmItem}
                      onChange={e => setSelectedFarmItem(e.target.value)}
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.category.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Componentes / Reliquias Necesarias</label>
                    <input
                      type="text"
                      className="input-select"
                      placeholder="Ej: Neuropticas, Chasis, Reliquia Neo H2"
                      value={farmNotes}
                      onChange={e => setFarmNotes(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary-slanted">
                    Iniciar Fabricación
                  </button>
                </form>

                <div>
                  <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '0.75rem', color: 'var(--color-accent-gold)' }}>
                    LISTA DE PROCESAMIENTO ACTIVO
                  </h4>
                  <div className="farming-list">
                    {farmingList.length === 0 ? (
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        FUNDICIÓN INACTIVA.
                      </p>
                    ) : (
                      farmingList.map(farmItem => {
                        const itemObj = items.find(i => i.id === farmItem.itemId);
                        return (
                          <div className="farming-card" key={farmItem.itemId}>
                            <div className="farming-card-header">
                              <span className="farming-card-title">{itemObj?.name}</span>
                              <button
                                onClick={() => handleRemoveFromFarm(farmItem.itemId)}
                                className="btn-claim"
                              >
                                Reclamar
                              </button>
                            </div>
                            {farmItem.notes && (
                              <div className="farming-card-notes">
                                {farmItem.notes}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* TRANSMISIONES DE GUÍAS Y COMUNIDAD */}
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title" style={{ color: 'var(--color-accent-gold)' }}>
                  📡 Transmisión de Frecuencia <span>/ Guías</span>
                </h3>
              </div>
              <div className="panel-body">
                <div className="guides-feed">
                  <a 
                    href="https://www.youtube.com/watch?v=E-3-31N06_s" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="guide-item"
                  >
                    <div 
                      className="guide-thumb" 
                      style={{ backgroundImage: 'url(https://img.youtube.com/vi/E-3-31N06_s/0.jpg)' }}
                    ></div>
                    <div className="guide-info">
                      <div className="guide-title">Rutina Diaria de Warframe - Guía de Farmeo</div>
                      <div className="guide-views">CANAL GRINDEMIA</div>
                    </div>
                  </a>
                  <a 
                    href="https://www.youtube.com/watch?v=Fj2F5p9Tfec" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="guide-item"
                  >
                    <div 
                      className="guide-thumb" 
                      style={{ backgroundImage: 'url(https://img.youtube.com/vi/Fj2F5p9Tfec/0.jpg)' }}
                    ></div>
                    <div className="guide-info">
                      <div className="guide-title">Cómo Subir Rápido de Rango de Maestría</div>
                      <div className="guide-views">CANAL GRINDEMIA</div>
                    </div>
                  </a>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
