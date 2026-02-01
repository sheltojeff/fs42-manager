import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Configuration
const FS42_PATH = process.env.FS42_PATH || join(process.env.HOME, 'FieldStation42');
const CONFS_DIR = join(FS42_PATH, 'confs');
const CATALOG_DIR = join(FS42_PATH, 'catalog');
const COMMERCIAL_DIR = join(FS42_PATH, 'commercial');
const BUMP_DIR = join(FS42_PATH, 'bump');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadType = req.body.uploadType || 'channel';
    const channelName = req.body.channelName;
    
    let destPath;
    if (uploadType === 'commercial') {
      destPath = COMMERCIAL_DIR;
    } else if (uploadType === 'bump') {
      destPath = BUMP_DIR;
    } else if (channelName) {
      destPath = join(CATALOG_DIR, channelName);
    } else {
      return cb(new Error('Invalid upload configuration'));
    }
    
    try {
      await fs.mkdir(destPath, { recursive: true });
      cb(null, destPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB limit
});

// Helper functions
async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

async function readJSONFile(path) {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function writeJSONFile(path, data) {
  await fs.writeFile(path, JSON.stringify(data, null, 2));
}

// API Routes

// Get all channels
app.get('/api/channels', async (req, res) => {
  try {
    const files = await fs.readdir(CONFS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const channels = await Promise.all(
      jsonFiles.map(async (file) => {
        const config = await readJSONFile(join(CONFS_DIR, file));
        if (config) {
          return {
            name: config.network_name,
            channelNumber: config.channel_number,
            type: config.network_type,
            commercialFree: config.commercial_free || false,
            breakStrategy: config.break_strategy,
            breakDuration: config.break_duration,
            scheduleIncrement: config.schedule_increment
          };
        }
        return null;
      })
    );
    
    res.json(channels.filter(c => c !== null));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create channel
app.post('/api/channels', async (req, res) => {
  try {
    const { name, channelNumber, type, commercialFree, breakStrategy, breakDuration, scheduleIncrement } = req.body;
    
    // Create directories
    await ensureDir(join(CATALOG_DIR, name));
    await ensureDir(COMMERCIAL_DIR);
    await ensureDir(BUMP_DIR);
    
    // Build configuration
    const config = {
      network_name: name,
      channel_number: channelNumber,
      network_type: type || 'standard',
      content_dir: `catalog/${name}`,
      commercial_free: commercialFree || false
    };
    
    if (!commercialFree) {
      config.commercial_dir = 'commercial';
      config.bump_dir = 'bump';
      config.break_strategy = breakStrategy || 'standard';
      config.break_duration = breakDuration || 120;
    }
    
    if (type === 'standard' && scheduleIncrement) {
      config.schedule_increment = scheduleIncrement;
    }
    
    // Write configuration file
    const configPath = join(CONFS_DIR, `${name}.json`);
    await writeJSONFile(configPath, config);
    
    res.json({ success: true, channel: config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete channel
app.delete('/api/channels/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const configPath = join(CONFS_DIR, `${name}.json`);
    await fs.unlink(configPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload files
app.post('/api/upload', upload.array('files'), (req, res) => {
  res.json({ 
    success: true, 
    filesUploaded: req.files.length 
  });
});

// FS42 Control API
app.post('/api/fs42/catalog/:channelName', async (req, res) => {
  try {
    const { channelName } = req.params;
    const configPath = join(CONFS_DIR, `${channelName}.json`);
    
    const { stdout, stderr } = await execAsync(
      `cd ${FS42_PATH} && source env/bin/activate && python3 station_42.py --rebuild_catalog ${channelName}`,
      { timeout: 60000, shell: '/bin/bash' }
    );
    
    res.json({ success: true, output: stdout, error: stderr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fs42/schedule/:channelName', async (req, res) => {
  try {
    const { channelName } = req.params;
    const { days } = req.body;
    const configPath = join(CONFS_DIR, `${channelName}.json`);
    
    const { stdout, stderr } = await execAsync(
      `cd ${FS42_PATH} && source env/bin/activate && python3 station_42.py --add_week ${channelName}`,
      { timeout: 120000, shell: '/bin/bash' }
    );
    
    res.json({ success: true, output: stdout, error: stderr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fs42/player/start', async (req, res) => {
  try {
    const { channelNumber } = req.body;
    
    const { stdout, stderr } = await execAsync(
      `cd ${FS42_PATH} && source env/bin/activate && nohup python3 field_player.py --channel ${channelNumber} > /dev/null 2>&1 &`,
      { timeout: 5000, shell: '/bin/bash' }
    );
    
    res.json({ success: true, output: stdout, error: stderr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fs42/status', async (req, res) => {
  try {
    const { stdout } = await execAsync('pgrep -f "field_player.py"');
    const isRunning = stdout.trim().length > 0;
    
    res.json({ 
      running: isRunning,
      pid: isRunning ? stdout.trim() : null
    });
  } catch (error) {
    res.json({ running: false, pid: null });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FieldStation42 Manager running on http://0.0.0.0:${PORT}`);
  console.log(`FieldStation42 path: ${FS42_PATH}`);
});
