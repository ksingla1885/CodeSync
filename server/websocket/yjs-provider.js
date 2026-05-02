const Y = require('yjs');
const Project = require('../models/Project');

const setupYjs = (io) => {
  const documents = new Map();
  const loadingPromises = new Map();
  const dirtyProjectIds = new Set();

  const getOrLoadDocument = async (projectId) => {
    // 1. Check if already in memory
    if (documents.has(projectId)) return documents.get(projectId);

    // 2. Check if currently loading to prevent race conditions
    if (loadingPromises.has(projectId)) return loadingPromises.get(projectId);

    const loadPromise = (async () => {
      const doc = new Y.Doc();
      try {
        const project = await Project.findById(projectId).lean();
        if (project && project.docState) {
          // docState is a Buffer from MongoDB
          Y.applyUpdate(doc, new Uint8Array(project.docState));
        }
      } catch (err) {
        console.error(`[YJS] Error loading project ${projectId}:`, err);
      }
      documents.set(projectId, doc);
      loadingPromises.delete(projectId);
      return doc;
    })();

    loadingPromises.set(projectId, loadPromise);
    return loadPromise;
  };

  const savePersistentState = async () => {
    if (dirtyProjectIds.size === 0) return;

    const idsToSave = Array.from(dirtyProjectIds);
    dirtyProjectIds.clear();

    await Promise.all(idsToSave.map(async (projectId) => {
      try {
        const doc = documents.get(projectId);
        if (doc) {
          const state = Y.encodeStateAsUpdate(doc);
          await Project.findByIdAndUpdate(projectId, { 
             docState: Buffer.from(state) 
          });
        }
      } catch (err) {
        console.error(`[YJS] Error persisting project ${projectId}:`, err);
        // Put back in dirty set if it failed? (Optional, depends on error type)
        dirtyProjectIds.add(projectId);
      }
    }));
  };

  // Run persistence every 10 seconds if changes occur
  setInterval(savePersistentState, 10000);

  io.on('connection', (socket) => {
    socket.on('sync-document', async ({ projectId, update }) => {
      if (!projectId) return;
      const doc = await getOrLoadDocument(projectId);
      
      if (update) {
        // Socket.io handles Buffer/Uint8Array efficiently
        Y.applyUpdate(doc, new Uint8Array(update));
        dirtyProjectIds.add(projectId);
        
        // Broadcast binary update to others
        socket.to(projectId).emit('document-update', { projectId, update });
      }
    });

    socket.on('get-document', async (projectId) => {
      if (!projectId) return;
      const doc = await getOrLoadDocument(projectId);
      const state = Y.encodeStateAsUpdate(doc);
      // Send as Buffer directly
      socket.emit('document-init', { projectId, state: Buffer.from(state) });
    });
  });
};

module.exports = { setupYjs };
