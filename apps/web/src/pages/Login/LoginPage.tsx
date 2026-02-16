import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { AVATARS } from '../../types'
import { config } from '../../config'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { currentUser, isConnected, login } = useGameStore()
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])

  // 登录成功后跳转到大厅
  useEffect(() => {
    if (currentUser) {
      navigate('/lobby')
    }
  }, [currentUser, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && isConnected) {
      login(name.trim(), selectedAvatar)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">{config.appLogo} {config.appName}</h1>
        <p className="login-subtitle">{config.appSubtitle}</p>

        {!isConnected ? (
          <div className="connecting">
            <div className="spinner"></div>
            <p>正在连接服务器...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>选择头像</label>
              <div className="avatar-grid">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className={`avatar-btn ${selectedAvatar === avatar ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>你的名字</label>
              <input
                type="text"
                className="input"
                placeholder="请输入昵称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={12}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={!name.trim()}
            >
              进入游戏大厅
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
