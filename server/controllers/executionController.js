const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const executeCode = async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const id = uuidv4();
  const folderPath = path.join(__dirname, '..', 'docker', 'temp-scripts');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Normalize language string
  const normalizedLang = (language || '').toLowerCase().trim();
  const isJS = normalizedLang === 'javascript' || normalizedLang === 'js';
  
  const fileName = isJS ? `script_${id}.js` : `script_${id}`;
  const filePath = path.join(folderPath, fileName);

  console.log(`🚀 Executing ${normalizedLang} code (UUID: ${id})...`);
  console.log(`📄 File path: ${filePath}`);

  try {
    fs.writeFileSync(filePath, code);

    // Use quotes for filePath to handle spaces in directory paths
    const command = isJS ? `node "${filePath}"` : `echo "Unsupported language: ${normalizedLang}"`;

    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      // Clean up the temp file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkErr) {
        console.error(`Status: Failed to delete temp file ${filePath}`, unlinkErr);
      }

      if (error && error.killed) {
        console.warn(`⚠️ Execution timed out for script ${id}`);
        return res.json({ output: 'Execution timed out (5s limit)', error: true });
      }

      const output = stdout || stderr || 'Execution finished with no output';
      const hasError = !!stderr || !!error;
      
      console.log(`✅ Execution finished for script ${id}. Output length: ${output.length}, Error: ${hasError}`);
      
      res.json({ output, error: hasError });
    });
  } catch (err) {
    console.error(`💥 Execution error for script ${id}:`, err);
    res.status(500).json({ error: 'Failed to execute code' });
  }
};

module.exports = { executeCode };
