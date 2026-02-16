import { CbmfsSpellType, CbmfsState, GameType, MakeMoveRequest, User } from '../types';
import { MakeMoveResult } from '../services/GameManager';

const MAX_HEALTH = 6;
const HAND_SIZE = 5;
const TARGET_SCORE = 8;
const MAX_LOG_SIZE = 18;

const SPELL_COUNTS: Record<CbmfsSpellType, number> = {
  [CbmfsSpellType.ANCIENT_DRAGON]: 1,
  [CbmfsSpellType.DARK_GHOST]: 2,
  [CbmfsSpellType.SWEET_DREAM]: 3,
  [CbmfsSpellType.OWL]: 4,
  [CbmfsSpellType.THUNDERSTORM]: 5,
  [CbmfsSpellType.BLIZZARD]: 6,
  [CbmfsSpellType.FIREBALL]: 7,
  [CbmfsSpellType.POTION]: 8
};

const SECRET_CARD_COUNT: Record<number, number> = {
  2: 12,
  3: 6,
  4: 4,
  5: 4
};

type RoundEndReason = 'all_spells_used' | 'defeated_other' | 'self_defeated';

export class CbmfsGame {
  static createGame(players: User[]): CbmfsState {
    if (players.length < 2 || players.length > 5) {
      throw new Error('出包魔法师需要2-5名玩家');
    }

    const playerIds = players.map(player => player.id);
    const playerNames: Record<string, string> = {};
    players.forEach(player => {
      playerNames[player.id] = player.name;
    });
    const scores: Record<string, number> = {};
    playerIds.forEach(playerId => {
      scores[playerId] = 0;
    });

    return this.createRoundState(playerIds, playerNames, scores, 1, playerIds[0]);
  }

  static makeMove(state: CbmfsState, playerId: string, move: MakeMoveRequest): MakeMoveResult {
    if (state.winner) {
      return { success: false, state, error: '游戏已结束' };
    }

    if (!state.players.includes(playerId)) {
      return { success: false, state, error: '你不在本局游戏中' };
    }

    if (state.currentPlayer !== playerId) {
      return { success: false, state, error: '不是你的回合' };
    }

    if (move.action === 'cbmfs_end_turn') {
      return { success: true, state: this.endTurn(state) };
    }

    if (move.action !== 'cbmfs_cast' || !move.spellType || !this.isSpellType(move.spellType)) {
      return { success: false, state, error: '无效操作' };
    }

    return this.castSpell(state, playerId, move.spellType);
  }

  private static castSpell(state: CbmfsState, playerId: string, spellType: CbmfsSpellType): MakeMoveResult {
    if (state.lastCastSpell && SPELL_COUNTS[spellType] < SPELL_COUNTS[state.lastCastSpell]) {
      return { success: false, state, error: '不能施放比上种魔法更稀有的魔法' };
    }

    const newState = this.cloneState(state);
    const hand = newState.hands[playerId] || [];
    const cardIndex = hand.indexOf(spellType);

    if (cardIndex < 0) {
      const damage = spellType === CbmfsSpellType.ANCIENT_DRAGON ? this.rollD3() : 1;
      this.applyDamage(newState, playerId, damage);
      this.appendLog(newState, `❌ ${this.getPlayerLabel(newState, playerId)}施法失败（${this.getSpellName(spellType)}），扣除${damage}❤️`);
      newState.lastCastSpell = undefined;

      if (newState.health[playerId] <= 0) {
        return { success: true, state: this.resolveRound(newState, playerId, 'self_defeated') };
      }

      return { success: true, state: this.endTurn(newState) };
    }

    hand.splice(cardIndex, 1);
    newState.discardPile.push(spellType);
    this.applySpellEffect(newState, playerId, spellType);
    this.appendLog(newState, `✨ ${this.getPlayerLabel(newState, playerId)}施放了${this.getSpellName(spellType)}`);
    newState.lastCastSpell = spellType;

    if (newState.hands[playerId].length === 0) {
      return { success: true, state: this.resolveRound(newState, playerId, 'all_spells_used') };
    }

    const defeatedOther = newState.players.some(id => id !== playerId && newState.health[id] <= 0);
    if (defeatedOther) {
      return { success: true, state: this.resolveRound(newState, playerId, 'defeated_other') };
    }

    return { success: true, state: newState };
  }

  private static endTurn(state: CbmfsState): CbmfsState {
    const newState = this.cloneState(state);
    this.drawToHand(newState, newState.currentPlayer);

    const nextPlayer = this.getNextPlayerId(newState.turnOrder, newState.currentPlayer);
    newState.currentPlayer = nextPlayer;
    newState.lastCastSpell = undefined;

    this.appendLog(newState, `➡️ 轮到${this.getPlayerLabel(newState, nextPlayer)}行动`);
    return newState;
  }

