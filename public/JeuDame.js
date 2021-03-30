let socket;

socket = io.connect('http://localhost:3000');

let selectedPiece = false;

let board = [];

for (let i = 0; i < 10; i++) {
    let collumn = []
    for (let j = 0; j < 10; j++) {
        collumn.push(false);
    }
    board.push(collumn);
}

let scores;

function setup() {
    createCanvas(750, 500);

    frameRate(30);
}

function draw() {
    background(50);

    // Drawing the Board
    let offset = true;
    for (let i = 0; i < 10; i++) {
        let color;
        if (offset) {
            color = 200;
            offset = false;
        } else {
            color = 100;
            offset = true;
        }

        for (let j = 0; j < 10; j++) {
            fill(color);
            rect(i * 50, j * 50, 50)
            if (color === 200) {
                color = 100;
            } else {
                color = 200;
            }
        }
    }

    // Drawing the pieces
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {

            if (board[i][j] !== false) {
                fill(board[i][j]);
                ellipse(i * 50 + 25, j * 50 + 25, 40);
            }
        }
    }

    // Drawing the selected piece
    if (selectedPiece !== false) {
        fill(255,125,0);
        rect(selectedPiece.i0*50,selectedPiece.j0*50,50);
    }


    // Drawing the ScoreBoard
    fill(255);
    textSize(25);
    text("Scores :", 505, 25);

    textSize(18);
    for (let i = 0; i < scores.length; i++) {
        text(scores[i][0] + " : " + scores[i][1], 505, 60 + 50*i);
    }
}

function resetBoard() {
    socket.emit('resetBoard');
}

function mouseClicked() {

    let mousePos = {
        x: mouseX,
        y: mouseY,
        userId:socket.id,
        color: 125
    }
    socket.emit('mouseClicked', mousePos);
}

socket.on('SuccessConnect',
    function (id) {
        console.log(id);
        document.getElementById('UserName').textContent = id;
    });


socket.on('chat message',
    function (msg) {
        let item = document.createElement('li');
        item.textContent = msg;
        messages.appendChild(item);
        window.scrollTo(0,document.body.scrollHeight);
    });



socket.on('update' ,(data) => {
    board = data;
    }
);

socket.on("updateSelectedPiece", (piece) => {
    selectedPiece = piece;
})

socket.on("updateScores", (data) => {
    scores = data;
})

