export default async function handler(req, res) {
  const { q } = req.query;
  
  if (!process.env.GIPHY_API_KEY) {
    return res.status(500).json({ error: 'GIPHY_API_KEY is not configured' });
  }

  if (!q) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=15&rating=g`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Giphy API');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Giphy API error:', error);
    res.status(500).json({ error: 'Failed to fetch GIFs' });
  }
} 