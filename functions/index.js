const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

const REPLICATE_API_TOKEN = functions.config().replicate?.api_token || process.env.REPLICATE_API_TOKEN;

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.use('/api', authenticateUser);

app.post('/api/chat/send-message', async (req, res) => {
  try {
    const userId = req.userId;
    const { message, conversation_id } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    let conversationRef;
    if (conversation_id) {
      conversationRef = db.collection('users').doc(userId).collection('conversations').doc(conversation_id);
    } else {
      conversationRef = db.collection('users').doc(userId).collection('conversations').doc();
    }

    const messagesRef = conversationRef.collection('messages');
    await messagesRef.add({
      role: 'user',
      content: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    const previousMessages = await messagesRef.orderBy('timestamp', 'desc').limit(10).get();
    const messages = previousMessages.docs.reverse().map(doc => ({
      role: doc.data().role,
      content: doc.data().content
    }));

    const aiResponse = { text: 'Bonjour! Je suis UnimindAI. Comment puis-je vous aider?', model: 'demo' };

    await messagesRef.add({
      role: 'assistant',
      content: aiResponse.text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      model_used: aiResponse.model
    });

    res.json({
      success: true,
      response: aiResponse.text,
      conversation_id: conversationRef.id,
      model: aiResponse.model
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mcp/tools/list', async (req, res) => {
  const tools = [
    { name: 'save_note', description: 'Sauvegarder une note', inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title', 'content'] } },
    { name: 'search_notes', description: 'Chercher des notes', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'list_notes', description: 'Lister les notes', inputSchema: { type: 'object' } }
  ];
  res.json({ jsonrpc: '2.0', result: { tools }, id: req.body.id || 1 });
});

app.post('/api/mcp/tools/call', async (req, res) => {
  try {
    const userId = req.userId;
    const { params, id } = req.body;
    const { name, arguments: toolArgs } = params;
    let result;

    if (name === 'save_note') {
      const { title, content, tags } = toolArgs;
      const noteRef = await db.collection('users').doc(userId).collection('notes').add({
        title, content, tags: tags || [],
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      result = { success: true, note_id: noteRef.id };
    } else if (name === 'search_notes') {
      const { query, limit = 10 } = toolArgs;
      const snapshot = await db.collection('users').doc(userId).collection('notes').limit(100).get();
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(n => n.content?.includes(query) || n.title?.includes(query)).slice(0, limit);
      result = { success: true, notes, count: notes.length };
    } else if (name === 'list_notes') {
      const { limit = 20 } = toolArgs || {};
      const snapshot = await db.collection('users').doc(userId).collection('notes').limit(limit).get();
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      result = { success: true, notes };
    } else {
      throw new Error('Unknown tool');
    }

    res.json({ jsonrpc: '2.0', result, id });
  } catch (error) {
    res.status(500).json({ jsonrpc: '2.0', error: { code: -1, message: error.message }, id: req.body.id });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

exports.api = functions.https.onRequest(app);
