const express = require('express');

const app = express();
const server = app.listen(process.env.PORT || 3000, listen);


// This call back just tells us that the server has started
function listen() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://' + host + ':' + port);
}



app.use(express.static('public'));

var io = require('socket.io')(server);

app.get('/', (req, res) => {
    res.sendFile('D:/Documents/Centrale/COURS/S8_Application_Web/Projects/Projet_Web_1/public/index.html');
});


app.get('/JeuDame.js', (req, res) => {
    res.sendFile('D:/Documents/Centrale/COURS/S8_Application_Web/Projects/Projet_Web_1/public/JeuDame.js');
})

let users = [];
let userNames = [];

let scores = [];

let selectedPiece;
let pieceIsSelected = false;

let turn = 0;

function changeTurn() {
    if (turn === 0) {
        turn = 1;
    } else if (turn === 1) {
        turn = 0;
    }
}

let board;

function boardInit() {

    let board1 = [];
    for (let i = 0; i < 10; i++) {
        let collumn = []
        for (let j = 0; j < 10; j++) {
            collumn.push(false);
        }
        board1.push(collumn);
    }
    let offset = 1;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            board1[2 * j + offset][i] = 0;
        }
        if (offset === 1) {
            offset = 0;
        } else {
            offset = 1;
        }
    }

    offset = 1;
    for (let i = 6; i < 10; i++) {
        for (let j = 0; j < 5; j++) {
            board1[2 * j + offset][i] = 255;
        }
        if (offset === 1) {
            offset = 0;
        } else {
            offset = 1;
        }
    }

    board = board1;
}

// Initialisation du board au début
boardInit();


// Détection de coups possibles
function detection (i,j,ennemiColor) {

    let result = false;

    if (i + 2 <= 9 && j + 2 <= 9) {
        if (board[i+1][j+1] === ennemiColor && board[i+2][j+2] === false) {
            result = true;
        }
    }

    if (i - 2 >= 0 && j + 2 <= 9) {
        if (board[i-1][j+1] === ennemiColor && board[i-2][j+2] === false) {
            result = true;
        }
    }

    if (i - 2 >= 0 && j - 2 >= 0) {
        if (board[i-1][j-1] === ennemiColor && board[i-2][j-2] === false) {
            result = true;
        }
    }

    if (i + 2 <= 9 && j - 2 >= 0) {
        if (board[i+1][j-1] === ennemiColor && board[i+2][j-2] === false) {
            result = true;
        }
    }

    console.log((result));
    return result;
}



// Principale Méthode de gestion de Sockets
io.sockets.on('connection', (socket) => {
    console.log('a user connected : user id :' + socket.id);
    users.push(socket.id);
    userNames.push([socket.id, socket.id]);
    scores.push([socket.id, 0]);

    socket.emit('SuccessConnect', socket.id);
    io.emit("update", board);
    io.emit("updateScores",scores);


    socket.on('disconnect', () => {
        let userId = socket.id;
        console.log('user disconnected');
        let i0;
        for (let i = 0; i < users.length ; i++) {
            if (userId === users[i]) {
                i0 = i;
                break;
            }
        }
        users.splice(i0,1);
        userNames.splice(i0,1);
        scores.splice(i0,1);
    });

    socket.on('chat message', (msg) => {

        let name;
        for (let element of userNames) {
            if (socket.id === element[0]) {
                name = element[1];
            }
        }

        io.emit('chat message', name + " : " + msg);
    });

    socket.on('UserNameChanged',(username) => {
        let index =0;
        for (let element of userNames) {
            if (socket.id === element[0]) {
                userNames[index][1] = username;
                scores[index][0] = username;
            }
            index ++;
        }
        io.emit("updateScores", scores);
    });

    // Lorsque quelqu'un décide de relancer la partie
    socket.on('resetBoard', () => {
        boardInit();
        io.emit("update", board);
        io.emit("updateSelectedPiece", selectedPiece);
        selectedPiece = false;
        pieceIsSelected = false;

        for (let score of scores) {
            score[1] = 0;
        }

        io.emit("updateScores", scores);

        // C'est toujours au blancs de commencer
        turn = 0;
    });






    socket.on('mouseClicked', (mousePos) => {

        let turnPassed = false;

        if (mousePos.x >= 0 && mousePos.y >= 0 && mousePos.x <= 500 && mousePos.y <= 500) {

            let userTurn;

            if (mousePos.userId === users[0]) {
                mousePos.color = 255;
                userTurn = 0;

            } else {
                mousePos.color = 0;
                userTurn = 1;
            }

            let i = Math.floor(mousePos.x/50);
            let j = Math.floor(mousePos.y/50);

            if (userTurn === turn) {

                // On replace la pièce sur le board
                if (pieceIsSelected && board[i][j] === false) {

                    // On replace la pièce au même endroit
                    if (selectedPiece.i0 === i && selectedPiece.j0 === j) {
                        pieceIsSelected = false;
                        board[i][j] = mousePos.color;
                        selectedPiece = false;

                        turnPassed = true;



                    }

                    // On replace la pièce sur une case adjacente
                    if (Math.abs(selectedPiece.i0 - i) === 1 &&
                        Math.abs(selectedPiece.j0 - j) === 1) {

                        if ((mousePos.color === 255 && selectedPiece.j0 > j) ||
                            (mousePos.color === 0 && selectedPiece.j0 < j)) {
                            board[i][j] = mousePos.color;
                            pieceIsSelected = false;
                            turnPassed = true;
                            selectedPiece = false

                            // On change de tour à chaque fois que l'on dépose une pièce
                            changeTurn();

                        } else if (mousePos.color === 0 && selectedPiece.j0 < j) {
                            board[i][j] = mousePos.color;
                            pieceIsSelected = false;
                            turnPassed = true;
                            selectedPiece = false;

                            // On change de tour à chaque fois que l'on dépose une pièce
                            changeTurn();
                        }

                    }


                    // On mange une pièce ennemie
                    if (Math.abs(selectedPiece.i0 - i) === 2 &&
                        Math.abs(selectedPiece.j0 - j) === 2) {

                        let iEnnemi = (selectedPiece.i0 + i) / 2;
                        let jEnnemi = (selectedPiece.j0 + j) / 2;

                        if (board[iEnnemi][jEnnemi] !== false &&
                            board[iEnnemi][jEnnemi] !== selectedPiece.color) {

                            board[i][j] = mousePos.color;
                            pieceIsSelected = false;
                            turnPassed = true;
                            selectedPiece = false

                            let color = board[iEnnemi][jEnnemi];
                            board[iEnnemi][jEnnemi] = false;


                            // On rajoute des points au scoreBoard
                            for (let i = 0; i < users.length ; i++) {
                                if (socket.id === users[i]) {
                                    scores[i][1] ++;
                                    io.emit("updateScores",scores);
                                    break;
                                }
                            }



                            if (!detection(i,j,color)) {

                                // On change de tour à chaque fois que l'on dépose une pièce
                                changeTurn();
                            }

                        }
                    }
                }


                // On prend une pièce sur le board
                if (board[i][j] !== false
                    && board[i][j] === mousePos.color
                    && !pieceIsSelected
                    && !turnPassed) {

                    selectedPiece = {i0: i, j0: j, color: board[i][j]};
                    board[i][j] = false;
                    pieceIsSelected = true;

                    turnPassed = true;
                }


                // Update du board
                io.emit("update", board);
                io.emit("updateSelectedPiece", selectedPiece);
                console.log("mouseClicked");

            }
        }
    });
});