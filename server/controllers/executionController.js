const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const folderPath = path.join(__dirname, '..', 'docker', 'temp-scripts');

// Ensure directory exists once at startup or when needed
const ensureDir = async () => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

const executeCode = async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  await ensureDir();
  const id = uuidv4();
  
  const normalizedLang = (language || '').toLowerCase().trim();
  const isJS = normalizedLang === 'javascript' || normalizedLang === 'js';
  
  const fileName = isJS ? `script_${id}.js` : `script_${id}`;
  const filePath = path.join(folderPath, fileName);

  try {
    await fs.writeFile(filePath, code);

    const command = isJS ? `node "${filePath}"` : `echo "Unsupported language: ${normalizedLang}"`;

    exec(command, { timeout: 5000 }, async (error, stdout, stderr) => {
      // Fire-and-forget cleanup
      fs.unlink(filePath).catch(err => console.error(`[CLEANUP] Failed: ${filePath}`, err));

      if (error && error.killed) {
        return res.json({ output: 'Execution timed out (5s limit)', error: true });
      }

      const output = stdout || stderr || 'Execution finished with no output';
      const hasError = !!stderr || !!error;
      
      res.json({ output, error: hasError });
    });
  } catch (err) {
    console.error(`💥 Execution error:`, err);
    res.status(500).json({ error: 'Failed to execute code' });
  }
};

module.exports = { executeCode };
