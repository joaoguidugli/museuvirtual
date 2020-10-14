//  ---------------------------------------------------------------------------------
//  Copyright (c) Microsoft Corporation.  All rights reserved.
//
//  The MIT License (MIT)
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//  ---------------------------------------------------------------------------------

var UNITWIDTH = 90; // Width of a cubes in the maze (Largura dos cubos no labirinto)
var UNITHEIGHT = 90; // Height of the cubes in the maze (Altura dos cubos no labirinto)
var PLAYERCOLLISIONDISTANCE = 20; // How many units away the player can get from the wall (Distância máxima do jogador em relação a parede - colisão)
var PLAYERSPEED = 1100.0; // How fast the player moves (Velocidade do jogador)


var clock;
var loader = new THREE.JSONLoader();
var camera, controls, scene, renderer;
var mapSize;

var collidableObjects = [];

var totalCubesWide;


// Flags to determine which direction the player is moving (Booleanos que determinam se o jogador vai para qual direção, inicia false)
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

// Flag to determine if the player lost the game (Booleano que determina se o jogo acabou)
var gameOver = false;

// Velocity vectors for the player and dino (Velocidade vetorial do jogador e do dino)
var playerVelocity = new THREE.Vector3();


// HTML elements to be changed (Importa os elementos html do index para alterar conforme o jogo)
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');

var container = document.getElementById('container');
var body = document.getElementById('body');
var blocker = document.getElementById('blocker');


// Get the pointer lock and start listening for if its state changes (Bloqueia o mouse e cria um ouvinte para ver se o estado do mouse)
function getPointerLock() {
    document.onclick = function () {
        container.requestPointerLock();
    }

    document.addEventListener('pointerlockchange', lockChange, false);
}

// Switch the controls on or off (Liga e desliga os controles do mouse)
function lockChange() {
    // Turn on controls
    if (document.pointerLockElement === container) {
        blocker.style.display = "none";
        controls.enabled = true;
        // Turn off the controls
    } else {
        if (gameOver) {
            location.reload();
        }
        // Display the blocker and instruction
        blocker.style.display = "";
        controls.enabled = false;
    }
}


// Set up the game (Inicia o jogo)
getPointerLock();
init();



// Set up the game (Inicia a função do jogo)
function init() {
    // Set clock to keep track of frames (???????)
    clock = new THREE.Clock();
    // Create the scene where everything will go (Cria a cena)
    scene = new THREE.Scene();

    // Add some fog for effects (Adiciona a névoa do fundo)
    scene.fog = new THREE.FogExp2(0x000000, 0.0005);

    // Set render settings (Define as configurações de renderização)
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Render to the container (Pega o que foi renderizado e joga no container do html)
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // Set camera position and view details (Arruma a configuração da câmera para primeira pessoa)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.y = 20; // Height the camera will be looking from
    camera.position.x = 0;
    camera.position.z = 0;

    // create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add(listener);

    // create a global audio source
    var sound = new THREE.Audio(listener);

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load('sons/passos.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.9);
        sound.play();
    });


    // Add the camera to the controller, then add to the scene (Adicione a câmera ao controlador e depois adicione à cena)
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    listenForPlayerMovement();


    // Add the walls(cubes) of the maze (Adiciona as paredes ao labirinto)
    createMazeCubes();
    // Add ground plane (Adiciona a base)
    createGround();
    // Add perimeter walls that surround the maze (Adiciona uma parede em volta da base)
    createPerimWalls();

    // Model is loaded, switch from "Loading..." to instruction text (Retira o Carregando e coloca as intruções)
    instructions.innerHTML = "<strong>Click to Play!</strong> </br></br> W,A,S,D or arrow keys = move </br>Mouse = look around";

    // Call the animate function so that animation begins after the model is loaded (Chama a função animate para que a animação comece após o carregamento do modelo)
    animate();

    // Add lights to the scene (Adiciona luz)
    addLights();

    // Listen for if the window changes sizes (Fica verificando se o tamanho da tela mudou)
    window.addEventListener('resize', onWindowResize, false);

}


