// Сетевой менеджер
class NetworkManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.isConnected = false;
        this.myId = null;
        this.onConnected = null;
        this.onDisconnected = null;
        this.onMoveReceived = null;
        this.onRestartReceived = null;
    }
    
    init() {
        return new Promise((resolve, reject) => {
            this.peer = new Peer();
            
            this.peer.on('open', (id) => {
                this.myId = id;
                console.log('PeerJS initialized with ID:', id);
                resolve(id);
            });
            
            this.peer.on('error', (error) => {
                console.error('PeerJS error:', error);
                reject(error);
            });
            
            this.peer.on('connection', (conn) => {
                console.log('Incoming connection from:', conn.peer);
                this.handleConnection(conn);
                this.isHost = true;
            });
        });
    }
    
    handleConnection(conn) {
        this.connection = conn;
        
        conn.on('open', () => {
            console.log('Connection established');
            this.isConnected = true;
            if (this.onConnected) {
                this.onConnected(this.isHost);
            }
        });
        
        conn.on('data', (data) => {
            this.handleData(data);
        });
        
        conn.on('close', () => {
            console.log('Connection closed');
            this.isConnected = false;
            if (this.onDisconnected) {
                this.onDisconnected();
            }
        });
        
        conn.on('error', (error) => {
            console.error('Connection error:', error);
        });
    }
    
    handleData(data) {
        switch (data.type) {
            case 'move':
                if (this.onMoveReceived) {
                    this.onMoveReceived(data.move);
                }
                break;
            case 'restart':
                if (this.onRestartReceived) {
                    this.onRestartReceived();
                }
                break;
            case 'ready':
                if (this.onConnected && !this.isHost) {
                    this.onConnected(false);
                }
                break;
        }
    }
    
    createGame() {
        return new Promise((resolve, reject) => {
            if (!this.peer) {
                reject(new Error('Peer not initialized'));
                return;
            }
            
            this.isHost = true;
            resolve(this.myId);
        });
    }
    
    joinGame(peerId) {
        return new Promise((resolve, reject) => {
            if (!this.peer) {
                reject(new Error('Peer not initialized'));
                return;
            }
            
            console.log('Connecting to:', peerId);
            const conn = this.peer.connect(peerId);
            
            conn.on('open', () => {
                console.log('Connected to host');
                this.handleConnection(conn);
                this.isHost = false;
                
                // Отправляем сигнал готовности
                setTimeout(() => {
                    if (this.connection && this.connection.open) {
                        this.connection.send({ type: 'ready' });
                    }
                }, 100);
                
                resolve();
            });
            
            conn.on('error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });
        });
    }
    
    sendMove(move) {
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'move',
                move: move
            });
            return true;
        }
        return false;
    }
    
    sendRestart() {
        if (this.connection && this.connection.open) {
            this.connection.send({ type: 'restart' });
            return true;
        }
        return false;
    }
    
    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.isConnected = false;
        this.isHost = false;
    }
}
