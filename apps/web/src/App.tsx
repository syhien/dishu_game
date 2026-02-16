import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import LoginPage from './pages/Login/LoginPage'
import LobbyPage from './pages/Lobby/LobbyPage'
import RoomPage from './pages/Room/RoomPage'
import './App.css'

function App() {
  const { setSocket } = useGameStore()

  useEffect(() => {
    let disposed = false
    let activeSocket: { close: () => void } | null = null

    const connectSocket = async () => {
      if (useGameStore.getState().socket) {
        return
      }

      const { io } = await import('socket.io-client')
      const newSocket = io({
        path: '/socket.io'
      })

      if (disposed) {
        newSocket.close()
        return
      }

      activeSocket = newSocket
      setSocket(newSocket)
    }

    connectSocket()

    return () => {
      disposed = true
      activeSocket?.close()
    }
  }, [setSocket])

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
