import './App.css';
import { useState, useEffect } from 'react';

const Grid = () => {
  const numRows = 100;
  const numColumns = 100;
  const [grid, setgrid] = useState(Array.from({ length: 100 }, () => new Array(100).fill(false)));

  useEffect(() => {
    getGrid();
  }, []);

  const BottomBarMenu = () => {
    const buttonHandler = async () => {
      await fetch('http://localhost:3001/update');
      console.log("fetched")
      getGrid();
    }

    return <div className='menu-container'>
      <button id="menuButton" className="menu-button">BACK 1x</button>
      <button id="menuButton" className="menu-button">START</button>
      <button id="menuButton" className="menu-button">PAUSE</button>
      <button id="menuButton" className="menu-button" onClick={() => buttonHandler()}>FORWARD 1x</button>
    </div>
  }

  const getGrid = async () => {
    let newGrid = Array.from({ length: 100 }, () => new Array(100).fill(false));
    fetch('http://localhost:3001/boardstate')
      .then(res => res.json())
      .then(data => {data.forEach(obj => {
        const { row, column, alive } = obj;
        if (row < newGrid.length && column < newGrid[row].length) {
          newGrid[row][column] = alive;
        }
      });})
      .then(data => setgrid(newGrid))
      .catch((err) => console.error("Error: ", err));
  }

  const clickHandler = async (row, col, buttonId) => {
    console.log("You clicked me!", row, col);
    let button = document.getElementById(buttonId);
    console.log(button.id)
    const newState = grid.map((row, rowIndex) => {
      return grid[rowIndex].map((square, index) => {
        if ('button-' + rowIndex + '-' + index === buttonId) {
          console.log(!grid[rowIndex][index])
          console.log(square)
          return !grid[rowIndex][index];
        } else {
          return square
        }
      })
    })
    setgrid(newState)

    let output = await fetch('http://localhost:3001/modify/' + row + '/' + col, {
            headers: {
              "Content-Type": "application/json",
            },
            method: "PUT",
            body: JSON.stringify({"alive": !grid[row][col]})
          }).then(res => res.json());
  }

  const mouseHovering = (row, col, buttonId) => {
    let button = document.getElementById(buttonId);
    if (grid[row][col] !== true) {
      button.style.backgroundColor = "#ff5852";
    }
  }

  const mouseLeaving = (row, col, buttonId) => {
    let button = document.getElementById(buttonId);
    if (grid[row][col] !== true) {
      button.style.backgroundColor = "#232a26";
    }
  }

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let button = document.getElementById('button-' + i + '-' + j);
      if (grid[i][j] === true) {
        button.style.backgroundColor = "#ffd45a";
      } else if (grid[i][j] === false) {
        if (button) {
          button.style.backgroundColor = "#232a26";

        }
      }
    }
  }

  const renderButtons = () => {
    const buttons = [];
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        const buttonId = 'button-' + row + '-' + col;
        buttons.push(
          <button key={buttonId} id={buttonId} clickedstate="false" className='grid-button' onClick={() => clickHandler(row, col, buttonId)} onMouseEnter={() => mouseHovering(row, col, buttonId)} onMouseLeave={() => mouseLeaving(row, col, buttonId)}>

          </button>
        )
      }
    }
    return buttons;
  }
  return <div>
    <div className="grid">{renderButtons()}</div>
    <BottomBarMenu/>
  </div>
}

export default Grid;