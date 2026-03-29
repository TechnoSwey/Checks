// Главный файл приложения
let game;
let network;
let renderer;
let currentGameType = 'bot';
let currentGameMode = 'russian';
let currentDifficulty = 'medium';
let isOnlineGameReady = false;
let myColor = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    game = new CheckersGame();
    network = new NetworkManager();
    renderer = new BoardRenderer();
    
    // Настройка колбэков игры
    game.onGameStateChange = (white, black) => {
        document.getElementById('whiteScore').textContent = white;
        document.getElementById('blackScore').textContent = black;
    };
    
    game.onTurnChange = (turn) => {
        const turnDot = document.getElementById('turnColor');
        const turnText = document.getElementById('turnText');
        
        if (turn === CONSTANTS.WHITE) {
            turnDot.className = 'turn-dot white';
            turnText.textContent = 'Ход белых';
        } else {
            turnDot.className = 'turn-dot black';
            turnText.textContent = 'Ход черных';
        }
        
        renderer.render(game.getBoardState(), game.selectedPiece, game.validMoves);
    };
    
    game.onGameEnd = (winner) => {
        const isWhiteWinner = winner === CONSTANTS.WHITE;
        let message = '';
        
        if (currentGameType === 'bot') {
            message = isWhiteWinner ? 'Поздравляем! Вы победили!' : 'Бот победил! Попробуйте еще раз!';
        } else if (currentGameType === 'online') {
            const iWon = (isWhiteWinner && myColor === 'white') || (!isWhiteWinner && myColor === 'black');
            message = iWon ? 'Поздравляем! Вы победили!' : 'Вы проиграли!';
        } else {
            message = isWhiteWinner ? 'Белые победили!' : 'Черные победили!';
        }
        
        document.getElementById('modalTitle').textContent = isWhiteWinner ? 'Победа!' : 'Поражение';
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('modal').classList.remove('hidden');
    };
    
    // Настройка обработчиков UI
    setupEventListeners();
    
    // Инициализация игры
    startNewGame();
});

