# 🎫 Ticketing App

Application fullstack de gestion de tickets de support avec chat temps réel, gestion multi-entreprises et contrôle d'accès par rôles.

![Node.js](https://img.shields.io/badge/Node.js-22-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![Tests](https://img.shields.io/badge/Tests-147%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-85+%25-brightgreen)

## ✨ Fonctionnalités

- 🔐 **Authentification** JWT via cookies httpOnly
- 👥 **Rôles** : admin / support / user avec permissions granulaires
- 🎫 **Tickets** : numérotation automatique par entreprise et par année (`ACME-0001-2026`)
- 💬 **Chat temps réel** par ticket via Socket.io
- 🔔 **Notifications** temps réel (nouveau ticket, nouveau message)
- 🏢 **Multi-entreprises** : chaque user est rattaché à une ou plusieurs entreprises
- 📊 **Dashboard** dynamique selon le rôle
- 📋 **Logs** d'actions complets (admin)
- 🌙 **Dark mode** / Light mode
- 🐳 **Docker Compose** pour le développement local

## 🏗️ Architecture

```
├── backend/          # Node.js + Express + TypeScript + MongoDB
├── frontend/         # React 19 + Vite + TypeScript + Tailwind
├── env/              # Variables d'environnement
└── docker-compose.yml
```

## 🛠️ Stack technique

### Backend
| Technologie | Usage |
|---|---|
| Node.js + Express | Serveur HTTP |
| TypeScript | Typage statique |
| MongoDB + Mongoose | Base de données |
| Socket.io | Temps réel |
| JWT + bcrypt | Authentification |
| Joi | Validation des entrées |
| Jest + Supertest | Tests (94 tests, 89% coverage) |

### Frontend
| Technologie | Usage |
|---|---|
| React 19 + Vite | UI + build |
| TypeScript | Typage statique |
| Tailwind CSS v4 + Shadcn/ui | Styles + composants |
| Zustand | State management |
| Axios | Client HTTP |
| React Hook Form + Zod | Formulaires + validation |
| TanStack Table | Tableaux avec tri/pagination |
| Socket.io-client | Temps réel |

## 🚀 Lancement local

### Prérequis
- Docker + Docker Compose

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/Killian-Tirache/ticketing-app.git
cd ticketing-app

# 2. Configurer les variables d'environnement
cp env/.env.backend.example env/.env.backend
cp env/.env.frontend.example env/.env.frontend
cp env/.env.mongo.example env/.env.mongo
cp env/.env.mongo-express.example env/.env.mongo-express

# 3. Éditer les fichiers .env avec vos valeurs

# 4. Lancer les services
docker compose up --build
```

### Services disponibles

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Mongo Express | http://localhost:8081 |

## 🧪 Tests

```bash
cd backend

# Lancer les tests
npm test

# Avec rapport de coverage
npm test -- --coverage
```

## 📡 API Endpoints

### Auth
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/login` | Connexion |
| POST | `/api/logout` | Déconnexion |
| GET | `/api/me` | Utilisateur connecté |

### Tickets
| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/api/tickets` | Liste paginée + filtres | Tous |
| GET | `/api/ticket/:id` | Détail | Tous |
| POST | `/api/ticket` | Création | Tous |
| PUT | `/api/ticket/:id` | Modification | Admin + Support |
| DELETE | `/api/ticket/:id` | Suppression | Admin |

### Users / Companies / Logs
| Méthode | Route | Accès |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/users`, `/api/user/:id` | Admin |
| GET/POST/PUT/DELETE | `/api/companies`, `/api/company/:id` | Admin |
| GET | `/api/logs` | Admin |

## 🔑 Rôles et permissions

| Fonctionnalité | Admin | Support | User |
|---|---|---|---|
| Voir tous les tickets | ✅ | ❌ (ses entreprises) | ❌ (ses entreprises) |
| Créer un ticket | ✅ | ✅ | ✅ |
| Modifier un ticket | ✅ | ✅ (statut uniquement) | ❌ |
| Supprimer un ticket | ✅ | ❌ | ❌ |
| Assigner un ticket | ✅ (admin/support) | ✅ (à soi-même) | ❌ |
| Chat ticket | ✅ | ✅ | ✅ |
| Gérer users/companies | ✅ | ❌ | ❌ |
| Voir les logs | ✅ | ❌ | ❌ |

## 📁 Structure du projet

<details>
<summary>Backend</summary>

```
backend/src/
├── controllers/   # Logique métier
├── middlewares/   # Auth, rôles, validation, erreurs
├── models/        # Schémas Mongoose
├── routes/        # Routes Express
├── utils/         # Helpers (AppError, asyncHandler, logAction...)
├── validations/   # Schémas Joi
├── types/         # Types TypeScript
└── index.ts
```
</details>

<details>
<summary>Frontend</summary>

```
frontend/src/
├── components/    # Composants réutilisables + Shadcn/ui
├── pages/         # Pages de l'application
├── services/      # Clients API (Axios)
├── store/         # State management (Zustand)
├── hooks/         # Hooks personnalisés
├── types/         # Types TypeScript
└── lib/           # Utilitaires + validations Zod
```
</details>
