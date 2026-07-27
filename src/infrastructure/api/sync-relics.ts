import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL de la base de datos de reliquias oficial y actualizada de warframe-items
const url = 'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Relics.json';
const targetDir = path.resolve(__dirname, '../db/data');
const targetFile = path.join(targetDir, 'relics.json');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('🛰️ Descargando base de datos oficial y completa de Reliquias (8.7MB)...');

https.get(url, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const rawData = JSON.parse(body);
      console.log(`✅ Datos recibidos. Filtrando y optimizando ${rawData.length} registros...`);
      
      // Filtrar sólo por el estado "Intact" para evitar duplicados por refinamiento
      // y estructurar de acuerdo a nuestro modelo de datos compacto
      const relics = rawData
        .filter((relic: any) => relic.name && relic.name.endsWith(' Intact'))
        .map((relic: any) => {
          const normalizedName = relic.name.replace(' Intact', '');
          
          return {
            name: normalizedName,
            vaulted: relic.vaulted || false,
            rewards: relic.rewards.map((reward: any) => ({
              item: reward.item.name,
              type: reward.rarity,
              chance: reward.chance / 100 // Convertir de 2% a 0.02
            }))
          };
        });

      // Guardar el archivo optimizado
      fs.writeFileSync(targetFile, JSON.stringify(relics, null, 2));
      console.log(`🎉 Sincronización y optimización exitosa: ${relics.length} reliquias únicas guardadas en: ${targetFile}`);
    } catch (e: any) {
      console.error('❌ Error al procesar el JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error en la conexión HTTP:', err.message);
});
