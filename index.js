const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

exports.savePromptData = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }
    
    // Decode base64 data
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedData);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const convId = payload.conversation_id || 'unknown';
    const fileName = `prompt-data/${convId}_${timestamp}.json`;
    
    const bucket = storage.bucket('llm-visibility');
    await bucket.file(fileName).save(JSON.stringify(payload, null, 2), {
      contentType: 'application/json'
    });
    
    console.log('Saved:', fileName);
    res.status(200).json({ success: true, file: fileName });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
