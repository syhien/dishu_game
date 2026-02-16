import { create } from 'zustand'
import { Socket } from 'socket.io-client'
import { User, Room, GameState, ServerEvents, ClientEvents, GameType, MakeMoveRequest } from '../types'

const PROFILE_STORAGE_KEY = 'dishu:playerProfile'

interface PlayerProfile {
  name: string
  avatar: string
  sessionId: string
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getStoredProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlayerProfile
    if (!parsed?.name || !parsed?.avatar || !parsed?.sessionId) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

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
  createRoom: (name: string, gameType: GameType) => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  startGame: () => void
  makeMove: (move: Omit<MakeMoveRequest, 'roomId'>) => void
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
    if (get().socket === socket) {
      return
    }

    set({ socket })

    const handleConnected = () => {
      set({ isConnected: true })
      const profile = getStoredProfile()
      if (!profile) {
        return
      }

      const shouldRestoreSession =
        !!get().currentUser ||
        !!get().currentRoom ||
        window.location.pathname.startsWith('/room/')

      if (shouldRestoreSession) {
        socket.emit(ClientEvents.USER_LOGIN, {
          name: profile.name,
          avatar: profile.avatar,
          sessionId: profile.sessionId
        })
      }
    }

    socket.on('connect', handleConnected)

    socket.on('disconnect', () => {
      set({ isConnected: false })
    })

    if (socket.connected) {
      handleConnected()
    }
    
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
        const hasRoomInList = state.rooms.some(r => r.id === room.id)
        return {
          rooms: hasRoomInList
            ? state.rooms.map(r => r.id === room.id ? room : r)
            : [room, ...state.rooms],
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
      set({ currentUser: user })

      const profile = getStoredProfile()
      if (profile) {
        saveProfile({ ...profile, name: user.name, avatar: user.avatar })
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
    const existingProfile = getStoredProfile()
    const sessionId = existingProfile?.sessionId || generateSessionId()
    saveProfile({ name, avatar, sessionId })

    if (socket) {
      socket.emit(ClientEvents.USER_LOGIN, { name, avatar, sessionId })
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

  makeMove: (move) => {
    const { socket, currentRoom } = get()
    if (socket && currentRoom) {
      socket.emit(ClientEvents.GAME_MAKE_MOVE, { roomId: currentRoom.id, ...move })
    }
  },

  resetGame: () => {
    const { socket } = get()
    if (socket) {
      socket.emit(ClientEvents.GAME_RESET)
    }
  }
}))
