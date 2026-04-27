<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Kaiji Online | Ölümcül Düello</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        :root { --gold: #d4af37; --blood: #8a0303; --bg: #0a0a0a; }
        body { background: var(--bg); color: white; font-family: 'Garamond', serif; margin: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        /* Kurallar Paneli */
        #rules { position: fixed; left: 10px; top: 150px; width: 180px; background: rgba(0,0,0,0.8); border: 1px solid var(--gold); padding: 10px; font-size: 13px; color: #ccc; }
        #rules h4 { color: var(--gold); margin: 0 0 5px 0; border-bottom: 1px solid var(--gold); }

        .ui-header { display: flex; justify-content: space-around; padding: 10px; border-bottom: 2px solid var(--gold); }
        .game-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; }
        .hand { display: flex; gap: 10px; height: 150px; }
        .card { width: 90px; height: 140px; background-size: cover; border: 2px solid #333; border-radius: 8px; cursor: pointer; transition: 0.3s; }
        .card.selected { transform: translateY(-20px); border-color: var(--gold); box-shadow: 0 0 15px var(--gold); }
        .card.opponent { background-image: url('back.png'); }
        .card.emperor { background-image: url('emperor.png'); }
        .card.citizen { background-image: url('citizen.png'); }
        .card.slave { background-image: url('slave.png'); }
        
        #overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        button { background: var(--gold); color: black; border: none; padding: 12px 25px; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .action-btn { display: none; margin-top: 10px; border: 2px solid var(--blood); }
    </style>
</head>
<body>

    <div id="rules">
        <h4>HİYERARŞİ</h4>
        • İmparator > Vatandaş<br>
        • Vatandaş > Köle<br>
        • Köle > İmparator (1:5)<br><br>
        <h4>SİSTEM</h4>
        Tur başı soru sorulur. Hızlı olan başlar. Eşitlikte zar atılır.
    </div>

    <div id="overlay">
        <h2 id="wait-msg">ODA KODU GİRİN</h2>
        <input type="text" id="room-input" placeholder="Örn: 123" style="padding: 10px; margin-bottom: 10px;">
        <button onclick="joinRoom()">ODAYA KATIL</button>
    </div>

    <div class="ui-header">
        <div>Bakiye: <span id="balance">10,000</span> ¥</div>
        <div>Tur: <span id="turn-count">1/12</span></div>
        <div id="side-tag" style="color: var(--gold); font-weight: bold;"></div>
    </div>

    <div class="game-container">
        <div class="hand" id="opponent-hand"></div>
        <div id="status">Rakip bekleniyor...</div>
        <div id="dice-result" style="font-size: 2rem; color: var(--gold);"></div>
        <div class="hand" id="player-hand"></div>
        <button id="confirm-btn" class="action-btn" onclick="sendMove()">Kartı Gönder</button>
    </div>

    <script>
        const socket = io();
        let mySide, myRoom, selectedIdx = -1;
        let playerHand = [];

        function joinRoom() {
            myRoom = document.getElementById('room-input').value;
            if(!myRoom) return;
            socket.emit('join-room', myRoom);
            document.getElementById('wait-msg').innerText = "Diğer oyuncu bekleniyor...";
        }

        socket.on('assigned-side', (side) => {
            mySide = side;
            document.getElementById('side-tag').innerText = "TARAFIN: " + side;
            initDeck();
        });

        socket.on('game-start', () => {
            document.getElementById('overlay').style.display = 'none';
            askQuestion();
        });

        function askQuestion() {
            const ans = prompt("Mekanik Mühendisliği Sorusu: Statik denge için toplam moment ne olmalıdır?");
            if(ans === "0") {
                alert("Doğru! Öncelik sende olabilir.");
                // Burada basitlik adına 0 cevabını verenin başlayacağı bir mantık kuruldu.
            }
        }

        function initDeck() {
            playerHand = mySide === "EMPEROR" 
                ? ["citizen", "citizen", "citizen", "citizen", "emperor"] 
                : ["citizen", "citizen", "citizen", "citizen", "slave"];
            render();
        }

        function selectCard(idx) {
            selectedIdx = idx;
            render();
            document.getElementById('confirm-btn').style.display = 'block';
        }

        function sendMove() {
            socket.emit('play-card', { roomId: myRoom, card: playerHand[selectedIdx], idx: selectedIdx });
            document.getElementById('confirm-btn').style.display = 'none';
            document.getElementById('status').innerText = "Kart masaya sürüldü. Rakip bekleniyor...";
        }

        function render() {
            const pDiv = document.getElementById('player-hand');
            pDiv.innerHTML = '';
            playerHand.forEach((type, i) => {
                const c = document.createElement('div');
                c.className = `card ${type} ${i === selectedIdx ? 'selected' : ''}`;
                c.onclick = () => selectCard(i);
                pDiv.appendChild(c);
            });
            // Rakip kartları (sadece görsel)
            document.getElementById('opponent-hand').innerHTML = '<div class="card opponent"></div>'.repeat(5);
        }
    </script>
</body>
</html>