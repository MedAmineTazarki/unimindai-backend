# 🔥 UnimindAI Backend - Firebase + MCP

Backend Firebase avec MCP Servers pour l'application UnimindAI.

## 🏗️ Architecture

- **Firebase Functions** - API serverless
- **Firestore** - Database NoSQL
- **Firebase Auth** - Authentification JWT
- **MCP Protocol** - JSON-RPC 2.0 pour outils

## 📦 Installation

```bash
# 1. Installer Firebase CLI
npm install -g firebase-tools

# 2. Login Firebase
firebase login

# 3. Installer dépendances
cd functions
npm install

# 4. Configurer le projet
firebase use fallalertapp-9b1fa
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# Configurer Replicate API
firebase functions:config:set replicate.api_token="VOTRE_CLE_ICI"

# Voir la configuration
firebase functions:config:get
```

### Fichier .env (local seulement)

Créez `functions/.env`:
```
REPLICATE_API_TOKEN=votre_cle_replicate
```

## 🚀 Déploiement

```bash
# Déployer les functions
firebase deploy --only functions

# Déployer Firestore rules
firebase deploy --only firestore:rules

# Déployer tout
firebase deploy
```

## 📡 API Endpoints

### Base URL
```
https://us-central1-fallalertapp-9b1fa.cloudfunctions.net/api
```

### Endpoints disponibles

#### 1. Chat
```bash
POST /api/chat/send-message
Headers: Authorization: Bearer {firebase_token}
Body: {
  "message": "Bonjour",
  "conversation_id": "optional"
}
```

#### 2. MCP Tools List
```bash
POST /api/mcp/tools/list
Headers: Authorization: Bearer {firebase_token}
Body: {
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

#### 3. MCP Tools Call
```bash
POST /api/mcp/tools/call
Headers: Authorization: Bearer {firebase_token}
Body: {
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "save_note",
    "arguments": {
      "title": "Ma note",
      "content": "Contenu de la note"
    }
  },
  "id": 1
}
```

#### 4. Health Check
```bash
GET /health
```

## 🛠️ MCP Tools Disponibles

### Knowledge Base
- `save_note` - Sauvegarder une note
- `search_notes` - Chercher dans les notes
- `list_notes` - Lister toutes les notes
- `delete_note` - Supprimer une note

### Personalization (à venir)
- `track_action` - Enregistrer une action
- `get_user_profile` - Profil utilisateur

### Calendar (à venir)
- `get_events` - Événements calendrier
- `check_availability` - Vérifier disponibilité

### Email (à venir)
- `search_emails` - Chercher emails
- `list_emails` - Lister emails

## 🗄️ Structure Firestore

```
users/
  {userId}/
    profile: {...}
    subscription: {tier, status, ...}
    user_profile: {preferences, ...}

    conversations/
      {conversationId}/
        messages/
          {messageId}: {role, content, timestamp}

    notes/
      {noteId}: {title, content, tags, created_at}

    actions/
      {actionId}: {type, data, timestamp}
```

## 🧪 Tests Locaux

```bash
# Lancer l'émulateur
cd functions
npm run serve

# URL locale
http://localhost:5001/fallalertapp-9b1fa/us-central1/api
```

## 🔐 Sécurité

- ✅ Authentication JWT Firebase
- ✅ Firestore rules (user isolation)
- ✅ Rate limiting
- ✅ CORS configuré
- ✅ Secrets via environment variables

## 📊 Monitoring

```bash
# Voir les logs
firebase functions:log

# Voir les erreurs
firebase functions:log --only api

# Dashboard
# Firebase Console → Functions → Logs
```

## 🔄 Workflow

1. User login → Firebase Auth → JWT token
2. App calls API → Token validated
3. API processes request → Calls MCP tools
4. MCP tools access Firestore/External APIs
5. Response returned to app

## 📞 Support

Pour toute question : [GitHub Issues](https://github.com/MedAmineTazarki/unimindai-backend/issues)

## 📄 Licence

MIT License
