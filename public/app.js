class PlayerCube {
    constructor(scene, x = 0, z = 0) {
        this.geometry = new THREE.BoxGeometry();
        this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, 0, z);

        scene.add(this.mesh);
    }

    move(x, z) {
        this.mesh.position.x += x;
        this.mesh.position.z += z;
    }

    setPosition(x, z) {
        this.mesh.position.set(x, 0, z);
    }

    removeFromScene(scene) {
        scene.remove(this.mesh);
    }
}

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

let animate = function() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


animate();

let allCubes = {};
let currentCubeId = null;




document.addEventListener('DOMContentLoaded', () => {

let socket = io.connect('http://localhost:3000');

let manager = nipplejs.create({
    zone: document.getElementById('joystick'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    size: 150
});

socket.on('newPlayer', function(data) {
    if (!allCubes[data.id]) {
        let playerCube = new PlayerCube(scene, data.x, data.z);
        allCubes[data.id] = playerCube;
    }
});

    
socket.on('playerId', function(id) {
    if (!allCubes[id]) {
        allCubes[id] = new PlayerCube(scene);
    }
    currentCubeId = id;
});

socket.on('playersList', function(playersData) {
    for (let id in playersData) {
        if (!allCubes[id]) {
            allCubes[id] = new PlayerCube(scene, playersData[id].x, playersData[id].z);
        } else {
            allCubes[id].setPosition(playersData[id].x, playersData[id].z);
        }
    }
});



manager.on('move', (e, data) => {
    if (allCubes[currentCubeId]) {
        let xMovement = Math.cos(data.angle.radian) * data.distance * 0.01;
        let zMovement = -Math.sin(data.angle.radian) * data.distance * 0.01;
        allCubes[currentCubeId].move(xMovement, zMovement);
        socket.emit('moveCube', { x: allCubes[currentCubeId].mesh.position.x, z: allCubes[currentCubeId].mesh.position.z });
    }
});

// Écoutez les mises à jour des autres joueurs
socket.on('cubeMoved', function(data) {
    console.log('Received cubeMoved:', data);
    if (!allCubes[data.id]) {
        allCubes[data.id] = new PlayerCube(scene, data.x, data.z);
    }
    allCubes[data.id].setPosition(data.x, data.z);
});

socket.on('playerDisconnected', function(id) {
    if (allCubes[id]) {
        allCubes[id].removeFromScene(scene);
        delete allCubes[id];
    }
});

socket.on('error', function(err) {
    console.error("Socket error:", err);
});




});