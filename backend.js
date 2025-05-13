require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Auth Endpoints
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

app.get('/api/auth/session', async (req, res) => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user });
});

app.get('/api/auth/admin-check', async (req, res) => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
  
  // Simple admin check - in production you'd check a proper role
  const isAdmin = user.email.includes('admin');
  res.json({ isAdmin });
});

// Posts Endpoints
app.get('/api/posts', async (req, res) => {
  const { published } = req.query;
  let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
  
  if (published === 'true') query = query.eq('published', true);
  
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/posts', async (req, res) => {
  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    req.headers.authorization?.split(' ')[1]
  );
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // Create post
  const { data, error } = await supabase
    .from('posts')
    .insert([{ ...req.body, author: user.email }])
    .select();
  
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.delete('/api/posts/:id', async (req, res) => {
  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    req.headers.authorization?.split(' ')[1]
  );
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // Delete post
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', req.params.id);
  
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Post deleted successfully' });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = app;
