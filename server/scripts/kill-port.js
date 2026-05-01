const { execSync } = require('child_process');

const killPort = (port) => {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = stdout.split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1];
        if (pid !== '0' && !isNaN(pid)) pids.add(pid);
      }
    });

    pids.forEach(pid => {
      console.log(`[CLEANUP] Killing process ${pid} using port ${port}...`);
      try {
        execSync(`taskkill /F /PID ${pid}`);
      } catch (e) {
        // Ignore if process already died
      }
    });
  } catch (err) {
    // No process found on port, that's good
  }
};

const port = process.argv[2] || 5000;
killPort(port);
