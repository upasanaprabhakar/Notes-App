require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;
const client = new MongoClient(process.env.MONGO_URI);
let db;

app.use(cors());
app.use(express.json());


if (!process.env.GOOGLE_API_KEY) {
  console.error("❌ GOOGLE_API_KEY is missing in environment variables!");
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


async function connectToDbAndStartServer() {
  try {
    await client.connect();
    db = client.db();
    console.log('✅ Successfully connected to MongoDB');
    app.listen(port, () => {
      console.log(`🚀 Notes backend listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

const transformNote = (note) => {
  if (note) {
    note.id = note._id;
  }
  return note;
};


const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'A token is required for authentication' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Token' });
  }
  return next();
};


app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!(username && password)) {
      return res.status(400).send("All input is required");
    }
    const oldUser = await db.collection('users').findOne({ username });
    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    const user = await db.collection('users').insertOne({
      username,
      password: encryptedPassword,
    });
    const token = jwt.sign(
      { user_id: user.insertedId, username },
      process.env.JWT_SECRET || 'your_default_secret_key',
      { expiresIn: "2h" }
    );
    res.status(201).json({ token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).send("Server error");
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!(username && password)) {
      return res.status(400).send("All input is required");
    }
    const user = await db.collection('users').findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, username },
        process.env.JWT_SECRET || 'your_default_secret_key',
        { expiresIn: "2h" }
      );
      return res.status(200).json({ token });
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send("Server error");
  }
});


app.post('/api/ai/summarize', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'No content provided.' });
    }
    const plainTextContent = content.replace(/<[^>]+>/g, ' ');
    const prompt = `Summarize the following note in a few short bullet points:\n\n"${plainTextContent}"`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    res.json({ summary });
  } catch (error) {
    console.error('Error with AI summarization:', error?.message, error?.response?.data || error);
    res.status(500).json({ message: 'Failed to generate summary.', error: error.message });
  }
});

app.post('/api/ai/action-items', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'No content provided.' });
    }
    const plainTextContent = content.replace(/<[^>]+>/g, ' ');
    const prompt = `Analyze the following text and extract a numbered list of any tasks, deadlines, or action items. If no action items are found, respond with "No action items found.":\n\n"${plainTextContent}"`;
    const result = await model.generateContent(prompt);
    const actionItems = result.response.text();
    res.json({ actionItems });
  } catch (error) {
    console.error('Error finding action items:', error?.message, error?.response?.data || error);
    res.status(500).json({ message: 'Failed to find action items.', error: error.message });
  }
});


const safeObjectId = (id) => {
  if (ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  return null;
};

app.get('/api/notes', verifyToken, async (req, res) => {
  try {
    const userId = safeObjectId(req.user.user_id);
    const notes = await db.collection('notes').find({ userId, isTrashed: false }).toArray();
    res.json(notes.map(transformNote));
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).send('Internal server error');
  }
});

app.get('/api/notes/favorites', verifyToken, async (req, res) => {
  try {
    const userId = safeObjectId(req.user.user_id);
    const notes = await db.collection('notes').find({ userId, isFavorite: true, isTrashed: false }).toArray();
    res.json(notes.map(transformNote));
  } catch (err) {
    console.error('Error fetching favorite notes:', err);
    res.status(500).send('Internal server error');
  }
});

app.get('/api/notes/trash', verifyToken, async (req, res) => {
  try {
    const userId = safeObjectId(req.user.user_id);
    const notes = await db.collection('notes').find({ userId, isTrashed: true }).toArray();
    res.json(notes.map(transformNote));
  } catch (err) {
    console.error('Error fetching trashed notes:', err);
    res.status(500).send('Internal server error');
  }
});

app.get('/api/user/me', verifyToken, async (req, res) => {
    try {
        const username = req.user.username;
        res.status(200).json({ username });
    } catch (err) {
        res.status(500).send("Server error");
    }
});

app.post('/api/notes', verifyToken, async (req, res) => {
  try {
    const userId = safeObjectId(req.user.user_id);
    const newNoteData = {
      userId,
      title: req.body.title || '',
      content: req.body.content || '',
      category: req.body.category || 'default',
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      isFavorite: req.body.isFavorite || false,
      isTrashed: false,
      createdAt: new Date()
    };
    const result = await db.collection('notes').insertOne(newNoteData);
    const newNote = await db.collection('notes').findOne({ _id: result.insertedId });
    res.status(201).json(transformNote(newNote));
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).send('Internal server error');
  }
});

app.put('/api/notes/:id', verifyToken, async (req, res) => {
  try {
    const noteId = safeObjectId(req.params.id);
    const { title, content, category, tags, isFavorite } = req.body;
    const updateData = {
      $set: {
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : [],
        isFavorite
      }
    };
    await db.collection('notes').updateOne({ _id: noteId, userId: safeObjectId(req.user.user_id) }, updateData);
    const updatedNote = await db.collection('notes').findOne({ _id: noteId });
    res.json(transformNote(updatedNote));
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).send('Internal server error');
  }
});

app.patch('/api/notes/:id/toggle-favorite', verifyToken, async (req, res) => {
  try {
    const noteId = safeObjectId(req.params.id);
    const note = await db.collection('notes').findOne({ _id: noteId, userId: safeObjectId(req.user.user_id) });
    await db.collection('notes').updateOne({ _id: noteId }, { $set: { isFavorite: !note.isFavorite } });
    const updatedNote = await db.collection('notes').findOne({ _id: noteId });
    res.json(transformNote(updatedNote));
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).send('Internal server error');
  }
});

app.patch('/api/notes/:id/trash', verifyToken, async (req, res) => {
  try {
    const noteId = safeObjectId(req.params.id);
    await db.collection('notes').updateOne({ _id: noteId, userId: safeObjectId(req.user.user_id) }, { $set: { isTrashed: true } });
    const updatedNote = await db.collection('notes').findOne({ _id: noteId });
    res.json(transformNote(updatedNote));
  } catch (err) {
    console.error('Error moving note to trash:', err);
    res.status(500).send('Internal server error');
  }
});

app.patch('/api/notes/:id/restore', verifyToken, async (req, res) => {
  try {
    const noteId = safeObjectId(req.params.id);
    await db.collection('notes').updateOne({ _id: noteId, userId: safeObjectId(req.user.user_id) }, { $set: { isTrashed: false } });
    const updatedNote = await db.collection('notes').findOne({ _id: noteId });
    res.json(transformNote(updatedNote));
  } catch (err) {
    console.error('Error restoring note:', err);
    res.status(500).send('Internal server error');
  }
});

app.delete('/api/notes/trash/empty', verifyToken, async (req, res) => {
  try {
    await db.collection('notes').deleteMany({ userId: safeObjectId(req.user.user_id), isTrashed: true });
    res.status(204).send();
  } catch (err) {
    console.error('Error emptying trash:', err);
    res.status(500).send('Internal server error');
  }
});

app.delete('/api/notes/:id', verifyToken, async (req, res) => {
  try {
    const noteId = safeObjectId(req.params.id);
    await db.collection('notes').deleteOne({ _id: noteId, userId: safeObjectId(req.user.user_id) });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).send('Internal server error');
  }
});

connectToDbAndStartServer();
