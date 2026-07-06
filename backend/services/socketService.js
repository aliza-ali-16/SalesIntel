let io = null;

// Initialize the socket.io server instance
function initSocket(ioInstance) {
  io = ioInstance;
  io.on('connection', (socket) => {
    console.log(`⚡ [SOCKET.IO] Client connection established: ${socket.id}`);
    
    // Allow manual connection verification
    socket.emit('socket_connected', { message: 'Real-time pipeline connected successfully.' });
    
    socket.on('disconnect', () => {
      console.log(`⚡ [SOCKET.IO] Client disconnected: ${socket.id}`);
    });
  });
}

// Broadcast events to all listening clients
function emitEvent(eventName, data) {
  if (io) {
    io.emit(eventName, data);
  } else {
    // Graceful silent print in dev if socket server isn't boot loaded yet
    console.log(`[SOCKET DISPATCH MOCK] Event: ${eventName} payload broadcasted`);
  }
}

module.exports = {
  initSocket,
  emitEvent
};