  private static resolveRound(state: CbmfsState, actorId: string, reason: RoundEndReason): CbmfsState {
    const nextState = this.cloneState(state);
    let summary = '';

    if (reason === 'all_spells_used') {
      nextState.scores[actorId] += 3;
      nextState.players.forEach(playerId => {
        if (playerId !== actorId) {
          nextState.health[playerId] = 0;
        }
      });
      summary = `${this.getPlayerLabel(nextState, actorId)}打空手牌，本轮+3分。`;
    }

    if (reason === 'defeated_other') {
      nextState.scores[actorId] += 3;
      nextState.players.forEach(playerId => {
        if (playerId !== actorId && nextState.health[playerId] > 0) {
          nextState.scores[playerId] += 1;
        }
      });
      summary = `${this.getPlayerLabel(nextState, actorId)}击败其他玩家，本轮+3分，其他存活玩家+1分。`;
    }

    if (reason === 'self_defeated') {
      nextState.players.forEach(playerId => {
        if (playerId !== actorId) {
          nextState.scores[playerId] += 1;
        }
      });
      summary = `${this.getPlayerLabel(nextState, actorId)}施法失败阵亡，其他玩家+1分。`;
    }

    nextState.players.forEach(playerId => {
      const secretScore = nextState.collectedSecrets[playerId] || 0;
      if (nextState.health[playerId] > 0 && secretScore > 0) {
        nextState.scores[playerId] += secretScore;
      }
    });

    const winner = this.getWinner(nextState.scores, nextState.turnOrder);
    if (winner) {
      nextState.winner = winner;
      nextState.lastRoundSummary = summary;
      this.appendLog(nextState, `🏆 ${this.getPlayerLabel(nextState, winner)}率先达到${TARGET_SCORE}分，获得胜利！`);
      return nextState;
    }

    const nextStarter = this.getNextPlayerId(nextState.turnOrder, actorId);
    return this.createRoundState(nextState.players, nextState.playerNames, nextState.scores, nextState.round + 1, nextStarter, summary);
  }

  private static createRoundState(
    players: string[],
    playerNames: Record<string, string>,
    scores: Record<string, number>,
    round: number,
    startPlayerId: string,
    lastRoundSummary?: string
  ): CbmfsState {
    const deck = this.shuffle(this.buildDeck());
    const secretCount = SECRET_CARD_COUNT[players.length] || 4;
    const secretDeck = deck.splice(0, Math.min(secretCount, deck.length));

    const hands: Record<string, CbmfsSpellType[]> = {};
    const health: Record<string, number> = {};
    const collectedSecrets: Record<string, number> = {};

    players.forEach(playerId => {
      hands[playerId] = [];
      health[playerId] = MAX_HEALTH;
      collectedSecrets[playerId] = 0;
    });

    for (let i = 0; i < HAND_SIZE; i++) {
      players.forEach(playerId => {
        const card = deck.shift();
        if (card) {
          hands[playerId].push(card);
        }
      });
    }

    players.forEach(playerId => {
      hands[playerId] = this.sortHand(hands[playerId]);
    });

    return {
      type: GameType.CBMFS,
      currentPlayer: startPlayerId,
      players: [...players],
      playerNames: { ...playerNames },
      turnOrder: [...players],
      round,
      health,
      scores: { ...scores },
      hands,
      drawPile: deck,
      discardPile: [],
      secretDeck,
      collectedSecrets,
      lastCastSpell: undefined,
      actionLog: lastRoundSummary ? [`📣 上轮结算：${lastRoundSummary}`] : []
    };
  }

  private static applySpellEffect(state: CbmfsState, playerId: string, spellType: CbmfsSpellType): void {
    if (spellType === CbmfsSpellType.ANCIENT_DRAGON) {
      state.players.forEach(id => {
        if (id !== playerId) {
          this.applyDamage(state, id, this.rollD3());
        }
      });
      return;
    }

    if (spellType === CbmfsSpellType.DARK_GHOST) {
      state.players.forEach(id => {
        if (id !== playerId) {
          this.applyDamage(state, id, 1);
        }
      });
      this.heal(state, playerId, 1);
      return;
    }

    if (spellType === CbmfsSpellType.SWEET_DREAM) {
      this.heal(state, playerId, this.rollD3());
      return;
    }

    if (spellType === CbmfsSpellType.OWL) {
      const secret = state.secretDeck.shift();
      if (secret) {
        state.collectedSecrets[playerId] += 1;
      }
      return;
    }

    const { prev, next } = this.getNeighbors(state.turnOrder, playerId);

    if (spellType === CbmfsSpellType.THUNDERSTORM) {
      const targets = new Set<string>([prev, next]);
      targets.forEach(id => {
        if (id !== playerId) {
          this.applyDamage(state, id, 1);
        }
      });
      return;
    }

    if (spellType === CbmfsSpellType.BLIZZARD) {
      if (prev !== playerId) {
        this.applyDamage(state, prev, 1);
      }
      return;
    }

    if (spellType === CbmfsSpellType.FIREBALL) {
      if (next !== playerId) {
        this.applyDamage(state, next, 1);
      }
      return;
    }

    this.heal(state, playerId, 1);
  }

