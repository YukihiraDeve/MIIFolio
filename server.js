const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};

server.listen(3000, () => {
    console.log('Listening on port 3000');
});

app.use(express.static('public'));



io.on('connection', (socket) => {
    console.log("New client connected");
    
    // Génération d'un identifiant unique pour le joueur connecté
    let playerId = socket.id;
    players[playerId] = { x: 0, z: 0 };  // Exemple de coordonnées initiales

    // Envoyer l'ID au client
    socket.emit('playerId', playerId);
    
    // Envoyer la liste actuelle des joueurs au client
    socket.emit('playersList', players);
    
    socket.broadcast.emit('newPlayer', { id: playerId, x: 0, z: 0 });

    
    socket.on('moveCube', (data) => {
        // Mettre à jour les coordonnées du joueur dans l'objet players
        players[playerId].x = data.x;
        players[playerId].z = data.z;
        
        // Envoyer l'information mise à jour à tous les autres clients
        socket.broadcast.emit('cubeMoved', { id: playerId, x: data.x, z: data.z });
    });

    socket.on('disconnect', () => {
        console.log("Client disconnected");
        
        // Supprimer le joueur de l'objet players
        delete players[playerId];
        
        // Informer les autres clients de la déconnexion du joueur
        socket.broadcast.emit('playerDisconnected', playerId);
    });
});