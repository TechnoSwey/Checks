// Константы игры
const CONSTANTS = {
    EMPTY: 0,
    WHITE: 1,
    BLACK: 2,
    WHITE_KING: 3,
    BLACK_KING: 4
};

const DIRECTIONS = {
    DIAGONAL: [
        [-1, -1], [-1, 1], [1, -1], [1, 1]
    ],
    STRAIGHT: [
        [-1, 0], [1, 0], [0, -1], [0, 1]
    ]
};