function setupEventListeners() {
    // Тип игры
    document.getElementById('gameType').addEventListener('change', (e) => {
        currentGameType = e.target.value;
        const networkPanel = document.getElementById('networkPanel');
        const difficultyGroup = document.getElementById('difficultyGroup');
        
        if (currentGameType === 'online') {
            networkPanel.classList.remove('hidden');
            difficultyGroup.style.display = 'none';
            document.getElementById('disconnectBtn').classList.remove('hidden');
        } else {
            networkPanel.classList.add('hidden');
            difficultyGroup.style.display = 'flex';
            document.getElementById('disconnectBtn').classList.add('hidden');
            
            if (currentGameType === 'bot') {
                document.getElementById('difficultyGroup').style.display = 'flex';
            } else {
                document.getElementById('difficultyGroup').style.display = 'none';
            }
        }
        
        startNewGame();
    });
    
    // Режим шашек
    document.getElementById('gameMode').addEventListener('change', (e) => {
        currentGameMode = e.target.value;
        startNewGame();
    });
    
    // Сложность бота
    document.getElementById('difficulty').addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        if (currentGameType === 'bot') {
            startNewGame();
        }
    });
    
    // Создание игры
    document.getElementById('createGameBtn').addEventListener('click', async () => {
        try {
            await network.init();
            const peerId = await network.createGame();
            
            document.getElementById('myPeerId').textContent = peerId;
            document.getElementById('createGamePanel').classList.remove('hidden');
            document.getElementById('joinGamePanel').classList.add('hidden');
            document.getElementById('waitingStatus').className = 'status waiting';
            document.getElementById('waitingStatus').textContent = 'Ожидание подключения игрока...';
            
            network.onConnected = (isHost) => {
                document.getElementById('waitingStatus').className = 'status connected';
                document.getElementById('waitingStatus').textContent = 'Игрок подключен! Игра начинается.';
                document.getElementById('connectionStatus').innerHTML = '<span style="color: #27ae60;">✓ Подключено!</span>';
                
                myColor = 'white';
                startOnlineGame();
            };
            
            network.onDisconnected = () => {
                document.getElementById('connectionStatus').innerHTML = '<span style="color: #e74c3c;">✗ Соединение потеряно</span>';
                document.getElementById('waitingStatus').className = 'status error';
                document.getElementById('waitingStatus').textContent = 'Соединение потеряно';
                isOnlineGameReady = false;
            };
            
            network.onMoveReceived = (move) => {
                if (isOnlineGameReady && game.currentTurn === (myColor === 'white' ? CONSTANTS.BLACK : CONSTANTS.WHITE)) {
                    executeOnlineMove(move);
                }
            };
            
            network.onRestartReceived = () => {
                startNewGame();
            };
            
        } catch (error) {
            console.error('Failed to create game:', error);
            document.getElementById('connectionStatus').innerHTML = '<span style="color: #e74c3c;">✗ Ошибка создания игры</span>';
        }
    });
    
    // Подключение к игре
    document.getElementById('joinGameBtn').addEventListener('click', () => {
        document.getElementById('createGamePanel').classList.add('hidden');
        document.getElementById('joinGamePanel').classList.remove('hidden');
    });
    
    document.getElementById('connectBtn').addEventListener('click', async () => {
        const remoteId = document.getElementById('remotePeerId').value.trim();
        if (!remoteId) return;
        
        try {
            await network.init();
            await network.joinGame(remoteId);
            
            document.getElementById('connectionStatus').innerHTML = '<span style="color: #f39c12;">⏳ Подключение...</span>';
            
            network.onConnected = (isHost) => {
                document.getElementById('connectionStatus').innerHTML = '<span style="color: #27ae60;">✓ Подключено к сопернику!</span>';
                myColor = 'black';
                startOnlineGame();
            };
            
            network.onDisconnected = () => {
                document.getElementById('connectionStatus').innerHTML = '<span style="color: #e74c3c;">✗ Соединение потеряно</span>';
                isOnlineGameReady = false;
            };
            
            network.onMoveReceived = (move) => {
                if (isOnlineGameReady && game.currentTurn === (myColor === 'white' ? CONSTANTS.BLACK : CONSTANTS.WHITE)) {
                    executeOnlineMove(move);
                }
            };
            
            network.onRestartReceived = () => {
                startNewGame();
            };
            
        } catch (error) {
            console.error('Failed to join game:', error);
            document.getElementById('connectionStatus').innerHTML = '<span style="color: #e74c3c;">✗ Не удалось подключиться</span>';
        }
    });
    
    // Копирование ID
    document.getElementById('copyIdBtn').addEventListener('click', () => {
        const peerId = document.getElementById('myPeerId').textContent;
        navigator.clipboard.writeText(peerId);
        alert('ID скопирован в буфер обмена');
    });
    
    // Сброс игры
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (currentGameType === 'online' && network.isConnected) {
            network.sendRestart();
        }
        startNewGame();
    });
    
    // Отключение
    document.getElementById('disconnectBtn').addEventListener('click', () => {
        network.disconnect();
        document.getElementById('networkPanel').classList.add('hidden');
        document.getElementById('createGamePanel').classList.add('hidden');
        document.getElementById('joinGamePanel').classList.add('hidden');
        document.getElementById('connectionStatus').innerHTML = '';
        currentGameType = 'bot';
        document.getElementById('gameType').value = 'bot';
        document.getElementById('difficultyGroup').style.display = 'flex';
        document.getElementById('disconnectBtn').classList.add('hidden');
        startNewGame();
    });
    
    // Модальное окно
    document.getElementById('modalCloseBtn').addEventListener('click', () => {
        document.getElementById('modal').classList.add('hidden');
        startNewGame();
    });
}

