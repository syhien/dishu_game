// 从 shared 包复制类型（简化版本，避免 monorepo 配置复杂性）

export interface User {
  id: string;
  name: string;
  avatar: string;
  roomId?: string;
  isOnline: boolean;
  joinedAt: number;
}

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

export enum GameType {
  GOMOKU = 'gomoku',
  CBMFS = 'cbmfs'
}

export interface GameState {
  type: GameType;
  currentPlayer: string;
  winner?: string;
  isDraw?: boolean;
}

export interface GomokuState extends GameState {
  type: GameType.GOMOKU;
  board: (string | null)[][];
  moves: GomokuMove[];
  players: string[];  // 存储玩家ID列表，用于回合切换
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

export enum ServerEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  ROOM_LIST = 'room:list',
  ROOM_CREATED = 'room:created',
  ROOM_UPDATED = 'room:updated',
  ROOM_DELETED = 'room:deleted',
  GAME_STARTED = 'game:started',
  GAME_STATE_UPDATED = 'game:stateUpdated',
  GAME_ENDED = 'game:ended',
  GAME_MOVE = 'game:move',
  GAME_ERROR = 'game:error'
}

export enum ClientEvents {
  USER_LOGIN = 'user:login',
  ROOM_CREATE = 'room:create',
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  ROOM_GET_LIST = 'room:getList',
  GAME_START = 'game:start',
  GAME_MAKE_MOVE = 'game:makeMove',
  GAME_RESET = 'game:reset'
}

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
}
