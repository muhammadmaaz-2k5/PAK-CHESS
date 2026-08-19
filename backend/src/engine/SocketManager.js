const { v4: uuidv4 } = require('uuid');

class User {
  /**
   * @param {Object} socket - Socket instance (WebSocket or Socket.io socket)
   * @param {Object} userClaims - { userId, name, isGuest }
   */
  constructor(socket, userClaims = {}) {
    this.socket = socket;
    this.id = uuidv4();
    this.userId = userClaims.userId || 'anon-' + uuidv4().substring(0, 6);
    this.name = userClaims.name || 'Anonymous';
    this.isGuest = !!userClaims.isGuest;
  }

  /**
   * Send data to this specific user
   * @param {string|Object} message
   */
  send(message) {
    try {
      const parsedObj = typeof message === 'string' ? JSON.parse(message) : message;
      const jsonStr = typeof message === 'string' ? message : JSON.stringify(message);

      // 1. Raw WebSocket (ws library)
      if (this.socket && typeof this.socket.send === 'function') {
        if (this.socket.readyState === 1 || this.socket.readyState === undefined) {
          this.socket.send(jsonStr);
        }
      } else if (this.socket && typeof this.socket.emit === 'function') {
        // 2. Socket.IO socket
        this.socket.emit('message', parsedObj);
        if (parsedObj && parsedObj.type) {
          this.socket.emit(parsedObj.type, parsedObj.payload !== undefined ? parsedObj.payload : parsedObj);
        }
      }
    } catch (err) {
      console.error(`Error sending message to user ${this.userId}:`, err.message);
    }
  }
}

class SocketManager {
  constructor() {
    if (!SocketManager.instance) {
      this.interestedSockets = new Map(); // roomId -> User[]
      this.userRoomMapping = new Map();   // userId -> roomId
      this.userSocketMap = new Map();     // userId -> User
      SocketManager.instance = this;
    }
    return SocketManager.instance;
  }

  static getInstance() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  /**
   * Associate a user with a game room
   * @param {User} user
   * @param {string} roomId
   */
  addUser(user, roomId) {
    this.userSocketMap.set(user.userId, user);
    const existingUsers = this.interestedSockets.get(roomId) || [];
    // Prevent duplicate user objects in the same room
    const filtered = existingUsers.filter((u) => u.userId !== user.userId);
    filtered.push(user);
    this.interestedSockets.set(roomId, filtered);
    this.userRoomMapping.set(user.userId, roomId);

    // If socket.io room support is available
    if (user.socket && typeof user.socket.join === 'function') {
      user.socket.join(roomId);
    }
  }

  /**
   * Broadcast message to all users in a game room
   * @param {string} roomId
   * @param {string|Object} message
   */
  broadcast(roomId, message) {
    const users = this.interestedSockets.get(roomId);
    if (!users || users.length === 0) {
      return;
    }

    users.forEach((user) => {
      user.send(message);
    });
  }

  /**
   * Broadcast message to all other users in a room except the sender
   * @param {string} roomId
   * @param {string} senderUserId
   * @param {string|Object} message
   */
  broadcastToOthers(roomId, senderUserId, message) {
    const users = this.interestedSockets.get(roomId);
    if (!users) return;

    users.forEach((user) => {
      if (user.userId !== senderUserId) {
        user.send(message);
      }
    });
  }

  /**
   * Remove a user from rooms on disconnection
   * @param {User} user
   */
  removeUser(user) {
    if (!user) return;
    const roomId = this.userRoomMapping.get(user.userId);
    if (roomId) {
      const roomUsers = this.interestedSockets.get(roomId) || [];
      const remainingUsers = roomUsers.filter((u) => u.userId !== user.userId);
      if (remainingUsers.length === 0) {
        this.interestedSockets.delete(roomId);
      } else {
        this.interestedSockets.set(roomId, remainingUsers);
      }
      this.userRoomMapping.delete(user.userId);
    }
    this.userSocketMap.delete(user.userId);
  }

  getUser(userId) {
    return this.userSocketMap.get(userId);
  }
}

const socketManager = SocketManager.getInstance();

module.exports = {
  User,
  SocketManager,
  socketManager,
};
