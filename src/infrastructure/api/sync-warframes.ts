import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Warframes.json';
const targetDir = path.resolve(__dirname, '../db/data');
const targetFile = path.join(targetDir, 'warframes.json');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('🛰️ Descargando catálogo oficial de Warframes desde WFCD...');

https.get(url, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log(`✅ Datos recibidos. Procesando ${data.length} registros...`);
      
      // Filtrar sólo Warframes jugables reales (Excluir Specters, clone, etc.)
      const warframes = data
        .filter((item: any) => {
          const name = item.name.toLowerCase();
          return (
            item.category === 'Warframes' &&
            !name.includes('specter') &&
            !name.includes('clone') &&
            !name.includes('test') &&
            item.type === 'Warframe'
          );
        })
        .map((item: any) => {
          // Normalizar y extraer estadísticas clave
          return {
            id: item.uniqueName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: item.name,
            uniqueName: item.uniqueName,
            category: 'WARFRAME',
            masteryPoints: 6000,
            maxRank: 30, // Los warframes siempre tienen rango máx 30
            health: item.health || 100,
            shield: item.shield || 100,
            armor: item.armor || 100,
            energy: item.power || 100, // En warframe-items, 'power' representa la energía base
            sprint: item.sprint || 1.0,
            wikiaUrl: item.wikiaUrl || `https://warframe.fandom.com/wiki/${encodeURIComponent(item.name)}`,
            imageUrl: item.wikiaThumbnail || `https://raw.githubusercontent.com/wfcd/warframe-items/master/data/img/${item.name.toLowerCase().replace(/\s+/g, '-')}.png`
          };
        });

      // Escribir archivo de salida
      fs.writeFileSync(targetFile, JSON.stringify(warframes, null, 2));
      console.log(`🎉 Sincronización exitosa: ${warframes.length} Warframes guardados con estadísticas relevantes en: ${targetFile}`);
    } catch (e: any) {
      console.error('❌ Error al procesar JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error en la conexión HTTP:', err.message);
});
