# 🪐 Grindemia WF-Tracker — Plataforma de Progreso y Farmeo de Warframe

¡Bienvenido al repositorio oficial del **Grindemia WF-Tracker**! Esta es una aplicación web multiusuario diseñada especialmente para la comunidad del canal de YouTube **Grindemia** (@Grindemia). La plataforma permite a los Tenno registrar de forma segura su progreso personal, calcular dinámicamente su Rango de Maestría y planificar sus objetivos de farmeo de manera visual.

El proyecto está diseñado bajo los estrictos principios de **Clean Architecture** (Arquitectura Limpia), lo que asegura que las reglas de negocio sean totalmente independientes de la base de datos, del framework de frontend y de cualquier agente externo.

---

## 🎨 Identidad Visual y Estética de la Plataforma

La interfaz de usuario está inspirada en la cabina de mandos de una nave de Warframe (estilo Ordis y tecnología Orokin):
- **Paleta de Colores:** 
  - Fondo: Oscuro espacial profundo (`#090a0f`)
  - Acentos Principales: Cian / Azul brillante neón (`#00e5ff`)
  - Acentos Secundarios (Orokin): Amarillo oro brillante (`#e6c229`)
  - Alertas / Advertencias: Naranja de energía neón (`#ff6600`)
- **Estilo:** Bordes afilados, rejillas metálicas y paneles con efecto *glassmorphism* (cristal translúcido con desenfoque de fondo).
- **Branding Grindemia:** Integración directa de un feed con las guías de build y farmeo del canal de YouTube de Grindemia asociadas a cada Warframe y arma.

---

## 📂 Estructura del Proyecto (Clean Architecture)

El código fuente está estructurado de la siguiente forma dentro de la carpeta `src/`:

```text
src/
├── domain/                    # 1. Capa de Dominio (Núcleo del Negocio - 100% puro, sin dependencias)
│   ├── entities/              # Entidades core con lógica integrada (User, Item, UserProgress, FarmingItem)
│   └── repositories/          # Puertos / Interfaces que definen los contratos de persistencia
│
├── application/               # 2. Capa de Aplicación (Casos de Uso)
│   └── use-cases/             # Lógica de flujo (ej. MarkItemAsMastered, AddItemToFarmingList)
│
└── infrastructure/            # 3. Capa de Infraestructura (Adaptadores y Drivers externos)
    ├── db/                    # Persistencia y base de datos
    │   ├── prisma/            # Esquema relacional de Prisma (schema.prisma)
    │   └── repositories/      # Implementaciones concretas de los repositorios usando Prisma o Memoria (Pruebas)
    └── index.ts               # Punto de entrada y script de simulación de la lógica core
```

---

## 📊 Diseño de la Base de Datos (Integridad Referencial)

El esquema relacional está diseñado para aislar los datos del usuario y asegurar que cada Tenno tenga su propio progreso único.

### Diagrama de Relaciones de la Base de Datos

```mermaid
erDiagram
    users ||--o{ user_progress : "registra"
    users ||--o{ farming_items : "planifica"
    items ||--o{ user_progress : "tiene progreso"
    items ||--o{ farming_items : "se farmea"

    users {
        string id PK
        string username
        string email
        string passwordHash
        enum role
        datetime createdAt
    }

    items {
        string id PK
        string name
        string uniqueName
        enum category
        int masteryPoints
        int maxRank
        string wikiaUrl
        string imageUrl
        json components
    }

    user_progress {
        string id PK
        string userId FK
        string itemId FK
        enum status
        int currentRank
        datetime updatedAt
    }

    farming_items {
        string id PK
        string userId FK
        string itemId FK
        string notes
        datetime addedAt
    }
```

---

## 🚀 Cómo Ejecutar la Simulación de Lógica de Negocio

Dado que el código sigue Clean Architecture, podemos probar e interactuar con toda la lógica de negocio (Casos de Uso y Entidades) **sin necesidad de configurar una base de datos PostgreSQL real** utilizando los repositorios en memoria (*In-Memory*).

### Requisitos Previos
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- npm o yarn

### Pasos para Ejecutar
1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Compila el código TypeScript:
   ```bash
   npx tsc
   ```
3. Ejecuta la simulación:
   ```bash
   node dist/index.js
   ```

### Salida Esperada en Consola
El script de simulación inicializa los repositorios, añade de forma segura ítems al planificador de farmeo, cambia el estado a masterizado y calcula dinámicamente el total de puntos de maestría obtenidos por el usuario:

```text
--- 🪐 Grindemia WF-Tracker Simulación ---
Inicializando repositorios en memoria (Clean Architecture)...

Cargando catálogo básico de ítems (Simulación de API/Dataset)...
Catálogo cargado con: Excalibur (Warframe) y Orthos (Arma Cuerpo a Cuerpo).
Usuario creado: Grindemia_Tenno (ID: user-123)

--- CASO DE USO: Agregar ítem al planificador de farmeo ---
✅ Ítem añadido a la lista de farmeo con éxito:
{
  "farmingItemId": "farm-xxxxx",
  "userId": "user-123",
  "itemId": "weapon-orthos",
  "notes": "Faltan componentes en Reliquias Meso O4 (Hoja y Plano)"
}

--- CASO DE USO: Marcar ítem como Masterizado ---
✅ Ítem marcado como Masterizado con éxito:
{
  "status": "MASTERED",
  "currentRank": 30,
  "newTotalMasteryPoints": 6000
}

🏆 Puntos de Maestría Totales de Grindemia_Tenno: 6000 XP
```

---

## ⚙️ Configuración para Producción (Base de Datos Real)

Para pasar a un entorno de base de datos PostgreSQL real:
1. Crea un archivo `.env` en la raíz del proyecto.
2. Añade tu URL de conexión:
   ```env
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/grindemia_wf_tracker?schema=public"
   ```
3. Ejecuta las migraciones de Prisma para crear las tablas con integridad referencial:
   ```bash
   npx prisma migrate dev --name init
   ```
4. El contenedor de Inyección de Dependencias instanciará los repositorios de Prisma (`PrismaUserRepository`, `PrismaItemRepository`, etc.) en lugar de los repositorios en memoria, sin alterar una sola línea de código en la capa de Aplicación o Dominio.
