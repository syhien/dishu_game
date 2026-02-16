import { v4 as uuidv4 } from 'uuid';
import { Room, User, RoomStatus, GameType } from '../types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(name: string, gameType: GameType, host: User): Room {
    const room: Room = {
      id: uuidv4(),
      name,
      gameType,
      status: RoomStatus.WAITING,
      hostId: host.id,
      players: [host],
      maxPlayers: this.getMaxPlayers(gameType),
      createdAt: Date.now()
    };
    this.rooms.set(room.id, room);
    return room;
  }

  joinRoom(roomId: string, user: User): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length >= room.maxPlayers) return null;
    if (room.players.find(p => p.id === user.id)) return room;

    room.players.push(user);
    return room;
  }

  leaveRoom(roomId: string, userId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter(p => p.id !== userId);

    // 如果房间空了，删除房间
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    // 如果房主离开，转让房主
    if (room.hostId === userId && room.players.length > 0) {
      room.hostId = room.players[0].id;
    }

    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomList(): Room[] {
    return Array.from(this.rooms.values())
      .filter(r => r.status !== RoomStatus.FINISHED)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  private getMaxPlayers(gameType: GameType): number {
    switch (gameType) {
      case GameType.GOMOKU:
        return 2;
      default:
        return 4;
    }
  }
}
