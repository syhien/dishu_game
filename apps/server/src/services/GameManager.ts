import { GameType, GameState, User, GomokuState, GomokuMove } from '../types';
import { GomokuGame } from '../games/GomokuGame';

export interface MakeMoveResult {
  success: boolean;
  state: GameState;
  error?: string;
}

export class GameManager {
  createGame(gameType: GameType, players: User[]): GameState {
    switch (gameType) {
      case GameType.GOMOKU:
        return GomokuGame.createGame(players);
      default:
        throw new Error(`未知游戏类型: ${gameType}`);
    }
  }

  makeMove(gameState: GameState, playerId: string, x: number, y: number): MakeMoveResult {
    switch (gameState.type) {
      case GameType.GOMOKU:
        return GomokuGame.makeMove(gameState as GomokuState, playerId, x, y);
      default:
        return { success: false, state: gameState, error: '未知游戏类型' };
    }
  }
}