// Add event listeners for player movement key presses (Fica verificando se o usuário apertou alguma tecla)
function listenForPlayerMovement() {
    // Listen for when a key is pressed
    // If it's a specified key, mark the direction as true since moving
    var onKeyDown = function (event) {

        switch (event.keyCode) {

            case 38: // up (Representação em ASCII)
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;


        }

    };

    // Listen for when a key is released
    // If it's a specified key, mark the direction as false since no longer moving
    var onKeyUp = function (event) {

        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };

    // Add event listeners for when movement keys are pressed and released
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

// Add lights to the scene (Adiciona as luzes a cena)
function addLights() {
    var lightOne = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    lightOne.position.set(1, 5, 1);
    scene.add(lightOne);
}

function searchObject (objeto) {
    if(objeto === "cubo"){
        // Cubo
        var cubeGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT, UNITWIDTH);
        var cubeMat = new THREE.MeshPhongMaterial({
            color: 0x81cfe0,
        });
        var objt = new THREE.Mesh(cubeGeo, cubeMat);
        return objt;
    } else if(objeto === "triangulo"){
        //Piramide
        var cilinderGeo = new THREE.CylinderGeometry( 1, 20, 20, 3 );
        var cilinderMat = new THREE.MeshBasicMaterial({
        color: 0xffff00
        });
        var objt = new THREE.Mesh(cilinderGeo, cilinderMat);
        return objt;
    }
}

// Create the maze walls using cubes that are mapped with a 2D array (Crie as paredes do labirinto usando cubos mapeados com uma matriz 2D)
function createMazeCubes() {
    // Maze wall mapping, assuming matrix
    // 1's are cubes, 0's are empty space
    var map = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "triangulo", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, "triangulo", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "triangulo", 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "triangulo", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, "triangulo", 0, 0, 0, 0, 0, "triangulo", 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, "cubo", 0, 0, 0, "triangulo", 0, 0, 0, 0, 0, 0, 0, 0, 0, "triangulo", 0, 0, 0, "cubo", 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, "cubo", 0, 0, 0, 0, 0, "cubo", 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "cubo", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, "cubo", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "cubo", 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "cubo", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,]
    ];

    // Keep cubes within boundry walls
    var widthOffset = UNITWIDTH / 2;
    // Put the bottom of the cube at y = 0 (Coloca o cubo encostado no chão)
    var heightOffset = UNITHEIGHT / 2;

    // See how wide the map is by seeing how long the first array is
    totalCubesWide = map[0].length;

    // Place walls where 1`s are (Colocas as paredes nos pontos 1 do mapa)
    for (var i = 0; i < totalCubesWide; i++) {
        for (var j = 0; j < map[i].length; j++) {
            // If a 1 is found, add a cube at the corresponding position
            if (map[i][j] !== 0) {
                // Make the object
                var objt = searchObject(String(map[i][j]));
                // Set the cube position
                objt.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                objt.position.y = heightOffset;
                objt.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                // Add the cube
                scene.add(objt);
                // Used later for collision detection
                collidableObjects.push(objt);
            }
        }
    }
    // Create the ground based on the map size the matrix/cube size produced
    mapSize = totalCubesWide * UNITWIDTH;
}


// Create the ground plane that the maze sits on top of (Cria o chão do mapa onde vai fciar o labirinto)
function createGround() {
    // Create the ground geometry and material
    var groundGeo = new THREE.PlaneGeometry(mapSize, mapSize, 7, 7);
    var groundMat = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide, shading: THREE.FlatShading, wireframe: true, wireframeLinewidth: 5 });

    // Create the ground and rotate it flat
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, 1, 0);
    ground.rotation.x = degreesToRadians(90);
    scene.add(ground);
}


