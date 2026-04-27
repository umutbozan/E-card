const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

let rooms = {};

io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, username }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], hands: {}, nextReady: new Set(), usernames: {} };
        }

        if (rooms[roomId].players.length < 2) {
            socket.username = username;
            rooms[roomId].players.push(socket.id);
            rooms[roomId].usernames[socket.id] = username;
            socket.join(roomId);
            
            const side = rooms[roomId].players.length === 1 ? "EMPEROR" : "SLAVE";
            socket.emit('assigned-side', { side, username });

            if (rooms[roomId].players.length === 2) {
                io.to(roomId).emit('chat-message', { system: true, msg: "Oyun başladı! Bol şans." });
            }
        }
    });

    socket.on('send-chat', ({ roomId, msg }) => {
        io.to(roomId).emit('chat-message', { user: socket.username, msg });
    });

    socket.on('play-card', ({ roomId, card, idx }) => {
        if (!rooms[roomId]) return;
        rooms[roomId].hands[socket.id] = { card, idx };
        
        socket.to(roomId).emit('opponent-selected');

        if (Object.keys(rooms[roomId].hands).length === 2) {
            io.to(roomId).emit('resolve-cards', rooms[roomId].hands);
            rooms[roomId].hands = {}; 
            rooms[roomId].nextReady.clear(); // Tur bitince hazır setini temizle
        }
    });

    socket.on('next-ready', (roomId) => {
        if (!rooms[roomId]) return;
        rooms[roomId].nextReady.add(socket.id);
        
        if (rooms[roomId].nextReady.size === 2) {
            io.to(roomId).emit('start-next-round');
            rooms[roomId].nextReady.clear();
        }
    });

    socket.on('disconnect', () => {
        // Oda temizliği eklenebilir
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
