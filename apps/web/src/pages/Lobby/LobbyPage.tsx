import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { ClientEvents, Room } from '../../types'
import { config } from '../../config'
import './LobbyPage.css'

export default function LobbyPage() {
  const navigate = useNavigate()
  const { 
    currentUser, 
    rooms, 
    currentRoom, 
    socket, 
    createRoom, 
    joinRoom, 
    setCurrentRoom 
  } = useGameStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomName, setRoomName] = useState('')

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

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      createRoom(roomName.trim(), 'gomoku')
      setShowCreateModal(false)
      setRoomName('')
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
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>游戏类型</label>
              <div className="game-type selected">
                <span className="game-icon">⚫⚪</span>
                <span>五子棋</span>
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

  return (
    <div className={`room-card ${isPlaying ? 'playing' : ''}`}>
      <div className="room-info">
        <h4 className="room-name">{room.name}</h4>
        <div className="room-meta">
          <span className="game-type-badge">五子棋</span>
          <span className="player-count">
            {room.players.length}/{room.maxPlayers} 人
          </span>
          <span className={`room-status ${room.status}`}>
            {isPlaying ? '游戏中' : '等待中'}
          </span>
        </div>
        <div className="room-players">
          {room.players.map((player) => (
            <span key={player.id} className="player-avatar" title={player.name}>
              {player.avatar}
            </span>
          ))}
        </div>
      </div>
      <button 
        className="btn btn-primary join-btn"
        onClick={onJoin}
        disabled={isFull || isPlaying}
      >
        {isFull ? '已满' : isPlaying ? '游戏中' : '加入'}
      </button>
    </div>
  )
}
