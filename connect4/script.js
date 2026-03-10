// Variables to track the next empty row in each column. Row 1 is bottom cell.
let val_col1 = 1;
let val_col2 = 1;
let val_col3 = 1;
let val_col4 = 1;
let val_col5 = 1;
let val_col6 = 1;
let val_col7 = 1;

let turn = 1;           // Odd values are for red and even for yellow
let gameOver = false;

// Get HTML elements
const statusText = document.getElementById("status");
const gameOverBox = document.getElementById("game-over-box");

// Find all 'col' elements and loop through them
document.querySelectorAll(".col").forEach((col) => {
    // Event listener function runs when the mouse is over a column
    col.addEventListener("mouseover", () => {
        // Add 'highlight' class from CSS
            col.classList.add("highlight"); 
        });
        col.addEventListener("mouseout", () => {
            col.classList.remove("highlight");
        });

    // Event listener listens for a click on a column
    col.addEventListener("click", () => {
        if(gameOver) return;
        
        // Read the column number from 'data-col'
        const colNum = col.dataset.col;
        // Store the next available row number in that column
        let currentVal = eval(`val_col${colNum}`);

        // check if column is full
        if (currentVal > 6) return;

        // Player color is "red" if odd and "yellow" if the value is even
        const player = turn % 2 !== 0 ? "red" : "yellow";
        // Find cell to place the new piece
        const cell = document.getElementById(`col${colNum}row${currentVal}`);

        // Create new <div> element (game piece) in memory
        const piece = document.createElement("div");
        piece.classList.add("piece");                       // Add the CSS piece to the new div
        piece.style.backgroundColor = player;
        cell.appendChild(piece);                            // Place new piece inside chosen cell

        eval(`val_col${colNum}++`); // Increase row count

        if(check(player)) {
            gameOver = true;    // game is finished
            // Update text on page
            statusText.innerText = `${player.charAt(0).toUpperCase() + player.slice(1)} wins!`;
            gameOverBox.style.display = "block";
            return; // Game stops after a win
        }

        turn++;

        statusText.innerText = turn % 2 !== 0 ? "Turn: Red" : "Turn: Yellow";
    });
});

// Function to check whether a cell contains a piece of the given player color
function hasPlayerPiece(cellId, player) {
    const cell = document.getElementById(cellId);   
    return (
        // Check that the cell contains a game piece (child) AND the piece color must match the current player
        cell.children.length > 0 && cell.firstElementChild.style.backgroundColor === player
    );
}

// Function to check if either player has 4 in a row
function check(player) {
    // check for horizontal win
    for(let row = 1; row <= 6; row++) {
        for(let col = 1; col <= 4; col++) {
            // Check if 4 connected cells in the same row belong to the player
            if(
                hasPlayerPiece(`col${col}row${row}`, player) && 
                hasPlayerPiece(`col${col + 1}row${row}`, player) && 
                hasPlayerPiece(`col${col + 2}row${row}`, player) && 
                hasPlayerPiece(`col${col + 3}row${row}`, player)
            ) {
                return true; // win
            }
        }
    }

    // check for vertical win
    for(let col = 1; col <= 7; col++) {
        for(let row = 1; row <= 3; row++) {
            // Check for 4 stacked cells in the same column
            if(
                hasPlayerPiece(`col${col}row${row}`, player) && 
                hasPlayerPiece(`col${col}row${row + 1}`, player) && 
                hasPlayerPiece(`col${col}row${row + 2}`, player) && 
                hasPlayerPiece(`col${col}row${row + 3}`, player)
            ) {
                return true;
            }
        }
    }

    // check for bottom-left to top-right diagonal 
    for(let col = 1; col <= 4; col++) {
        for(let row = 1; row <= 3; row++) {
            if(
                hasPlayerPiece(`col${col}row${row}`, player) && 
                hasPlayerPiece(`col${col + 1}row${row + 1}`, player) && 
                hasPlayerPiece(`col${col + 2}row${row + 2}`, player) && 
                hasPlayerPiece(`col${col + 3}row${row + 3}`, player)
            ) {
                return true;
            }
        }
    }

    // check for top-left to bottom right diagonal
    for(let col = 1; col <= 4; col++) {
        for(let row = 4; row <= 6; row++) {
            if(
                hasPlayerPiece(`col${col}row${row}`, player) && 
                hasPlayerPiece(`col${col + 1}row${row - 1}`, player) && 
                hasPlayerPiece(`col${col + 2}row${row - 2}`, player) && 
                hasPlayerPiece(`col${col + 3}row${row - 3}`, player)
            ) {
                return true;
            }
        }
    }
    return false;
}