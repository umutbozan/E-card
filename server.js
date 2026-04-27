const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static(__dirname));

let rooms = {};

io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], hands: {}, ready: {} };
        }

        if (rooms[roomId].players.length < 2) {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            
            const side = rooms[roomId].players.length === 1 ? "EMPEROR" : "SLAVE";
            socket.emit('assigned-side', side);

            if (rooms[roomId].players.length === 2) {
                io.to(roomId).emit('start-challenge', {
                    question: "Statik denge için toplam moment (tork) ne olmalıdır?",
                    answer: "0"
                });
            }
        }
    });

    socket.on('challenge-complete', ({ roomId, speed }) => {
        if (!rooms[roomId].ready) rooms[roomId].ready = {};
        rooms[roomId].ready[socket.id] = speed;
        
        if (Object.keys(rooms[roomId].ready).length === 2) {
            const players = Object.keys(rooms[roomId].ready);
            const winner = rooms[roomId].ready[players[0]] < rooms[roomId].ready[players[1]] ? players[0] : players[1];
            io.to(roomId).emit('challenge-result', { firstPlayer: winner });
        }
    });

    socket.on('play-card', ({ roomId, card, idx }) => {
        rooms[roomId].hands[socket.id] = { card, idx };
        if (Object.keys(rooms[roomId].hands).length === 2) {
            io.to(roomId).emit('resolve-cards', rooms[roomId].hands);
            rooms[roomId].hands = {}; 
        } else {
            socket.to(roomId).emit('opponent-ready');
        }
    });
});

// Railway için kritik port ayarı
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Kaiji Server ${PORT} portunda aktif.`);
});
