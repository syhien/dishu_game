import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import LoginPage from './pages/Login/LoginPage'
import LobbyPage from './pages/Lobby/LobbyPage'
import RoomPage from './pages/Room/RoomPage'
import './App.css'

function App() {
  const { socket, setSocket } = useGameStore()

  useEffect(() => {
    // 连接 Socket.io 服务器
    const connectSocket = async () => {
      const { io } = await import('socket.io-client')
      // 连接同域，通过 nginx/Caddy 反向代理到后端
      const newSocket = io({
        path: '/socket.io',
      })
      
      newSocket.on('connect', () => {
        console.log('Connected to server')
        setSocket(newSocket)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
      })

      return () => {
        newSocket.close()
      }
    }

    if (!socket) {
      connectSocket()
    }
  }, [socket, setSocket])

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  )
}

export default App
