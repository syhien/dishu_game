import { GomokuState, GomokuMove, User, GameType } from '../types';
import { MakeMoveResult } from '../services/GameManager';

const BOARD_SIZE = 15;

export class GomokuGame {
  static createGame(players: User[]): GomokuState {
    if (players.length !== 2) {
      throw new Error('五子棋需要2名玩家');
    }

    const board: (string | null)[][] = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));

    return {
      type: GameType.GOMOKU,
      board,
      currentPlayer: players[0].id, // 黑棋先行
      moves: [],
      players: players.map(p => p.id)  // 存储玩家ID列表
    };
  }

  static makeMove(state: GomokuState, playerId: string, x: number, y: number): MakeMoveResult {
    // 验证坐标
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
      return { success: false, state, error: '坐标超出范围' };
    }

    // 验证位置是否被占用
    if (state.board[y][x] !== null) {
      return { success: false, state, error: '该位置已有棋子' };
    }

    // 验证是否是当前玩家的回合
    if (state.currentPlayer !== playerId) {
      return { success: false, state, error: '不是你的回合' };
    }

    // 游戏已结束
    if (state.winner) {
      return { success: false, state, error: '游戏已结束' };
    }

    // 执行移动
    const newState: GomokuState = {
      ...state,
      board: state.board.map(row => [...row]),
      moves: [...state.moves]
    };

    newState.board[y][x] = playerId;
    newState.moves.push({
      playerId,
      x,
      y,
      timestamp: Date.now()
    });

    // 检查胜负
    if (this.checkWin(newState.board, x, y, playerId)) {
      newState.winner = playerId;
      return { success: true, state: newState };
    }

    // 检查平局
    if (newState.moves.length >= BOARD_SIZE * BOARD_SIZE) {
      newState.isDraw = true;
      return { success: true, state: newState };
    }

    // 切换玩家
    const nextPlayer = newState.players.find(p => p !== playerId);
    newState.currentPlayer = nextPlayer || playerId;

    return { success: true, state: newState };
  }



  private static checkWin(board: (string | null)[][], x: number, y: number, playerId: string): boolean {
    const directions = [
      [1, 0],   // 水平
      [0, 1],   // 垂直
      [1, 1],   // 对角线
      [1, -1]   // 反对角线
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // 正向检查
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === playerId) {
          count++;
        } else {
          break;
        }
      }

      // 反向检查
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === playerId) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 5) {
        return true;
      }
    }

    return false;
  }
}
