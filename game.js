// Класс игры
class CheckersGame {
    constructor() {
        this.board = [];
        this.currentTurn = CONSTANTS.WHITE;
        this.selectedPiece = null;
        this.validMoves = [];
        this.isProcessing = false;
        this.gameMode = 'russian';
        this.gameType = 'bot';
        this.whiteCount = 12;
        this.blackCount = 12;
        this.isGameOver = false;
        this.onGameStateChange = null;
        this.onTurnChange = null;
        this.onGameEnd = null;
    }
    
    init(mode = 'russian') {
        this.gameMode = mode;
        this.currentTurn = CONSTANTS.WHITE;
        this.selectedPiece = null;
        this.validMoves = [];
        this.isProcessing = false;
        this.isGameOver = false;
        this.createBoard();
        this.updateCounts();
        return this.getBoardState();
    }
    
    createBoard() {
        this.board = Array(8).fill().map(() => Array(8).fill(CONSTANTS.EMPTY));
        
        if (this.gameMode === 'russian') {
            // Русские шашки
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if ((row + col) % 2 === 1) {
                        if (row < 3) this.board[row][col] = CONSTANTS.BLACK;
                        if (row > 4) this.board[row][col] = CONSTANTS.WHITE;
                    }
                }
            }
            this.whiteCount = 12;
            this.blackCount = 12;
        } else {
            // Турецкие шашки
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (row === 1 || row === 2) this.board[row][col] = CONSTANTS.BLACK;
                    if (row === 5 || row === 6) this.board[row][col] = CONSTANTS.WHITE;
                }
            }
            this.whiteCount = 16;
            this.blackCount = 16;
        }
    }
    
    getPieceColor(piece) {
        if (piece === CONSTANTS.WHITE || piece === CONSTANTS.WHITE_KING) return CONSTANTS.WHITE;
        if (piece === CONSTANTS.BLACK || piece === CONSTANTS.BLACK_KING) return CONSTANTS.BLACK;
        return null;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    getAllMoves(player) {
        let moves = [];
        let hasCapture = false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece !== CONSTANTS.EMPTY && this.getPieceColor(piece) === player) {
                    const pieceMoves = this.getPieceMoves(row, col, piece);
                    pieceMoves.forEach(move => {
                        if (move.isCapture) hasCapture = true;
                        moves.push(move);
                    });
                }
            }
        }
        
        return hasCapture ? moves.filter(m => m.isCapture) : moves;
    }
    
    getPieceMoves(row, col, piece) {
        const moves = [];
        const isKing = (piece === CONSTANTS.WHITE_KING || piece === CONSTANTS.BLACK_KING);
        const color = this.getPieceColor(piece);
        const directions = this.gameMode === 'russian' ? DIRECTIONS.DIAGONAL : DIRECTIONS.STRAIGHT;
        
        directions.forEach(([dr, dc]) => {
            if (this.gameMode === 'russian') {
                this.getRussianMoves(row, col, piece, color, isKing, dr, dc, moves);
            } else {
                this.getTurkishMoves(row, col, piece, color, isKing, dr, dc, moves);
            }
        });
        
        return moves;
    }
    
    getRussianMoves(row, col, piece, color, isKing, dr, dc, moves) {
        if (isKing) {
            let distance = 1;
            let foundEnemy = false;
            let enemyPos = null;
            
            while (true) {
                const newRow = row + dr * distance;
                const newCol = col + dc * distance;
                if (!this.isValidPosition(newRow, newCol)) break;
                
                const target = this.board[newRow][newCol];
                if (target === CONSTANTS.EMPTY) {
                    if (!foundEnemy) {
                        moves.push({
                            from: { row, col },
                            to: { row: newRow, col: newCol },
                            isCapture: false
                        });
                    } else {
                        moves.push({
                            from: { row, col },
                            to: { row: newRow, col: newCol },
                            isCapture: true,
                            captured: enemyPos
                        });
                    }
                } else {
                    if (this.getPieceColor(target) !== color && !foundEnemy) {
                        foundEnemy = true;
                        enemyPos = { row: newRow, col: newCol };
                    } else {
                        break;
                    }
                }
                distance++;
            }
        } else {
            const isForward = (color === CONSTANTS.WHITE && dr === -1) || (color === CONSTANTS.BLACK && dr === 1);
            
            if (isForward) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === CONSTANTS.EMPTY) {
                    moves.push({
                        from: { row, col },
                        to: { row: newRow, col: newCol },
                        isCapture: false
                    });
                }
            }
            
            const jumpRow = row + dr * 2;
            const jumpCol = col + dc * 2;
            const midRow = row + dr;
            const midCol = col + dc;
            
            if (this.isValidPosition(jumpRow, jumpCol)) {
                const midPiece = this.board[midRow][midCol];
                const targetPiece = this.board[jumpRow][jumpCol];
                
                if (midPiece !== CONSTANTS.EMPTY && 
                    this.getPieceColor(midPiece) !== color && 
                    targetPiece === CONSTANTS.EMPTY) {
                    moves.push({
                        from: { row, col },
                        to: { row: jumpRow, col: jumpCol },
                        isCapture: true,
                        captured: { row: midRow, col: midCol }
                    });
                }
            }
        }
    }
    
    getTurkishMoves(row, col, piece, color, isKing, dr, dc, moves) {
        if (isKing) {
            let distance = 1;
            let foundEnemy = false;
            let enemyPos = null;
            
            while (true) {
                const newRow = row + dr * distance;
                const newCol = col + dc * distance;
                if (!this.isValidPosition(newRow, newCol)) break;
                
                const target = this.board[newRow][newCol];
                if (target === CONSTANTS.EMPTY) {
                    if (!foundEnemy) {
                        moves.push({
                            from: { row, col },
                            to: { row: newRow, col: newCol },
                            isCapture: false
                        });
                    } else {
                        moves.push({
                            from: { row, col },
                            to: { row: newRow, col: newCol },
                            isCapture: true,
                            captured: enemyPos
                        });
                    }
                } else {
                    if (this.getPieceColor(target) !== color && !foundEnemy) {
                        foundEnemy = true;
                        enemyPos = { row: newRow, col: newCol };
                    } else {
                        break;
                    }
                }
                distance++;
            }
        } else {
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === CONSTANTS.EMPTY) {
                moves.push({
                    from: { row, col },
                    to: { row: newRow, col: newCol },
                    isCapture: false
                });
            }
            
            const isForward = (color === CONSTANTS.WHITE && dr === -1) || (color === CONSTANTS.BLACK && dr === 1);
            const isSideways = dr === 0;
            
            if (isForward || isSideways) {
                const jumpRow = row + dr * 2;
                const jumpCol = col + dc * 2;
                const midRow = row + dr;
                const midCol = col + dc;
                
                if (this.isValidPosition(jumpRow, jumpCol)) {
                    const midPiece = this.board[midRow][midCol];
                    const targetPiece = this.board[jumpRow][jumpCol];
                    
                    if (midPiece !== CONSTANTS.EMPTY && 
                        this.getPieceColor(midPiece) !== color && 
                        targetPiece === CONSTANTS.EMPTY) {
                        moves.push({
                            from: { row, col },
                            to: { row: jumpRow, col: jumpCol },
                            isCapture: true,
                            captured: { row: midRow, col: midCol }
                        });
                    }
                }
            }
        }
    }
    
    executeMove(move) {
        const piece = this.board[move.from.row][move.from.col];
        
        // Перемещаем фигуру
        this.board[move.to.row][move.to.col] = piece;
        this.board[move.from.row][move.from.col] = CONSTANTS.EMPTY;
        
        // Удаляем захваченную фигуру
        if (move.isCapture) {
            this.board[move.captured.row][move.captured.col] = CONSTANTS.EMPTY;
        }
        
        // Превращение в дамку
        let wasPromoted = false;
        if (piece === CONSTANTS.WHITE && move.to.row === 0) {
            this.board[move.to.row][move.to.col] = CONSTANTS.WHITE_KING;
            wasPromoted = true;
        } else if (piece === CONSTANTS.BLACK && move.to.row === 7) {
            this.board[move.to.row][move.to.col] = CONSTANTS.BLACK_KING;
            wasPromoted = true;
        }
        
        this.updateCounts();
        
        // Проверка на дополнительные захваты
        if (move.isCapture && !wasPromoted) {
            const newPiece = this.board[move.to.row][move.to.col];
            const followUpMoves = this.getPieceMoves(move.to.row, move.to.col, newPiece)
                .filter(m => m.isCapture);
            
            if (followUpMoves.length > 0) {
                return {
                    hasFollowUp: true,
                    position: { row: move.to.row, col: move.to.col },
                    moves: followUpMoves
                };
            }
        }
        
        return { hasFollowUp: false };
    }
    
    switchTurn() {
        this.currentTurn = this.currentTurn === CONSTANTS.WHITE ? CONSTANTS.BLACK : CONSTANTS.WHITE;
        if (this.onTurnChange) {
            this.onTurnChange(this.currentTurn);
        }
    }
    
    updateCounts() {
        this.whiteCount = 0;
        this.blackCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (this.getPieceColor(piece) === CONSTANTS.WHITE) this.whiteCount++;
                if (this.getPieceColor(piece) === CONSTANTS.BLACK) this.blackCount++;
            }
        }
        
        if (this.onGameStateChange) {
            this.onGameStateChange(this.whiteCount, this.blackCount);
        }
    }
    
    checkWinner() {
        const whiteMoves = this.getAllMoves(CONSTANTS.WHITE);
        const blackMoves = this.getAllMoves(CONSTANTS.BLACK);
        
        if (this.whiteCount === 0 || (this.currentTurn === CONSTANTS.WHITE && whiteMoves.length === 0)) {
            if (this.onGameEnd) this.onGameEnd(CONSTANTS.BLACK);
            return CONSTANTS.BLACK;
        }
        
        if (this.blackCount === 0 || (this.currentTurn === CONSTANTS.BLACK && blackMoves.length === 0)) {
            if (this.onGameEnd) this.onGameEnd(CONSTANTS.WHITE);
            return CONSTANTS.WHITE;
        }
        
        return null;
    }
    
    getBoardState() {
        return this.board.map(row => [...row]);
    }
    
    loadBoardState(state) {
        this.board = state.map(row => [...row]);
        this.updateCounts();
    }
}
