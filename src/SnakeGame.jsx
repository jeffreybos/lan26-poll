// src/SnakeGame.jsx
import { useState, useEffect, useRef, useCallback } from 'react'

const COLS = 20
const ROWS = 20
const TICK = 130

const randomFood = (snake) => {
  let pos
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
  } while (snake.some(s => s.x === pos.x && s.y === pos.y))
  return pos
}

const INIT_SNAKE = [{ x: 10, y: 10 }]
const INIT_FOOD  = { x: 5, y: 5 }
const INIT_DIR   = { x: 1, y: 0 }

export default function SnakeGame({ onClose }) {
  const [snake,   setSnake]   = useState(INIT_SNAKE)
  const [food,    setFood]    = useState(INIT_FOOD)
  const [score,   setScore]   = useState(0)
  const [alive,   setAlive]   = useState(false)
  const [started, setStarted] = useState(false)

  const snakeRef = useRef(INIT_SNAKE)
  const foodRef  = useRef(INIT_FOOD)
  const dirRef   = useRef(INIT_DIR)
  const nextDir  = useRef(INIT_DIR)

  const tick = useCallback(() => {
    dirRef.current = nextDir.current
    const dir   = dirRef.current
    const snake = snakeRef.current
    const head  = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
      setAlive(false)
      return
    }

    const ate       = head.x === foodRef.current.x && head.y === foodRef.current.y
    const newSnake  = ate ? [head, ...snake] : [head, ...snake.slice(0, -1)]
    snakeRef.current = newSnake
    setSnake([...newSnake])

    if (ate) {
      const f = randomFood(newSnake)
      foodRef.current = f
      setFood(f)
      setScore(s => s + 10)
    }
  }, [])

  useEffect(() => {
    if (!started || !alive) return
    const id = setInterval(tick, TICK)
    return () => clearInterval(id)
  }, [started, alive, tick])

  useEffect(() => {
    const handleKey = (e) => {
      const map = {
        ArrowUp:    { x: 0,  y: -1 },
        ArrowDown:  { x: 0,  y: 1  },
        ArrowLeft:  { x: -1, y: 0  },
        ArrowRight: { x: 1,  y: 0  },
      }
      if (!map[e.key]) return
      e.preventDefault()
      const next = map[e.key]
      const cur  = dirRef.current
      if (next.x === -cur.x && next.y === -cur.y) return
      nextDir.current = next
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const start = () => {
    const s = [{ x: 10, y: 10 }]
    const f = randomFood(s)
    snakeRef.current = s
    foodRef.current  = f
    dirRef.current   = INIT_DIR
    nextDir.current  = INIT_DIR
    setSnake(s)
    setFood(f)
    setScore(0)
    setAlive(true)
    setStarted(true)
  }

  const snakeSet = new Set(snake.map(s => `${s.x},${s.y}`))

  return (
    <div className="snake-overlay">
      <div className="snake-modal">
        <div className="snake-title">🐍 SNAKE 🐍</div>
        <div className="snake-subtitle">— KONAMI CODE UNLOCKED —</div>
        <div className="snake-score">SCORE: {score}</div>

        <div className="snake-grid">
          {Array.from({ length: ROWS }, (_, y) =>
            Array.from({ length: COLS }, (_, x) => {
              const key    = `${x},${y}`
              const isHead = snake[0]?.x === x && snake[0]?.y === y
              const isBody = !isHead && snakeSet.has(key)
              const isFood = food.x === x && food.y === y
              return (
                <div
                  key={key}
                  className={`snake-cell${isHead ? ' snake-head' : isBody ? ' snake-body' : isFood ? ' snake-food' : ''}`}
                />
              )
            })
          )}
        </div>

        {!started && <div className="snake-message">PRESS START TO PLAY</div>}
        {started && !alive && <div className="snake-message snake-gameover">GAME OVER</div>}

        <div className="snake-controls">
          {(!started || !alive) && (
            <button className="submit-btn" style={{ margin: 0 }} onClick={start}>
              {!started ? '► START ◄' : '► RESTART ◄'}
            </button>
          )}
          <button className="skip-btn" onClick={onClose}>← terug</button>
        </div>

        <div className="snake-hint">gebruik pijltjestoetsen</div>
      </div>
    </div>
  )
}