function startNewGame() {
    game.init(currentGameMode);
    isOnlineGameReady = false;
    renderer.render(game.getBoardState(), null, []);
    
    if (currentGameType === 'bot') {
        renderer.onCellClick = (row, col) => handleBotGameClick(row, col);
        game.currentTurn = CONSTANTS.WHITE;
        game.onTurnChange(CONSTANTS.WHITE);
    } else if (currentGameType === 'local') {
        renderer.onCellClick = (row, col) => handleLocalGameClick(row, col);
        game.currentTurn = CONSTANTS.WHITE;
        game.onTurnChange(CONSTANTS.WHITE);
    } else if (currentGameType === 'online' && isOnlineGameReady) {
        renderer.onCellClick = (row, col) => handleOnlineGameClick(row, col);
    }
}

function startOnlineGame() {
    game.init(currentGameMode);
    isOnlineGameReady = true;
    renderer.render(game.getBoardState(), null, []);
    renderer.onCellClick = (row, col) => handleOnlineGameClick(row, col);
    
    if (myColor === 'white') {
        game.currentTurn = CONSTANTS.WHITE;
        game.onTurnChange(CONSTANTS.WHITE);
    } else {
        game.currentTurn = CONSTANTS.BLACK;
        game.onTurnChange(CONSTANTS.BLACK);
    }
}

function handleBotGameClick(row, col) {
    if (game.isProcessing || game.isGameOver) return;
    if (game.currentTurn !== CONSTANTS.WHITE) return;
    
    handleMove(row, col);
}

function handleLocalGameClick(row, col) {
    if (game.isProcessing || game.isGameOver) return;
    handleMove(row, col);
}

function handleOnlineGameClick(row, col) {
    if (game.isProcessing || game.isGameOver) return;
    if (!isOnlineGameReady) return;
    
    if ((myColor === 'white' && game.currentTurn !== CONSTANTS.WHITE) ||
        (myColor === 'black' && game.currentTurn !== CONSTANTS.BLACK)) {
        return;
    }
    
    handleMove(row, col);
}

function handleMove(row, col) {
    const piece = game.board[row][col];
    const pieceColor = game.getPieceColor(piece);
    
    // Выбор фигуры
    if (game.selectedPiece === null && pieceColor === game.currentTurn) {
        const moves = game.getPieceMoves(row, col, piece);
        const allMoves = game.getAllMoves(game.currentTurn);
        const hasCaptures = allMoves.some(m => m.isCapture);
        
        let validMoves = moves;
        if (hasCaptures) {
            validMoves = moves.filter(m => m.isCapture);
        }
        
        if (validMoves.length > 0) {
            game.selectedPiece = { row, col };
            game.validMoves = validMoves;
            renderer.render(game.getBoardState(), game.selectedPiece, game.validMoves);
        }
        return;
    }
    
    // Совершение хода
    if (game.selectedPiece !== null) {
        const move = game.validMoves.find(m => m.to.row === row && m.to.col === col);
        if (move) {
            game.isProcessing = true;
            
            // Выполняем ход
            const result = game.executeMove(move);
            
            // Отправляем ход в сети
            if (currentGameType === 'online' && isOnlineGameReady) {
                network.sendMove(move);
            }
            
            // Очищаем выделение
            game.selectedPiece = null;
            game.validMoves = [];
            
            // Проверяем дополнительные ходы
            if (result.hasFollowUp) {
                const newPiece = game.board[result.position.row][result.position.col];
                game.selectedPiece = result.position;
                game.validMoves = result.moves;
                renderer.render(game.getBoardState(), game.selectedPiece, game.validMoves);
                game.isProcessing = false;
                return;
            }
            
            // Смена хода
            game.switchTurn();
            
            // Проверка победителя
            const winner = game.checkWinner();
            if (winner) {
                game.isGameOver = true;
                return;
            }
            
            renderer.render(game.getBoardState(), null, []);
            
            // Ход бота
            if (currentGameType === 'bot' && game.currentTurn === CONSTANTS.BLACK && !game.isGameOver) {
                setTimeout(() => makeBotMove(), 300);
            }
            
            game.isProcessing = false;
        } else {
            game.selectedPiece = null;
            game.validMoves = [];
            renderer.render(game.getBoardState(), null, []);
        }
    }
}

