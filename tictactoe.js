(function() {
	var gameState = {
		board: undefined,
		gameOverCallbacks: []
	},
	/**
	 * Takes a move array e.g. [x, y] and returns it's 
	 * sequential index on the board.
	 * 
	 * @param  {Array} move 
	 * @return {Integer}
	 */
	moveToIndex = function(move) {
		var size = gameState.board.length;
		return move[0] * size + move[1];
	},
	/**
	 * Takes a sequential index from the game board
	 * and returns a move array e.g. [x, y]
	 * 
	 * Inverse of moveToIndex. 
	 * @param  {Integer} index 
	 * @return {Array} 
	 */
	indexToMove = function(index) {
		var size = gameState.board.length;
		return [Math.floor(index/size), index % size];
	},
	/**
	 * Retrieves an (2d) array of legal moves (e.g. [x, y])
	 *
	 * @param  {2d Array} board
	 * @return {2d Array}      
	 */
	availMoves = function(board) {
		var moves = [], i, j, size = board.length;
		for (i=0; i < size; i++) {
			for (j=0; j < size; j++) {
				if (board[i][j] === undefined) {
					moves.push([i, j]);
				}
			}
		}
		return moves;
	},
	/**
	 * Recursive method that dives through possible moves,
	 * implementing the minimax algorithm to determine the
	 * best possible move and score.
	 * 
	 * @param {Object} tree
	 * @param {2d Array}  tree.board 
	 * @param {Object} tree.children 
	 * @param {Integer} turn
	 * @param {2d Array} moves (optional)
	 * @param {Integer} alpha
	 * @param {Integer} beta 
	 * @return {Object}      
	 */
	genBoards = function(tree, turn, moves, alpha, beta) {
		if (!moves) moves = availMoves(tree.board);

		var i, 
			move, 
			movesLength = moves.length,
			bestMove,
			score = -turn * Infinity,
			gameOver = evalBoard(tree.board);

		if (gameOver) {
			moves = [];
			score = gameOver;
		}

		moves.every(function(move, i) {
			// need deep copies
			var newBoard = tree.board.map(function(val){return Array.prototype.slice.apply(val);}),
				reducedMoves = moves.slice(0, i).concat(moves.slice(i+1)),
				node = {};

			newBoard[move[0]][move[1]] = turn;

			tree.children[move] = node;
			node.children = {};
			node.board = newBoard;

			genBoards(node, -turn, reducedMoves, alpha, beta);

			if (~turn) {
				//maximizing
				if (node.score > score) {
					bestMove = move;
					score = node.score;
				}
				alpha = Math.max(alpha, score);
				if (alpha >= beta) {
					return false;
				}
			}
			else {
				//minimizing
				if (node.score < score) {
					bestMove = move;
					score = node.score;
				}
				beta = Math.min(beta, score);
				if (alpha >= beta) {
					return false;
				}
			}

			return true;
		});
		
		tree.score = isFinite(score) ? score : (evalBoard(tree.board) || 0);
		tree.bestMove = bestMove;
		return tree;
	},
	/**
	 * Greedily evaluates the game board, assuming legal positions
	 * 
	 * @return {Integer || false} Integer if someone wins, false otherwise.
	 */
	evalBoard = function(board) {
		var size = board.length,
			count, secondIndex, i, j;

		// check rows
		for (i = 0; i < size; i++) {
			count = 0;
			for (j = 0; j < size; j++) {
				count += board[i][j] || 0;
			}
			if (Math.abs(count) === 3) 
				return count;
		}

		// check columns
		for (i = 0; i < size; i++) {
			count = 0;
			for (j = 0; j < size; j++) {
				count += board[j][i] || 0;
			}
			if (Math.abs(count) === 3) 
				return count;
		}

		// check diagonals
		for (i = -1; i < 1; i++) {
			count = 0;
			for (j=0; j < size; j++) {
				secondIndex = Math.abs(j + ((size - 1) * i));
				count += board[j][secondIndex] || 0;
			}
			if (Math.abs(count) === 3) 
				return count;
		}

		return false;
	},
	/**
	 * Determines computer win (1) computer loss (-1) or draw (0)
	 * 
	 * @return {Integer} i ∈ {-1, 0, 1}
	 */
	gameOverState = function() {
		var winner = evalBoard(gameState.board);

		if (!winner) {
			return availMoves(gameState.board).length > 0 ? undefined : 0;
		}
		return winner > 0 ? 1 : -1;
	},

	/**
	 * Human interface to game. Allows the user to move.
	 * 
	 * @param  {Integer} index
	 * @return {void} 
	 */
	humanMoveAtIndex = function(index) {
		var move = indexToMove(index);

		gameState.board[move[0]][move[1]] = -1;
		checkGameOver();
	},

	/**
	 * Calls all of the gameOverCallbacks if the 
	 * game has ended
	 *  
	 * @return {void}
	 */
	checkGameOver = function() {
		var state = gameOverState();

		if (state !== undefined) {
			gameState.gameOverCallbacks.forEach(function(cb) {
				cb(state);
			});
		}
	},

	/**
	 * Computes the best move for the human player
	 * out of the goodness of the AI's heart.
	 * 
	 * @return {Integer} a sequential index
	 */
	hint = function() {
		var possible = genBoards({board: gameState.board, children: {}}, -1, null, -Infinity, Infinity),
			move = possible.bestMove;

		if (move) {
			return moveToIndex(move);
		}
	},

	/**
	 * Registers a callback to be run when the game
	 * ends. The state (0, 1, -1) is passed to each callback
	 * 
	 * @param  {Function} cb
	 * @return {void}
	 */
	registerGameOverCallback = function(cb) {
		gameState.gameOverCallbacks.push(cb);
	},
	/**
	 * Triggers a computer move. Returns the sequential index.
	 * 
	 * @return {Integer}
	 */
	computerMove = function() {
		var possible = genBoards({board: gameState.board, children: {}}, 1, null, -Infinity, Infinity),
			move = possible.bestMove;

		if (move) {
			gameState.board[move[0]][move[1]] = 1;
			checkGameOver();
			return moveToIndex(move);
		}
	},

	/**
	 * Resets the game board.
	 * @return {void}
	 */
	reset = function() {
		gameState.board = [Array(3), Array(3), Array(3)];
	};


// publicly exposed methods
tictactoe = {
	registerGameOverCallback: registerGameOverCallback,
	computerMove: computerMove,
	humanMoveAtIndex: humanMoveAtIndex,
	hint: hint,
	reset: reset
};

// initial board setup
reset();

})();