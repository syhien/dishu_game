// 共享类型定义

// 用户
export interface User {
  id: string;
  name: string;
  avatar: string;
  roomId?: string;
  isOnline: boolean;
  joinedAt: number;
}

// 房间
export interface Room {
  id: string;
  name: string;
  gameType: GameType;
  status: RoomStatus;
  hostId: string;
  players: User[];
  maxPlayers: number;
  createdAt: number;
  gameState?: GameState;
}

export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

// 游戏类型
export enum GameType {
  GOMOKU = 'gomoku',  // 五子棋
  CBMFS = 'cbmfs'     // 出包魔法师
}

// 游戏状态基类
export interface GameState {
  type: GameType;
  currentPlayer: string;
  winner?: string;
  isDraw?: boolean;
}

// 五子棋游戏状态
export interface GomokuState extends GameState {
  type: GameType.GOMOKU;
  board: (string | null)[][];  // 15x15 棋盘，存储玩家ID或null
  moves: GomokuMove[];
}

export interface GomokuMove {
  playerId: string;
  x: number;
  y: number;
  timestamp: number;
}

export enum CbmfsSpellType {
  ANCIENT_DRAGON = 'ancient_dragon',
  DARK_GHOST = 'dark_ghost',
  SWEET_DREAM = 'sweet_dream',
  OWL = 'owl',
  THUNDERSTORM = 'thunderstorm',
  BLIZZARD = 'blizzard',
  FIREBALL = 'fireball',
  POTION = 'potion'
}

export interface CbmfsState extends GameState {
  type: GameType.CBMFS;
  players: string[];
  playerNames: Record<string, string>;
  turnOrder: string[];
  round: number;
  health: Record<string, number>;
  scores: Record<string, number>;
  hands: Record<string, CbmfsSpellType[]>;
  drawPile: CbmfsSpellType[];
  discardPile: CbmfsSpellType[];
  secretDeck: CbmfsSpellType[];
  collectedSecrets: Record<string, number>;
  lastCastSpell?: CbmfsSpellType;
  actionLog: string[];
  lastRoundSummary?: string;
}

// WebSocket 事件
export enum ServerEvents {
  // 连接相关
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // 用户相关
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  
  // 房间相关
  ROOM_LIST = 'room:list',
  ROOM_CREATED = 'room:created',
  ROOM_UPDATED = 'room:updated',
  ROOM_DELETED = 'room:deleted',
  
  // 游戏相关
  GAME_STARTED = 'game:started',
  GAME_STATE_UPDATED = 'game:stateUpdated',
  GAME_ENDED = 'game:ended',
  GAME_MOVE = 'game:move',
  GAME_ERROR = 'game:error'
}

export enum ClientEvents {
  // 用户相关
  USER_LOGIN = 'user:login',
  
  // 房间相关
  ROOM_CREATE = 'room:create',
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  ROOM_GET_LIST = 'room:getList',
  
  // 游戏相关
  GAME_START = 'game:start',
  GAME_MAKE_MOVE = 'game:makeMove',
  GAME_RESET = 'game:reset'
}

// 请求/响应类型
export interface CreateRoomRequest {
  name: string;
  gameType: GameType;
}

export interface JoinRoomRequest {
  roomId: string;
}

export interface MakeMoveRequest {
  roomId: string;
  x?: number;
  y?: number;
  action?: 'gomoku_place' | 'cbmfs_cast' | 'cbmfs_end_turn';
  spellType?: CbmfsSpellType;
}

export interface LoginRequest {
  name: string;
  avatar: string;
  sessionId?: string;
}