// Make the four perimeter walls for the maze (Cria as paredes do chão para o jogador n cair do plano)
function createPerimWalls() {
    var halfMap = mapSize / 2; // Half the size of the map
    var sign = 1; // Used to make an amount positive or negative

    // Loop through twice, making two perimeter walls at a time
    for (var i = 0; i < 2; i++) {
        var perimGeo = new THREE.PlaneGeometry(mapSize, UNITHEIGHT);
        // Make the material double sided
        var perimMat = new THREE.MeshPhongMaterial({ color: 0x000000, side: THREE.DoubleSide });
        // Make two walls
        var perimWallLR = new THREE.Mesh(perimGeo, perimMat);
        var perimWallFB = new THREE.Mesh(perimGeo, perimMat);

        // Create left/right walls
        perimWallLR.position.set(halfMap * sign, UNITHEIGHT / 2, 0);
        perimWallLR.rotation.y = degreesToRadians(90);
        scene.add(perimWallLR);
        collidableObjects.push(perimWallLR);
        // Create front/back walls
        perimWallFB.position.set(0, UNITHEIGHT / 2, halfMap * sign);
        scene.add(perimWallFB);
        collidableObjects.push(perimWallFB);

        collidableObjects.push(perimWallLR);
        collidableObjects.push(perimWallFB);

        sign = -1; // Swap to negative value
    }
}

// Update the camera and renderer when the window changes size (Atualize a câmera e o renderizador quando a janela mudar de tamanho)
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}


function animate() {

    render();
    requestAnimationFrame(animate);

    // Get the change in time between frames
    var delta = clock.getDelta();
    // Update our frames per second monitor

    animatePlayer(delta);



}

// Render the scene
function render() {
    renderer.render(scene, camera);

}



// Animate the player camera
function animatePlayer(delta) {

    // Gradual slowdown
    playerVelocity.x -= playerVelocity.x * 10.0 * delta;
    playerVelocity.z -= playerVelocity.z * 10.0 * delta;

    // If no collision and a movement key is being pressed, apply movement velocity
    if (detectPlayerCollision() == false) {
        if (moveForward) {
            playerVelocity.z -= PLAYERSPEED * delta;
        }
        if (moveBackward) playerVelocity.z += PLAYERSPEED * delta;
        if (moveLeft) playerVelocity.x -= PLAYERSPEED * delta;
        if (moveRight) playerVelocity.x += PLAYERSPEED * delta;

        controls.getObject().translateX(playerVelocity.x * delta);
        controls.getObject().translateZ(playerVelocity.z * delta);
    } else {
        // Collision or no movement key being pressed. Stop movememnt
        playerVelocity.x = 0;
        playerVelocity.z = 0;
    }
}


//  Determine if the player is colliding with a collidable object
function detectPlayerCollision() {
    // The rotation matrix to apply to our direction vector
    // Undefined by default to indicate ray should coming from front
    var rotationMatrix;
    // Get direction of camera
    var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();

    // Check which direction we're moving (not looking)
    // Flip matrix to that direction so that we can reposition the ray
    if (moveBackward) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(180));
    } else if (moveLeft) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(90));
    } else if (moveRight) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(270));
    }

    // Player is moving forward, no rotation matrix needed
    if (rotationMatrix !== undefined) {
        cameraDirection.applyMatrix4(rotationMatrix);
    }

    // Apply ray to player camera
    var rayCaster = new THREE.Raycaster(controls.getObject().position, cameraDirection);

    // If our ray hit a collidable object, return true
    if (rayIntersect(rayCaster, PLAYERCOLLISIONDISTANCE)) {
        return true;
    } else {
        return false;
    }
}


// Takes a ray and sees if it's colliding with anything from the list of collidable objects
// Returns true if certain distance away from object
function rayIntersect(ray, distance) {
    var intersects = ray.intersectObjects(collidableObjects);
    for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].distance < distance) {
            return true;
        }
    }
    return false;
}

// Generate a random integer within a range
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

// Converts degrees to radians
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Converts radians to degrees
function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}