import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './services/RoomManager';
import { UserManager } from './services/UserManager';
import { GameManager } from './services/GameManager';
import { ClientEvents, ServerEvents, RoomStatus, LoginRequest, CreateRoomRequest, JoinRoomRequest, MakeMoveRequest } from './types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// 服务实例
const userManager = new UserManager();
const roomManager = new RoomManager();
const gameManager = new GameManager();

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);

  // 用户登录
  socket.on(ClientEvents.USER_LOGIN, (data: LoginRequest) => {
    const user = userManager.createUser(socket.id, data.name, data.avatar);
    console.log(`用户登录: ${user.name} (${user.id})`);
    socket.emit(ServerEvents.USER_JOINED, user);
  });

  // 获取房间列表
  socket.on(ClientEvents.ROOM_GET_LIST, () => {
    const rooms = roomManager.getRoomList();
    socket.emit(ServerEvents.ROOM_LIST, rooms);
  });

  // 创建房间
  socket.on(ClientEvents.ROOM_CREATE, (data: CreateRoomRequest) => {
    const user = userManager.getUser(socket.id);
    if (!user) {
      socket.emit(ServerEvents.GAME_ERROR, { message: '用户未登录' });
      return;
    }

    const room = roomManager.createRoom(data.name, data.gameType, user);
    user.roomId = room.id;
    socket.join(room.id);
    
    io.emit(ServerEvents.ROOM_CREATED, room);
    socket.emit(ServerEvents.ROOM_UPDATED, room);
    console.log(`房间创建: ${room.name} (${room.id})`);
  });

  // 加入房间
  socket.on(ClientEvents.ROOM_JOIN, (data: JoinRoomRequest) => {
    const user = userManager.getUser(socket.id);
    if (!user) {
      socket.emit(ServerEvents.GAME_ERROR, { message: '用户未登录' });
      return;
    }

    const room = roomManager.joinRoom(data.roomId, user);
    if (!room) {
      socket.emit(ServerEvents.GAME_ERROR, { message: '房间不存在或已满' });
      return;
    }

    user.roomId = room.id;
    socket.join(room.id);
    
    io.to(room.id).emit(ServerEvents.ROOM_UPDATED, room);
    console.log(`用户加入房间: ${user.name} -> ${room.name}`);
  });

  // 离开房间
  socket.on(ClientEvents.ROOM_LEAVE, () => {
    const user = userManager.getUser(socket.id);
    if (!user || !user.roomId) return;

    const room = roomManager.leaveRoom(user.roomId, user.id);
    if (room) {
      io.to(room.id).emit(ServerEvents.ROOM_UPDATED, room);
    } else {
      io.emit(ServerEvents.ROOM_DELETED, { roomId: user.roomId });
    }
    
    socket.leave(user.roomId);
    user.roomId = undefined;
  });

  // 开始游戏
  socket.on(ClientEvents.GAME_START, () => {
    const user = userManager.getUser(socket.id);
    if (!user || !user.roomId) {
      socket.emit(ServerEvents.GAME_ERROR, { message: '不在房间中' });
      return;
    }

    const room = roomManager.getRoom(user.roomId);
    if (!room || room.hostId !== user.id) {
      socket.emit(ServerEvents.GAME_ERROR, { message: '只有房主可以开始游戏' });
      return;
    }

    if (room.players.length < 2) {
      socket.emit(ServerEvents.GAME_ERROR, { message: '至少需要2名玩家' });
      return;
    }

    const gameState = gameManager.createGame(room.gameType, room.players);
    room.gameState = gameState;
    room.status = RoomStatus.PLAYING;

    io.to(room.id).emit(ServerEvents.GAME_STARTED, { room });
    console.log(`游戏开始: ${room.name}`);
  });

  // 执行移动
  socket.on(ClientEvents.GAME_MAKE_MOVE, (data: MakeMoveRequest) => {
    const user = userManager.getUser(socket.id);
    if (!user || !user.roomId) {
      socket.emit(ServerEvents.GAME_ERROR, { message: '不在房间中' });
      return;
    }

    const room = roomManager.getRoom(user.roomId);
    if (!room || !room.gameState) {
      socket.emit(ServerEvents.GAME_ERROR, { message: '游戏未开始' });
      return;
    }

    const result = gameManager.makeMove(room.gameState, user.id, data);
    if (!result.success) {
      socket.emit(ServerEvents.GAME_ERROR, { message: result.error });
      return;
    }

    // 更新房间游戏状态
    room.gameState = result.state;
    if (result.state.winner || result.state.isDraw) {
      room.status = RoomStatus.FINISHED;
      io.to(room.id).emit(ServerEvents.GAME_ENDED, { room, winner: result.state.winner, isDraw: result.state.isDraw });
    } else {
      io.to(room.id).emit(ServerEvents.GAME_STATE_UPDATED, { gameState: result.state });
    }
  });

  // 重置游戏
  socket.on(ClientEvents.GAME_RESET, () => {
    const user = userManager.getUser(socket.id);
    if (!user || !user.roomId) return;

    const room = roomManager.getRoom(user.roomId);
    if (!room || room.hostId !== user.id) return;

    const gameState = gameManager.createGame(room.gameType, room.players);
    room.gameState = gameState;
    room.status = RoomStatus.PLAYING;

    io.to(room.id).emit(ServerEvents.GAME_STARTED, { room });
  });

  // 断开连接
  socket.on('disconnect', () => {
    const user = userManager.getUser(socket.id);
    if (user && user.roomId) {
      const room = roomManager.leaveRoom(user.roomId, user.id);
      if (room) {
        io.to(room.id).emit(ServerEvents.ROOM_UPDATED, room);
      } else {
        io.emit(ServerEvents.ROOM_DELETED, { roomId: user.roomId });
      }
    }
    userManager.removeUser(socket.id);
    console.log(`用户断开连接: ${socket.id}`);
  });
});

// REST API 路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`);
});