  private static drawToHand(state: CbmfsState, playerId: string): void {
    let drewCard = false;
    while (state.hands[playerId].length < HAND_SIZE && state.drawPile.length > 0) {
      const card = state.drawPile.shift();
      if (!card) {
        break;
      }
      state.hands[playerId].push(card);
      drewCard = true;
    }

    if (drewCard) {
      state.hands[playerId] = this.sortHand(state.hands[playerId]);
    }
  }

  private static applyDamage(state: CbmfsState, playerId: string, amount: number): void {
    state.health[playerId] = Math.max(0, state.health[playerId] - amount);
  }

  private static heal(state: CbmfsState, playerId: string, amount: number): void {
    state.health[playerId] = Math.min(MAX_HEALTH, state.health[playerId] + amount);
  }

  private static getWinner(scores: Record<string, number>, turnOrder: string[]): string | undefined {
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore < TARGET_SCORE) {
      return undefined;
    }

    return turnOrder.find(playerId => scores[playerId] === maxScore);
  }

  private static getNeighbors(turnOrder: string[], playerId: string): { prev: string; next: string } {
    const index = turnOrder.indexOf(playerId);
    const prev = turnOrder[(index - 1 + turnOrder.length) % turnOrder.length];
    const next = turnOrder[(index + 1) % turnOrder.length];
    return { prev, next };
  }

  private static getNextPlayerId(turnOrder: string[], currentPlayerId: string): string {
    const index = turnOrder.indexOf(currentPlayerId);
    return turnOrder[(index + 1) % turnOrder.length];
  }

  private static buildDeck(): CbmfsSpellType[] {
    const deck: CbmfsSpellType[] = [];
    Object.entries(SPELL_COUNTS).forEach(([spellType, count]) => {
      for (let i = 0; i < count; i++) {
        deck.push(spellType as CbmfsSpellType);
      }
    });
    return deck;
  }

  private static rollD3(): number {
    return Math.floor(Math.random() * 3) + 1;
  }

  private static shuffle(cards: CbmfsSpellType[]): CbmfsSpellType[] {
    const result = [...cards];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private static sortHand(cards: CbmfsSpellType[]): CbmfsSpellType[] {
    return [...cards].sort((left, right) => {
      const rarityCompare = SPELL_COUNTS[left] - SPELL_COUNTS[right];
      if (rarityCompare !== 0) {
        return rarityCompare;
      }
      return left.localeCompare(right);
    });
  }

  private static appendLog(state: CbmfsState, message: string): void {
    state.actionLog = [message, ...state.actionLog].slice(0, MAX_LOG_SIZE);
  }

  private static cloneState(state: CbmfsState): CbmfsState {
    const hands: Record<string, CbmfsSpellType[]> = {};
    const health: Record<string, number> = {};
    const scores: Record<string, number> = {};
    const collectedSecrets: Record<string, number> = {};

    state.players.forEach(playerId => {
      hands[playerId] = [...(state.hands[playerId] || [])];
      health[playerId] = state.health[playerId] || 0;
      scores[playerId] = state.scores[playerId] || 0;
      collectedSecrets[playerId] = state.collectedSecrets[playerId] || 0;
    });

    return {
      ...state,
      players: [...state.players],
      playerNames: { ...state.playerNames },
      turnOrder: [...state.turnOrder],
      hands,
      health,
      scores,
      collectedSecrets,
      drawPile: [...state.drawPile],
      discardPile: [...state.discardPile],
      secretDeck: [...state.secretDeck],
      actionLog: [...state.actionLog]
    };
  }

  private static isSpellType(value: string): value is CbmfsSpellType {
    return Object.values(CbmfsSpellType).includes(value as CbmfsSpellType);
  }

  private static getSpellName(spellType: CbmfsSpellType): string {
    const nameMap: Record<CbmfsSpellType, string> = {
      [CbmfsSpellType.ANCIENT_DRAGON]: '🐉古代巨龙',
      [CbmfsSpellType.DARK_GHOST]: '👻黑暗幽灵',
      [CbmfsSpellType.SWEET_DREAM]: '💕甜蜜的梦',
      [CbmfsSpellType.OWL]: '🦉猫头鹰',
      [CbmfsSpellType.THUNDERSTORM]: '⛈️闪电暴风雨',
      [CbmfsSpellType.BLIZZARD]: '🌨️暴风雪',
      [CbmfsSpellType.FIREBALL]: '🔥火球',
      [CbmfsSpellType.POTION]: '🧪魔法药水'
    };

    return nameMap[spellType];
  }

  private static shortPlayer(playerId: string): string {
    return `玩家${playerId.slice(0, 4)}`;
  }

  private static getPlayerLabel(state: CbmfsState, playerId: string): string {
    return state.playerNames[playerId] || this.shortPlayer(playerId);
  }
}
