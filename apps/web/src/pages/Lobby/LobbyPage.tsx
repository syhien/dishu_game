import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { ClientEvents, GameType, Room } from '../../types'
import { config } from '../../config'
import './LobbyPage.css'

const GAME_OPTIONS: { type: GameType; icon: string; name: string; playerRange: string }[] = [
  { type: GameType.GOMOKU, icon: '⚫⚪', name: '五子棋', playerRange: '2人对战' },
  { type: GameType.CBMFS, icon: '🪄', name: '出包魔法师', playerRange: '2-5人' }
]

export default function LobbyPage() {
  const navigate = useNavigate()
  const { 
    currentUser, 
    rooms, 
    currentRoom, 
    socket, 
    createRoom, 
    joinRoom
  } = useGameStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [selectedGameType, setSelectedGameType] = useState<GameType>(GameType.GOMOKU)

  // 未登录则返回登录页
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  // 获取房间列表
  useEffect(() => {
    if (socket) {
      socket.emit(ClientEvents.ROOM_GET_LIST)
    }
  }, [socket])

  // 如果已经在房间里，跳转到房间页
  useEffect(() => {
    if (currentRoom) {
      navigate(`/room/${currentRoom.id}`)
    }
  }, [currentRoom, navigate])

  useEffect(() => {
    if (!showCreateModal) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCreateModal(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showCreateModal])

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      createRoom(roomName.trim(), selectedGameType)
      setShowCreateModal(false)
      setRoomName('')
      setSelectedGameType(GameType.GOMOKU)
    }
  }

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId)
  }

  if (!currentUser) return null

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <div className="logo">
          <span className="logo-icon">{config.appLogo}</span>
          <span className="logo-text">{config.appName}</span>
        </div>
        <div className="user-info">
          <span className="user-avatar">{currentUser.avatar}</span>
          <span className="user-name">{currentUser.name}</span>
          <button 
            className="btn btn-secondary logout-btn"
            onClick={() => navigate('/')}
          >
            退出
          </button>
        </div>
      </header>

      <main className="lobby-main">
        <div className="lobby-toolbar">
          <h2>{config.appName}</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + 创建房间
          </button>
        </div>

        <div className="room-list">
          {rooms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <p>暂无房间，创建一个吧！</p>
            </div>
          ) : (
            rooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onJoin={() => handleJoinRoom(room.id)}
              />
            ))
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>创建房间</h3>
            <div className="form-group">
              <label>房间名称</label>
              <input
                type="text"
                className="input"
                placeholder="输入房间名称"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && roomName.trim()) {
                    handleCreateRoom()
                  }
                }}
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>游戏类型</label>
              <div className="game-types">
                {GAME_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    className={`game-type-option ${selectedGameType === option.type ? 'selected' : ''}`}
                    onClick={() => setSelectedGameType(option.type)}
                    aria-pressed={selectedGameType === option.type}
                  >
                    <span className="game-icon">{option.icon}</span>
                    <span className="game-option-text">
                      <strong>{option.name}</strong>
                      <small>{option.playerRange}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateRoom}
                disabled={!roomName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RoomCard({ room, onJoin }: { room: Room; onJoin: () => void }) {
  const isFull = room.players.length >= room.maxPlayers
  const isPlaying = room.status === 'playing'
  const gameTypeName = room.gameType === GameType.CBMFS ? '出包魔法师' : '五子棋'
  const gameTypeIcon = room.gameType === GameType.CBMFS ? '🪄' : '⚫⚪'

  return (
    <div className={`room-card ${isPlaying ? 'playing' : ''}`}>
      <div className="room-card-header">
        <div className="room-name-wrapper">
          <div className="room-icon">{gameTypeIcon}</div>
          <div>
            <h4 className="room-name">{room.name}</h4>
            <span className="game-type-badge">{gameTypeName}</span>
          </div>
        </div>
        <span className={`room-status status-${room.status}`}>
          {isPlaying ? '进行中' : '等待中'}
        </span>
      </div>
      
      <div style={{ flex: 1 }}></div>

      <div className="room-card-footer">
        <div className="players-count">
           <span style={{ fontSize: '18px' }}>
             {room.players.map(p => p.avatar).join('')}
           </span>
           <span style={{ marginLeft: '8px', fontSize: '12px' }}>
             {room.players.length}/{room.maxPlayers}
           </span>
        </div>
        <button 
          className="btn btn-primary join-btn"
          onClick={onJoin}
          disabled={isFull || isPlaying}
        >
          {isFull ? '满员' : isPlaying ? '进行中' : '加入'}
        </button>
      </div>
    </div>
  )
}
