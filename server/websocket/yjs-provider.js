const Y = require('yjs');
const Project = require('../models/Project');

const setupYjs = (io) => {
  const documents = new Map();
  const dirtyProjectIds = new Set();

  const getOrLoadDocument = async (projectId) => {
    if (documents.has(projectId)) return documents.get(projectId);

    const doc = new Y.Doc();
    documents.set(projectId, doc);

    try {
      // Attempt to load from MongoDB
      const project = await Project.findById(projectId);
      if (project && project.docState) {
        console.log(`[YJS] Loading persistent state for project ${projectId}`);
        Y.applyUpdate(doc, project.docState);
      }
    } catch (err) {
      console.error(`[YJS] Error loading project ${projectId}:`, err);
    }
    return doc;
  };

  const savePersistentState = async () => {
    if (dirtyProjectIds.size === 0) return;

    for (const projectId of dirtyProjectIds) {
      try {
        const doc = documents.get(projectId);
        if (doc) {
          const state = Y.encodeStateAsUpdate(doc);
          await Project.findByIdAndUpdate(projectId, { 
             docState: Buffer.from(state) 
          });
          console.log(`[YJS] Persisted state for project ${projectId}`);
        }
      } catch (err) {
        console.error(`[YJS] Error persisting project ${projectId}:`, err);
      }
    }
    dirtyProjectIds.clear();
  };

  // Run persistence every 10 seconds if changes occur
  setInterval(savePersistentState, 10000);

  io.on('connection', (socket) => {
    // Sync React 'files' list with Yjs file metadata
    socket.on('sync-document', async ({ projectId, update }) => {
      if (!projectId) return;
      const doc = await getOrLoadDocument(projectId);
      
      // Apply the update to the server-side document
      if (update) {
        Y.applyUpdate(doc, new Uint8Array(update));
        dirtyProjectIds.add(projectId);
      }

      // Broadcast changes to other clients in the same project room
      socket.to(projectId).emit('document-update', { projectId, update });
    });

    // Send the full document to a newly connected client
    socket.on('get-document', async (projectId) => {
      if (!projectId) return;
      const doc = await getOrLoadDocument(projectId);
      const state = Y.encodeStateAsUpdate(doc);
      socket.emit('document-init', { projectId, state: Array.from(state) });
    });
  });
};

module.exports = { setupYjs };
