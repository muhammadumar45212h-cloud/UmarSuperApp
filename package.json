const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json());
const upload = multer();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post('/api/post-video', upload.single('video'), async (req, res) => {
  const { token } = req.body;
  const file = req.file;
  
  if (!file) return res.status(400).json({ error: 'Video file chahiye' });
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Login karo pehle' });

  const fileName = `${Date.now()}_${file.originalname}`;
  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(fileName, file.buffer, { contentType: file.mimetype });

  if (uploadError) return res.status(400).json({ error: uploadError.message });

  const { data: { publicUrl } = supabase.storage
    .from('videos')
    .getPublicUrl(fileName);

  const username = user.user_metadata.username || user.email;
  const { error } = await supabase.from('videos').insert([{ 
    username, 
    video_link: publicUrl 
  }]);
  
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/videos', async (req, res) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
