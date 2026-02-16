import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import {
  CbmfsSpellType,
  CbmfsState,
  ClientEvents,
  GameType,
  GomokuState,
  RoomStatus,
  User
} from '../../types'
import './RoomPage.css'

const BOARD_SIZE = 15

const SPELL_OPTIONS: { type: CbmfsSpellType; icon: string; name: string; count: number }[] = [
  { type: CbmfsSpellType.ANCIENT_DRAGON, icon: '🐉', name: '古代巨龙', count: 1 },
  { type: CbmfsSpellType.DARK_GHOST, icon: '👻', name: '黑暗幽灵', count: 2 },
  { type: CbmfsSpellType.SWEET_DREAM, icon: '💕', name: '甜蜜的梦', count: 3 },
  { type: CbmfsSpellType.OWL, icon: '🦉', name: '猫头鹰', count: 4 },
  { type: CbmfsSpellType.THUNDERSTORM, icon: '⛈️', name: '闪电暴风雨', count: 5 },
  { type: CbmfsSpellType.BLIZZARD, icon: '🌨️', name: '暴风雪', count: 6 },
  { type: CbmfsSpellType.FIREBALL, icon: '🔥', name: '火球', count: 7 },
  { type: CbmfsSpellType.POTION, icon: '🧪', name: '魔法药水', count: 8 }
]