function executeOnlineMove(move) {
    game.isProcessing = true;
    
    const result = game.executeMove(move);
    
    game.selectedPiece = null;
    game.validMoves = [];
    
    if (result.hasFollowUp) {
        const newPiece = game.board[result.position.row][result.position.col];
        game.selectedPiece = result.position;
        game.validMoves = result.moves;
        renderer.render(game.getBoardState(), game.selectedPiece, game.validMoves);
        game.isProcessing = false;
        return;
    }
    
    game.switchTurn();
    
    const winner = game.checkWinner();
    if (winner) {
        game.isGameOver = true;
    }
    
    renderer.render(game.getBoardState(), null, []);
    game.isProcessing = false;
}

function makeBotMove() {
    if (game.isProcessing || game.isGameOver) return;
    if (game.currentTurn !== CONSTANTS.BLACK) return;
    
    game.isProcessing = true;
    
    const moves = game.getAllMoves(CONSTANTS.BLACK);
    if (moves.length === 0) {
        game.switchTurn();
        game.isProcessing = false;
        return;
    }
    
    let selectedMove;
    
    switch (currentDifficulty) {
        case 'easy':
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
            break;
        case 'medium':
            const captures = moves.filter(m => m.isCapture);
            if (captures.length > 0) {
                selectedMove = captures[Math.floor(Math.random() * captures.length)];
            } else {
                selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
            break;
        case 'hard':
            selectedMove = getBestMove(moves);
            break;
        default:
            selectedMove = moves[0];
    }
    
    if (selectedMove) {
        setTimeout(() => {
            const result = game.executeMove(selectedMove);
            
            if (result.hasFollowUp) {
                setTimeout(() => makeBotMove(), 200);
            } else {
                game.switchTurn();
                const winner = game.checkWinner();
                if (!winner) {
                    renderer.render(game.getBoardState(), null, []);
                }
            }
            
            game.isProcessing = false;
        }, 200);
    } else {
        game.isProcessing = false;
    }
}

function getBestMove(moves) {
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
        let score = 0;
        
        if (move.isCapture) {
            score += 10;
            const piece = game.board[move.from.row][move.from.col];
            if (piece === CONSTANTS.BLACK_KING) score += 5;
        }
        
        if (move.to.row === 7 && game.board[move.from.row][move.from.col] === CONSTANTS.BLACK) {
            score += 8;
        }
        
        const centerDist = Math.abs(move.to.col - 3.5);
        score += (4 - centerDist) * 0.5;
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    return bestMove;
}

// Рендерер доски
class BoardRenderer {
    constructor() {
        this.boardElement = document.getElementById('board');
        this.onCellClick = null;
    }
    
    render(board, selectedPiece, validMoves) {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                const isDark = (row + col) % 2 === 1;
                cell.className = `cell ${isDark ? 'dark' : 'light'}`;
                
                // Подсветка возможных ходов
                const isValidMove = validMoves.some(m => m.to.row === row && m.to.col === col);
                if (isValidMove) {
                    const move = validMoves.find(m => m.to.row === row && m.to.col === col);
                    cell.classList.add('highlight');
                    if (move && move.isCapture) {
                        cell.classList.add('highlight-capture');
                    }
                }
                
                // Фигура
                const piece = board[row][col];
                if (piece !== CONSTANTS.EMPTY) {
                    const pieceDiv = document.createElement('div');
                    pieceDiv.className = `piece ${piece === CONSTANTS.WHITE || piece === CONSTANTS.WHITE_KING ? 'white' : 'black'}`;
                    
                    if (piece === CONSTANTS.WHITE_KING || piece === CONSTANTS.BLACK_KING) {
                        pieceDiv.classList.add('king');
                    }
                    
                    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                        pieceDiv.classList.add('selected');
                    }
                    
                    cell.appendChild(pieceDiv);
                }
                
                cell.addEventListener('click', () => {
                    if (this.onCellClick) {
                        this.onCellClick(row, col);
                    }
                });
                
                this.boardElement.appendChild(cell);
            }
        }
    }
}
