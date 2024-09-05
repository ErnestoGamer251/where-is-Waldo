const express = require('express');
const app = express();
app.use(express.json());

const { Pool } = require('pg');
const pool = new Pool({
  user: 'your_user',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

// Endpoint para obtener la lista de imágenes
app.get('/get-images', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM images');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching images' });
  }
});

// Endpoint para obtener los datos de una imagen específica
app.get('/get-image-data/:imageId', async (req, res) => {
  const { imageId } = req.params;
  
  try {
    // Obtener la URL de la imagen
    const imageResult = await pool.query('SELECT url FROM images WHERE id = $1', [imageId]);
    const imageUrl = imageResult.rows[0].url;

    // Obtener los personajes relacionados con la imagen
    const charactersResult = await pool.query('SELECT name, x, y, tolerance FROM characters WHERE image_id = $1', [imageId]);
    const characters = charactersResult.rows;

    res.json({ imageUrl, characters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching image data' });
  }
});

// Endpoint para validar la selección de un personaje
app.post('/validate', async (req, res) => {
  const { character, coords, imageId } = req.body;

  try {
    const result = await pool.query(
      'SELECT x, y, tolerance FROM characters WHERE name = $1 AND image_id = $2',
      [character, imageId]
    );

    if (result.rows.length > 0) {
      const { x, y, tolerance } = result.rows[0];
      const distance = Math.sqrt(Math.pow(x - coords.x, 2) + Math.pow(y - coords.y, 2));
      
      if (distance <= tolerance) {
        return res.json({ success: true });
      }
    }

    res.json({ success: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error validating character' });
  }
});

// Endpoint para guardar la puntuación
app.post('/submit-score', async (req, res) => {
  const { name, time, imageId } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO high_scores (name, time, image_id) VALUES ($1, $2, $3) RETURNING *',
      [name, time, imageId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to save score' });
  }
});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
