'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { io } from 'socket.io-client';

const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000').replace(/\/$/, '');

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
      const newContent = text.toString();
      setCode(prev => (prev === newContent ? prev : newContent));
    }
  }, []);

  // Sync React 'files' list with Yjs file metadata
  const refreshFiles = useCallback((yArray) => {
    const remoteFiles = yArray.toArray();
    // Filter out duplicates by ID to prevent key collision in UI
    const uniqueFiles = Array.from(new Map(remoteFiles.map(f => [String(f.id), f])).values());
    
    setFiles(prev => {
      // Shallow equality check for the array and its items
      if (prev.length === uniqueFiles.length && 
          prev.every((f, i) => f.id === uniqueFiles[i].id && f.name === uniqueFiles[i].name && f.parentId === uniqueFiles[i].parentId)) {
        return prev;
      }
      return uniqueFiles;
    });
  }, []);

  const sanitizeFile = (f) => ({
    ...f,
    id: String(f.id || ''),
    name: String(f.name || 'Untitled'),
    parentId: String(f.parentId || 'root'),
    content: String(f.content || '')
  });

  useEffect(() => {
    selectedFileIdRef.current = selectedFileId;
  }, [selectedFileId]);

  // ----- Socket + Yjs initialization -----
  useEffect(() => {
    const doc = ydoc.current;
    const yFileList = doc.getArray('fileList');

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnectionAttempts: 5,
      timeout: 10000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-project', projectId);
      socket.emit('get-document', projectId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('document-init', ({ state }) => {
      Y.applyUpdate(doc, new Uint8Array(state), 'remote');
      refreshFiles(yFileList);
    });
    
    socket.on('document-update', ({ update }) => {
      Y.applyUpdate(doc, new Uint8Array(update), 'remote');
      refreshFiles(yFileList);
    });

    socket.on('cursor-update', ({ position, user, id }) => {
      setCursors((prev) => {
        if (prev[id]?.position?.lineNumber === position.lineNumber && 
            prev[id]?.position?.column === position.column) return prev;
        return { ...prev, [id]: { position, user } };
      });
    });

    socket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    doc.on('update', (update, origin) => {
      if (origin !== 'remote') {
        socket.emit('sync-document', { projectId, update: Array.from(update) });
      }
    });

    const fileListObserver = () => refreshFiles(yFileList);
    yFileList.observe(fileListObserver);

    return () => {
      yFileList.unobserve(fileListObserver);
      socket.disconnect();
    };
  }, [projectId, refreshFiles]);

  // ----- Initialize or Switch File + Specific Content Observation -----
  useEffect(() => {
    const doc = ydoc.current;
    const ymap = doc.getMap('files');
    const yFileList = doc.getArray('fileList');

    const currentFile = files.find(f => f.id === selectedFileId);
    if (currentFile && !ymap.get(selectedFileId)) {
      const text = new Y.Text();
      text.insert(0, currentFile.content || '');
      doc.transact(() => {
        ymap.set(selectedFileId, text);
        const exists = yFileList.toArray().some(f => String(f.id) === String(selectedFileId));
        if (!exists) {
          yFileList.push([sanitizeFile(currentFile)]);
        }
      });
    }

    const text = ymap.get(selectedFileId);
    setYtext(text);
    
    if (text) {
      const updateLocalCode = () => {
        const newContent = text.toString();
        setCode(prev => (prev === newContent ? prev : newContent));
      };
      
      updateLocalCode();
      text.observe(updateLocalCode);
      return () => text.unobserve(updateLocalCode);
    }
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
      // Code state is updated by the observer, but we set it here for immediate UI feedback
      setCode(newContent);
    }
  }, []);

  const addFile = useCallback((newFile) => {
    const doc = ydoc.current;
    const ymap = doc.getMap('files');
    const yFileList = doc.getArray('fileList');

    const cleanFile = sanitizeFile(newFile);
    const text = new Y.Text();
    text.insert(0, cleanFile.content || '');
    
    doc.transact(() => {
      ymap.set(cleanFile.id, text);
      yFileList.push([cleanFile]);
    });
  }, []);

  const deleteFile = useCallback((fileId) => {
    const doc = ydoc.current;
    const ymap = doc.getMap('files');
    const yFileList = doc.getArray('fileList');

    doc.transact(() => {
      // Find all files that are children of this folder (recursively)
      const allFiles = yFileList.toArray();
      const idsToDelete = [fileId];
      
      const findChildren = (parentId) => {
        allFiles.forEach(f => {
          if (f.parentId === parentId) {
            idsToDelete.push(f.id);
            if (f.isFolder) findChildren(f.id);
          }
        });
      };

      // If it's a folder, find all descendants
      const target = allFiles.find(f => f.id === fileId);
      if (target?.isFolder) findChildren(fileId);

      // Unique IDs to handle any circularity or redundancy
      const uniqueIds = Array.from(new Set(idsToDelete));

      uniqueIds.forEach(id => {
        ymap.delete(id);
        const index = yFileList.toArray().findIndex(f => f.id === id);
        if (index !== -1) {
          yFileList.delete(index, 1);
        }
      });
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
