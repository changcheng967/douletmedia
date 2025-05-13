require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Auth endpoints
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/logout', async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Logged out successfully' });
});

// Posts endpoints
app.get('/api/posts', async (req, res) => {
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/posts', async (req, res) => {
  const { user } = await supabase.auth.getUser(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  const postData = req.body;
  const { data, error } = await supabase.from('posts').insert([{ ...postData, author: user.email }]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Serve frontend
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
