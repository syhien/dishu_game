import { create } from 'zustand'
import { Socket } from 'socket.io-client'
import { User, Room, GameState, ServerEvents, ClientEvents } from '../types'

interface GameStateStore {
  // 连接
  socket: Socket | null
  isConnected: boolean
  setSocket: (socket: Socket) => void
  
  // 用户
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  
  // 房间
  rooms: Room[]
  currentRoom: Room | null
  setRooms: (rooms: Room[]) => void
  setCurrentRoom: (room: Room | null) => void
  
  // 游戏
  gameState: GameState | null
  setGameState: (state: GameState | null) => void
  
  // 错误
  error: string | null
  setError: (error: string | null) => void
  
  // 操作
  login: (name: string, avatar: string) => void
  createRoom: (name: string, gameType: 'gomoku') => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  startGame: () => void
  makeMove: (x: number, y: number) => void
  resetGame: () => void
}

export const useGameStore = create<GameStateStore>((set, get) => ({
  // 初始状态
  socket: null,
  isConnected: false,
  currentUser: null,
  rooms: [],
  currentRoom: null,
  gameState: null,
  error: null,

  // Actions
  setSocket: (socket) => {
    set({ socket, isConnected: true })
    
    // 设置事件监听
    socket.on(ServerEvents.ROOM_LIST, (rooms) => {
      set({ rooms })
    })
    
    socket.on(ServerEvents.ROOM_CREATED, (room) => {
      set((state) => {
        // 避免重复添加
        if (state.rooms.find(r => r.id === room.id)) {
          return state
        }
        return { rooms: [room, ...state.rooms] }
      })
    })
    
    socket.on(ServerEvents.ROOM_UPDATED, (room) => {
      set((state) => {
        const isPlayerInRoom = room.players.find((p: User) => p.id === state.currentUser?.id)
        return {
          rooms: state.rooms.map(r => r.id === room.id ? room : r),
          // 如果当前用户在房间里，更新 currentRoom
          currentRoom: isPlayerInRoom ? room : (state.currentRoom?.id === room.id ? room : state.currentRoom)
        }
      })
    })
    
    socket.on(ServerEvents.ROOM_DELETED, ({ roomId }) => {
      set((state) => ({
        rooms: state.rooms.filter(r => r.id !== roomId),
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom
      }))
    })
    
    socket.on(ServerEvents.USER_JOINED, (user) => {
      if (!get().currentUser) {
        set({ currentUser: user })
      }
    })
    
    socket.on(ServerEvents.GAME_STARTED, ({ room }) => {
      set({ currentRoom: room, gameState: room.gameState || null })
    })
    
    socket.on(ServerEvents.GAME_STATE_UPDATED, ({ gameState }) => {
      set({ gameState })
    })
    
    socket.on(ServerEvents.GAME_ENDED, ({ room }) => {
      set({ currentRoom: room, gameState: room.gameState || null })
    })
    
    socket.on(ServerEvents.GAME_ERROR, ({ message }) => {
      set({ error: message })
      setTimeout(() => set({ error: null }), 3000)
    })
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setGameState: (state) => set({ gameState: state }),
  setError: (error) => set({ error }),

  login: (name, avatar) => {
    const { socket } = get()
    if (socket) {
      socket.emit(ClientEvents.USER_LOGIN, { name, avatar })
    }
  },

  createRoom: (name, gameType) => {
    const { socket } = get()
    if (socket) {
      socket.emit(ClientEvents.ROOM_CREATE, { name, gameType })
    }
  },

  joinRoom: (roomId) => {
    const { socket } = get()
    if (socket) {
      socket.emit(ClientEvents.ROOM_JOIN, { roomId })
    }
  },

  leaveRoom: () => {
    const { socket } = get()
    if (socket) {
      socket.emit(ClientEvents.ROOM_LEAVE)
      set({ currentRoom: null, gameState: null })
    }
  },

  startGame: () => {
    const { socket } = get()
    if (socket) {
      socket.emit(ClientEvents.GAME_START)
    }
  },

  makeMove: (x, y) => {
    const { socket, currentRoom } = get()
    if (socket && currentRoom) {
      socket.emit(ClientEvents.GAME_MAKE_MOVE, { roomId: currentRoom.id, x, y })
    }
  },

  resetGame: () => {
    const { socket } = get()
    if (socket) {
      socket.emit(ClientEvents.GAME_RESET)
    }
  }
}))