const SPELL_COUNT_MAP: Record<CbmfsSpellType, number> = SPELL_OPTIONS.reduce((acc, item) => {
  acc[item.type] = item.count
  return acc
}, {} as Record<CbmfsSpellType, number>)

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { 
    currentUser, 
    currentRoom, 
    gameState, 
    socket, 
    leaveRoom, 
    startGame, 
    makeMove,
    resetGame,
    error 
  } = useGameStore()

  // 未登录则返回登录页
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  // 如果不在房间里，返回大厅
  useEffect(() => {
    if (currentRoom && currentRoom.id !== roomId) {
      navigate(`/room/${currentRoom.id}`)
    } else if (!currentRoom && socket) {
      // 尝试加入房间
      socket.emit(ClientEvents.ROOM_JOIN, { roomId })
    }
  }, [currentRoom, roomId, socket, navigate])

  if (!currentUser || !currentRoom) {
    return (
      <div className="loading-room">
        <div className="spinner"></div>
        <p>正在进入房间...</p>
      </div>
    )
  }

  const isHost = currentRoom.hostId === currentUser.id
  const gameTypeName = currentRoom.gameType === GameType.CBMFS ? '出包魔法师' : '五子棋'
  const gomokuState = currentRoom.gameType === GameType.GOMOKU ? gameState as GomokuState | null : null
  const cbmfsState = currentRoom.gameType === GameType.CBMFS ? gameState as CbmfsState | null : null
  const isFinished = currentRoom.gameType === GameType.CBMFS
    ? !!cbmfsState?.winner
    : !!(gomokuState?.winner || gomokuState?.isDraw)

  return (
    <div className="room-page">
      <header className="room-header">
        <button className="btn btn-secondary back-btn" onClick={() => {
          leaveRoom()
          navigate('/lobby')
        }}>
          ← 返回大厅
        </button>
        <h2 className="room-title">{currentRoom.name}</h2>
        <div className="room-info">
          <span className="game-type">{gameTypeName}</span>
        </div>
      </header>

      <main className="room-main">
        {/* 玩家信息 */}
        <div className="players-panel">
          {currentRoom.players.map((player, index) => (
            <div 
              key={player.id} 
              className={`player-card ${(gameState?.currentPlayer === player.id) ? 'active' : ''} ${(gameState?.winner === player.id) ? 'winner' : ''}`}
            >
              <span className="player-avatar-large">{player.avatar}</span>
              <span className="player-name-large">{player.name}</span>
              {currentRoom.gameType === GameType.GOMOKU && index === 0 && <span className="player-role">黑棋</span>}
              {currentRoom.gameType === GameType.GOMOKU && index === 1 && <span className="player-role white">白棋</span>}
              {currentRoom.gameType === GameType.CBMFS && cbmfsState && (
                <div className="cbmfs-player-meta">
                  <span>❤️ {cbmfsState.health[player.id] ?? 0}</span>
                  <span>🏅 {cbmfsState.scores[player.id] ?? 0}</span>
                  <span>🦉 {cbmfsState.collectedSecrets[player.id] ?? 0}</span>
                </div>
              )}
              {gameState?.currentPlayer === player.id && (
                <span className="turn-indicator">思考中...</span>
              )}
            </div>
          ))}
          
          {/* 等待玩家 */}
          {currentRoom.players.length < currentRoom.maxPlayers && currentRoom.status === RoomStatus.WAITING && (
            <div className="player-card waiting">
              <span className="player-avatar-large">⏳</span>
              <span className="player-name-large">等待玩家...</span>
            </div>
          )}
        </div>

        {/* 游戏区域 */}
        <div className="game-area">
          {currentRoom.status === RoomStatus.WAITING ? (
            <div className="waiting-area">
              <p>等待游戏开始...</p>
              <p className="room-code">房间号: {currentRoom.id}</p>
              {isHost ? (
                <button 
                  className="btn btn-primary start-btn"
                  onClick={startGame}
                  disabled={currentRoom.players.length < 2}
                >
                  {currentRoom.players.length < 2 ? '至少需要2名玩家' : '开始游戏'}
                </button>
              ) : (
                <p className="hint">等待房主开始游戏</p>
              )}
            </div>
          ) : (
            <>
              {gomokuState && (
                <GomokuBoard 
                  state={gomokuState} 
                  currentUserId={currentUser.id}
                  players={currentRoom.players}
                  onMove={(x, y) => makeMove({ action: 'gomoku_place', x, y })}
                />
              )}

              {cbmfsState && (
                <CbmfsBoard
                  state={cbmfsState}
                  currentUserId={currentUser.id}
                  players={currentRoom.players}
                  onCast={(spellType) => makeMove({ action: 'cbmfs_cast', spellType })}
                  onEndTurn={() => makeMove({ action: 'cbmfs_end_turn' })}
                />
              )}
              
              {/* 游戏结果 */}
              {isFinished && (
                <div className="game-result">
                  {gomokuState?.isDraw ? (
                    <h3>🤝 平局！</h3>
                  ) : (
                    <h3>🎉 {currentRoom.players.find(p => p.id === gameState?.winner)?.name} 获胜！</h3>
                  )}
                  {isHost && (
                    <button className="btn btn-primary" onClick={resetGame}>
                      再来一局
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 错误提示 */}
      {error && (
        <div className="error-toast">
          {error}
        </div>
      )}
    </div>
  )
}

function GomokuBoard({ 
  state, 
  currentUserId, 
  players,
  onMove 
}: { 
  state: GomokuState
  currentUserId: string
  players: User[]
  onMove: (x: number, y: number) => void
}) {
  const isMyTurn = state.currentPlayer === currentUserId
  const isGameOver = !!state.winner || state.isDraw

  return (
    <div className="gomoku-container">
      <div className="gomoku-scroll-wrapper">
        <div 
          className={`gomoku-board ${!isMyTurn || isGameOver ? 'disabled' : ''}`}
          style={{ 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`
          }}
        >
          {state.board.map((row, y) => 
            row.map((cell, x) => (
              <button
                key={`${x}-${y}`}
                className={`cell ${cell ? 'occupied' : ''}`}
                onClick={() => onMove(x, y)}
                disabled={!isMyTurn || isGameOver || !!cell}
              >
                {cell && (
                  <span className={`piece ${getPieceColor(cell, players)}`} />
                )}
              </button>
            ))
          )}
        </div>
      </div>
      
      <div className="game-status">
        {isGameOver ? (
          <span>游戏结束</span>
        ) : isMyTurn ? (
          <span className="my-turn">轮到你了！</span>
        ) : (
          <span>对手思考中...</span>
        )}
      </div>
    </div>
  )
}

function getPieceColor(playerId: string, players: { id: string }[]): string {
  const index = players.findIndex(p => p.id === playerId)
  return index === 0 ? 'black' : 'white'
}

function CbmfsBoard({
  state,
  currentUserId,
  players,
  onCast,
  onEndTurn
}: {
  state: CbmfsState
  currentUserId: string
  players: User[]
  onCast: (spellType: CbmfsSpellType) => void
  onEndTurn: () => void
}) {
  const isMyTurn = state.currentPlayer === currentUserId
  const isGameOver = !!state.winner
  const lastSpellCount = state.lastCastSpell ? SPELL_COUNT_MAP[state.lastCastSpell] : 0

  return (
    <div className="cbmfs-container">
      <div className="cbmfs-status-row">
        <span>第 {state.round} 轮</span>
        <span>目标分：8</span>
        <span>秘密牌剩余：{state.secretDeck.length}</span>
      </div>

      <div className="cbmfs-action-panel">
        <h4>声明你要施放的魔法</h4>
        <div className="spell-grid">
          {SPELL_OPTIONS.map((spell) => {
            const isRarerThanLast = !!state.lastCastSpell && spell.count < lastSpellCount
            return (
              <button
                key={spell.type}
                className="spell-btn"
                onClick={() => onCast(spell.type)}
                disabled={!isMyTurn || isGameOver || isRarerThanLast}
                title={isRarerThanLast ? '不能比上一个魔法更稀有' : spell.name}
              >
                <span>{spell.icon} {spell.name}</span>
                <small>卡池数量 {spell.count}</small>
              </button>
            )
          })}
        </div>

        <button
          className="btn btn-secondary cbmfs-end-btn"
          onClick={onEndTurn}
          disabled={!isMyTurn || isGameOver}
        >
          结束回合
        </button>
      </div>

      <div className="cbmfs-hands-panel">
        {players.map((player) => {
          const hand = state.hands[player.id] || []
          const isSelf = player.id === currentUserId
          return (
            <div key={player.id} className="cbmfs-hand-card">
              <div className="cbmfs-hand-title">
                <span>{player.avatar} {player.name}</span>
                <span>手牌 {hand.length} 张</span>
              </div>
              {isSelf ? (
                <div className="cbmfs-self-hidden">你的手牌对你是未知的（共 {hand.length} 张）</div>
              ) : (
                <div className="cbmfs-hand-list">
                  {hand.map((spell, index) => {
                    const info = SPELL_OPTIONS.find(item => item.type === spell)
                    return (
                      <span key={`${player.id}-${index}`} className="spell-tag">
                        {info?.icon} {info?.name}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="cbmfs-log-panel">
        <h4>行动记录</h4>
        {state.actionLog.length === 0 ? (
          <p className="cbmfs-log-empty">暂无记录</p>
        ) : (
          <ul>
            {state.actionLog.map((log, index) => (
              <li key={`${log}-${index}`}>{log}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
