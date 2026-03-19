'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { io } from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

const docCache = {};
const getOrCreateDoc = (projectId) => {
  if (!docCache[projectId]) {
    docCache[projectId] = new Y.Doc();
  }
  return docCache[projectId];
};

const useCollaboration = (projectId, selectedFileId, initialFiles = []) => {
  const [code, setCode] = useState('');
  const [files, setFiles] = useState(initialFiles);
  const [cursors, setCursors] = useState({});
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [ytext, setYtext] = useState(null);

  const ydoc = useRef(getOrCreateDoc(projectId));
  const socketRef = useRef(null);
  const selectedFileIdRef = useRef(selectedFileId);

  // Sync React 'code' state with Yjs current file content
  const refreshCode = useCallback((ymap, fileId) => {
    const text = ymap.get(fileId);
    if (text) {
      setCode(text.toString());
    }
  }, []);

  // Sync React 'files' list with Yjs file metadata
  const refreshFiles = useCallback((yArray) => {
    const remoteFiles = yArray.toArray();
    setFiles(remoteFiles);
  }, []);

  useEffect(() => {
    selectedFileIdRef.current = selectedFileId;
  }, [selectedFileId]);

  // ----- Socket + Yjs initialization -----
  useEffect(() => {
    const doc = ydoc.current;
    const ymap = doc.getMap('files');
    const yFileList = doc.getArray('fileList');

    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-project', projectId);
      socket.emit('get-document', projectId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('document-init', ({ state }) => {
      Y.applyUpdate(doc, new Uint8Array(state), 'remote');
      refreshCode(ymap, selectedFileIdRef.current);
      refreshFiles(yFileList);
    });
    
    socket.on('document-update', ({ update }) => {
      console.log('Remote update received:', projectId);
      Y.applyUpdate(doc, new Uint8Array(update), 'remote');
      refreshCode(ymap, selectedFileIdRef.current);
      refreshFiles(yFileList);
    });

    socket.on('cursor-update', ({ position, user, id }) => {
      setCursors((prev) => ({ ...prev, [id]: { position, user } }));
    });

    socket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    doc.on('update', (update, origin) => {
      if (origin !== 'remote') {
        console.log('Sending local update:', projectId);
        socket.emit('sync-document', { projectId, update: Array.from(update) });
      }
    });

    // Watch for deep changes in files map and file list array
    ymap.observeDeep(() => refreshCode(ymap, selectedFileIdRef.current));
    yFileList.observe(() => refreshFiles(yFileList));

    return () => {
      socket.disconnect();
    };
  }, [projectId, refreshCode, refreshFiles]);

  // ----- Initialize or Switch File -----
  useEffect(() => {
    const doc = ydoc.current;
    const ymap = doc.getMap('files');
    const yFileList = doc.getArray('fileList');

    // If file doesn't exist in Yjs yet, seed it from initial config
    const currentFile = files.find(f => f.id === selectedFileId);
    if (currentFile && !ymap.get(selectedFileId)) {
      const text = new Y.Text();
      text.insert(0, currentFile.content || '');
      doc.transact(() => {
        ymap.set(selectedFileId, text);
        // Also add to fileList if not present
        const exists = yFileList.toArray().some(f => f.id === selectedFileId);
        if (!exists) {
          yFileList.push([currentFile]);
        }
      });
    }

    const text = ymap.get(selectedFileId);
    setYtext(text);
    if (text) setCode(text.toString());
  }, [selectedFileId, files]);

  // ----- Actions -----

  const updateCode = useCallback((newContent) => {
    const ymap = ydoc.current.getMap('files');
    const text = ymap.get(selectedFileIdRef.current);
    if (text && text.toString() !== newContent) {
      ydoc.current.transact(() => {
        text.delete(0, text.length);
        text.insert(0, newContent);
      });
      setCode(newContent);
    }
  }, []);

  const addFile = useCallback((newFile) => {
    const doc = ydoc.current;
    const ymap = doc.getMap('files');
    const yFileList = doc.getArray('fileList');

    const text = new Y.Text();
    text.insert(0, newFile.content || '');
    
    doc.transact(() => {
      ymap.set(newFile.id, text);
      yFileList.push([newFile]);
    });
  }, []);

  const deleteFile = useCallback((fileId) => {
    const doc = ydoc.current;
    const ymap = doc.getMap('files');
    const yFileList = doc.getArray('fileList');

    doc.transact(() => {
      ymap.delete(fileId);
      const index = yFileList.toArray().findIndex(f => f.id === fileId);
      if (index !== -1) {
        yFileList.delete(index, 1);
      }
    });
  }, []);

  const updateCursor = useCallback((position, user) => {
    socketRef.current?.emit('cursor-move', { projectId, position, user });
  }, [projectId]);

  const sendMessage = useCallback((message, sender) => {
    socketRef.current?.emit('send-message', { projectId, message, sender });
  }, [projectId]);

  return {
    code,
    files,
    addFile,
    deleteFile,
    updateCode,
    cursors,
    updateCursor,
    messages,
    sendMessage,
    connected,
    ytext
  };
};

export default useCollaboration;
