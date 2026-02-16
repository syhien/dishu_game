import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { ClientEvents, GomokuState, RoomStatus } from '../../types'
import './RoomPage.css'

const BOARD_SIZE = 15

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
  const gomokuState = gameState as GomokuState | null

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
          <span className="game-type">五子棋</span>
        </div>
      </header>

      <main className="room-main">
        {/* 玩家信息 */}
        <div className="players-panel">
          {currentRoom.players.map((player, index) => (
            <div 
              key={player.id} 
              className={`player-card ${gomokuState?.currentPlayer === player.id ? 'active' : ''} ${gomokuState?.winner === player.id ? 'winner' : ''}`}
            >
              <span className="player-avatar-large">{player.avatar}</span>
              <span className="player-name-large">{player.name}</span>
              {index === 0 && <span className="player-role">黑棋</span>}
              {index === 1 && <span className="player-role white">白棋</span>}
              {gomokuState?.currentPlayer === player.id && (
                <span className="turn-indicator">思考中...</span>
              )}
            </div>
          ))}
          
          {/* 等待玩家 */}
          {currentRoom.players.length < 2 && (
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
                  {currentRoom.players.length < 2 ? '等待更多玩家' : '开始游戏'}
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
                  onMove={makeMove}
                />
              )}
              
              {/* 游戏结果 */}
              {(gomokuState?.winner || gomokuState?.isDraw) && (
                <div className="game-result">
                  {gomokuState.isDraw ? (
                    <h3>🤝 平局！</h3>
                  ) : (
                    <h3>🎉 {currentRoom.players.find(p => p.id === gomokuState.winner)?.name} 获胜！</h3>
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
  players: { id: string; avatar: string }[]
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
