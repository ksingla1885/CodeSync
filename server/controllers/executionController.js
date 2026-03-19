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

  const fileName = language === 'javascript' ? `script_${id}.js` : `script_${id}`;
  const filePath = path.join(folderPath, fileName);

  try {
    fs.writeFileSync(filePath, code);

    // Fallback if Docker is not available: Use child_process for direct Node execution
    // for this demo.
    // In production, use: `docker run --rm -v ${filePath}:/app/script.js node-sandbox`
    const command = language === 'javascript' ? `node ${filePath}` : `echo 'Only javascript is supported for now'`;

    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      // Clean up the temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (error && error.killed) {
        return res.json({ output: 'Execution timed out (5s limit)', error: true });
      }

      const output = stdout || stderr || 'Execution finished with no output';
      res.json({ output, error: !!stderr });
    });
  } catch (err) {
    console.error('Execution error:', err);
    res.status(500).json({ error: 'Failed to execute code' });
  }
};

module.exports = { executeCode };
