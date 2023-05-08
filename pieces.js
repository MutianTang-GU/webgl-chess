export const Piece = {
  KingW: 1,
  QueenW: 2,
  RookW: 3,
  BishopW: 4,
  KnightW: 5,
  PawnW: 6,
  KingB: 7,
  QueenB: 8,
  RookB: 9,
  BishopB: 10,
  KnightB: 11,
  PawnB: 12,
  Empty: 0,
};

export class Checkerboard {
  constructor() {
    /** @type {[[number, number, boolean, boolean]]} */
    this.positions = [
      // White
      [4, 1, 1, true],
      [1, 2, 1, true],
      [2, 2, 1, true],
      [3, 2, 1, true],
      [4, 2, 1, true],
      [5, 2, 1, true],
      [6, 2, 1, true],
      [2, 1, 1, true],
      [1, 1, 1, true],
      [7, 2, 1, true],
      [3, 1, 1, true],
      [5, 1, 1, true],
      [8, 1, 1, true],
      [7, 1, 1, true],
      [6, 1, 1, true],
      [8, 2, 1, true],
      // Black
      [4, 8, 1, false],
      [1, 7, 1, false],
      [2, 7, 1, false],
      [3, 7, 1, false],
      [4, 7, 1, false],
      [5, 7, 1, false],
      [6, 7, 1, false],
      [2, 8, 1, false],
      [1, 8, 1, false],
      [7, 7, 1, false],
      [3, 8, 1, false],
      [5, 8, 1, false],
      [8, 8, 1, false],
      [7, 8, 1, false],
      [6, 8, 1, false],
      [8, 7, 1, false],
    ];
    this.animateInProgress = false;
  }

  getPieceIndex(x, y) {
    return this.positions.findIndex(
      p => p[0] === x && p[1] === y && p[2] === 1
    );
  }

  movePieceAnimate(x, y, newX, newY) {
    if (this.animateInProgress) {
      return;
    }
    const piece = this.positions[this.getPieceIndex(x, y)];
    const target = this.positions[this.getPieceIndex(newX, newY)];
    this.animateInProgress = true;

    return percentage => {
      piece[0] = x + (newX - x) * percentage;
      piece[1] = y + (newY - y) * percentage;
      if (target) {
        target[2] = 1 - percentage;
      }
      if (percentage === 1) {
        this.animateInProgress = false;
      }
    };
  }
}
