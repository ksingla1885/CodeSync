const Y = require('yjs');

const setupYjs = (io) => {
  const documents = new Map();

  io.on('connection', (socket) => {
    socket.on('sync-document', ({ projectId, update }) => {
      // Get or create Yjs document for this project
      if (!documents.has(projectId)) {
        documents.set(projectId, new Y.Doc());
      }
      const doc = documents.get(projectId);
      
      // Apply the update to the server-side document
      if (update) {
        Y.applyUpdate(doc, new Uint8Array(update));
      }

      // Broadcast changes to other clients in the same project room
      socket.to(projectId).emit('document-update', { projectId, update });
    });

    // Send the full document to a newly connected client
    socket.on('get-document', (projectId) => {
      if (documents.has(projectId)) {
        const doc = documents.get(projectId);
        const state = Y.encodeStateAsUpdate(doc);
        socket.emit('document-init', { projectId, state: Array.from(state) });
      }
    });
  });
};

module.exports = { setupYjs };
