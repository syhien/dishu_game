import { CbmfsState, GameType, GameState, MakeMoveRequest, User, GomokuState } from '../types';
import { GomokuGame } from '../games/GomokuGame';
import { CbmfsGame } from '../games/CbmfsGame';

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
      case GameType.CBMFS:
        return CbmfsGame.createGame(players);
      default:
        throw new Error(`未知游戏类型: ${gameType}`);
    }
  }

  makeMove(gameState: GameState, playerId: string, move: MakeMoveRequest): MakeMoveResult {
    switch (gameState.type) {
      case GameType.GOMOKU:
        if (typeof move.x !== 'number' || typeof move.y !== 'number') {
          return { success: false, state: gameState, error: '五子棋参数错误' };
        }
        return GomokuGame.makeMove(gameState as GomokuState, playerId, move.x, move.y);
      case GameType.CBMFS:
        return CbmfsGame.makeMove(gameState as CbmfsState, playerId, move);
      default:
        return { success: false, state: gameState, error: '未知游戏类型' };
    }
  }
}
