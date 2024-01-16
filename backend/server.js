const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");
const lodash = require('lodash');
  
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb+srv://kf7fy92:E6KmVMWvvPxBvv0M@gamestate.qtkgobg.mongodb.net/?retryWrites=true&w=majority',
{
    useNewUrlParser: true,
    useUnifiedTopology: true
}) .then(() => console.log("Connected to Mongo"))
   .catch(console.error);

const Model = require("./Model.js");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting..."));
db.once("open", () => {
    console.log("Connected successfully");
});
// uncomment if performance problems
//mongoose.set('autoIndex', false);

const liveNeighbors = (index, board) => {
    let count = 0;
    if (index === 0) {
        count = board[index+1].alive == true ? count + 1 : count;
        count = board[index+100].alive == true ? count + 1 : count;
        count = board[index+101].alive == true ? count + 1 : count;
    } else if (index === 9900) {
        count = board[index-100].alive == true ? count + 1 : count;
        count = board[index-99].alive == true ? count + 1 : count;
        count = board[index+1].alive == true ? count + 1 : count;
    } else if (index === 99) {
        count = board[index-1].alive == true ? count + 1 : count;
        count = board[index+99].alive == true ? count + 1 : count;
        count = board[index+100].alive == true ? count + 1 : count;
    } else if (index === 9999) {
        count = board[index-1].alive == true ? count + 1 : count;
        count = board[index-100].alive == true ? count + 1 : count;
        count = board[index-101].alive == true ? count + 1 : count;
    } else if (index % 100 === 0) {
        count = board[index-100].alive == true ? count + 1 : count;
        count = board[index-99].alive == true ? count + 1 : count;
        count = board[index+1].alive == true ? count + 1 : count;
        count = board[index+100].alive == true ? count + 1 : count;
        count = board[index+101].alive == true ? count + 1 : count;
    } else if (index % 100 === 99) {
        count = board[index-100].alive == true ? count + 1 : count;
        count = board[index-101].alive == true ? count + 1 : count;
        count = board[index-1].alive == true ? count + 1 : count;
        count = board[index+99].alive == true ? count + 1 : count;
        count = board[index+100].alive == true ? count + 1 : count;
    } else if (index <= 99) {
        count = board[index-1].alive == true ? count + 1 : count;
        count = board[index+1].alive == true ? count + 1 : count;
        count = board[index+99].alive == true ? count + 1 : count;
        count = board[index+100].alive == true ? count + 1 : count;
        count = board[index+101].alive == true ? count + 1 : count;
    } else if (index >= 9900) {
        count = board[index-1].alive == true ? count + 1 : count;
        count = board[index+1].alive == true ? count + 1 : count;
        count = board[index-99].alive == true ? count + 1 : count;
        count = board[index-100].alive == true ? count + 1 : count;
        count = board[index-101].alive == true ? count + 1 : count;
    } else {
        count = board[index-1].alive == true ? count + 1 : count;
        count = board[index+1].alive == true ? count + 1 : count;
        count = board[index-99].alive == true ? count + 1 : count;
        count = board[index-100].alive == true ? count + 1 : count;
        count = board[index-101].alive == true ? count + 1 : count;
        count = board[index+99].alive == true ? count + 1 : count;
        count = board[index+100].alive == true ? count + 1 : count;
        count = board[index+101].alive == true ? count + 1 : count;
    }
    return count;
}

const updateBoardState = (board) => {
    const newBoard = lodash.cloneDeep(board);
    let differences = [];
    let liveness = [];
    for (let i = 0; i < board.length; i++) {
        liveness.push(liveNeighbors(i, board));
    }
    for (let j = 0; j < liveness.length; j++) {
        if (liveness[j] >= 2 && liveness[j] <= 3 && board[j].alive == true) {
            newBoard[j].alive = true;
        } else if (liveness[j] == 3) {
            newBoard[j].alive = true;
        } else {
            newBoard[j].alive = false;
        }
    }
    for (let i = 0; i < board.length; i++) {
        if (board[i].alive !== newBoard[i].alive) {
            differences.push(newBoard[i])
        }
    }
    return differences
}

app.post('/initialize', async (req, res) => {
    let states = [];
    let count = 0;
    for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
            const model = new Model({
                index: count,
                row: i,
                column: j,
                alive: false,
            });
            model.save();
            states.push(model);
            count++;
        }
    }
    res.json(states);
})

app.put('/modify/:row/:column', async (req, res) => {
    const updated = await Model.updateOne({row: req.params.row, column: req.params.column}, {alive: req.body.alive}, {new: true});
    res.json(updated);
})

app.get('/boardstate', async (req, res) => {
    const boardstate = await Model.find().sort('index');
    res.json(boardstate);
  })

app.get('/boardstate/:row/:column', async (req, res) => {
    const singleBoardState = await Model.find({row: req.params.row, column: req.params.column});
    res.json(singleBoardState);
})

app.get('/update', async (req, res) => {
    const boardstate = await Model.find().sort('index');
    let numb = updateBoardState(boardstate);
    let massUpdate = [];
    for (let i = 0; i < numb.length; i++) {
        const updateOperation = {
            updateOne: {
              filter: { row: numb[i].row, column: numb[i].column},
              update: { alive: numb[i].alive }
            }
        };
        massUpdate.push(updateOperation);
    }
    await Model.bulkWrite(massUpdate);
    res.json();
})
  
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);