import { useEffect, useRef, useState } from "react";
import "./App.css";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };

function createCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function createFood(snake) {
  while (true) {
    const food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };

    const isOnSnake = snake.some(
      (part) => part.x === food.x && part.y === food.y,
    );

    if (!isOnSnake) return food;
  }
}

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(() => createFood(INITIAL_SNAKE));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const directionRef = useRef(INITIAL_DIRECTION);
  const nextDirectionRef = useRef(INITIAL_DIRECTION);

  function startGame() {
    setIsRunning(true);
    setIsGameOver(false);
  }

  function resetGame() {
    setSnake(INITIAL_SNAKE);
    setFood(createFood(INITIAL_SNAKE));
    setScore(0);
    setIsRunning(false);
    setIsGameOver(false);
    setShowCaptcha(false);
    setCaptchaInput("");
    setCaptchaError("");

    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
  }

  function openCaptcha() {
    setCaptchaCode(createCaptcha());
    setCaptchaInput("");
    setCaptchaError("");
    setShowCaptcha(true);
    setIsRunning(false);
  }

  function submitCaptcha(e) {
    e.preventDefault();

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError("Incorrect verification code. Try again.");
      return;
    }

    setShowCaptcha(false);
    setCaptchaInput("");
    setCaptchaError("");
    setIsRunning(true);
  }

  function changeDirection(newDirection) {
    const currentDirection = nextDirectionRef.current;

    const isOpposite =
      currentDirection.x + newDirection.x === 0 &&
      currentDirection.y + newDirection.y === 0;

    if (!isOpposite) {
      nextDirectionRef.current = newDirection;
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        changeDirection({ x: 0, y: -1 });
      }

      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        changeDirection({ x: 0, y: 1 });
      }

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        changeDirection({ x: -1, y: 0 });
      }

      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        changeDirection({ x: 1, y: 0 });
      }

      if (e.code === "Space" && !showCaptcha && !isGameOver) {
        setIsRunning((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCaptcha, isGameOver]);

  useEffect(() => {
    if (!isRunning || showCaptcha || isGameOver) return;

    const interval = setInterval(() => {
      setSnake((currentSnake) => {
        const direction = nextDirectionRef.current;
        directionRef.current = direction;

        const head = currentSnake[0];

        const newHead = {
          x: head.x + direction.x,
          y: head.y + direction.y,
        };

        const hitWall =
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE;

        const ateFood = newHead.x === food.x && newHead.y === food.y;

        // Kalau tidak makan, ekor akan pindah.
        // Jadi ekor tidak perlu dihitung sebagai tabrakan.
        const bodyToCheck = ateFood ? currentSnake : currentSnake.slice(0, -1);

        const hitSelf = bodyToCheck.some(
          (part) => part.x === newHead.x && part.y === newHead.y,
        );

        if (hitWall || hitSelf) {
          setIsGameOver(true);
          setIsRunning(false);
          setBestScore((prev) => Math.max(prev, score));
          return currentSnake;
        }

        const newSnake = ateFood
          ? [newHead, ...currentSnake]
          : [newHead, ...currentSnake.slice(0, -1)];

        if (ateFood) {
          setScore((prev) => prev + 1);
          setFood(createFood(newSnake));
          openCaptcha();
        }

        return newSnake;
      });
    }, 135);

    return () => clearInterval(interval);
  }, [isRunning, showCaptcha, isGameOver, food, score]);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge">Online Snake Game</div>
        <h1>
          Snake<span>.</span>
        </h1>
        <p>Classic snake game with secure human verification.</p>
      </section>

      <section className="game-layout">
        <div className="game-card">
          <div className="game-header">
            <div>
              <p className="eyebrow">Game Area</p>
              <h2>Snake Board</h2>
            </div>

            <div className="status">
              {isGameOver
                ? "Game Over"
                : showCaptcha
                  ? "Verification Required"
                  : isRunning
                    ? "Running"
                    : "Paused"}
            </div>
          </div>

          <div
            className="board"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);

              const isSnake = snake.some(
                (part) => part.x === x && part.y === y,
              );

              const isHead = snake[0].x === x && snake[0].y === y;
              const isFood = food.x === x && food.y === y;

              return (
                <div
                  key={index}
                  className={[
                    "cell",
                    isSnake ? "snake" : "",
                    isHead ? "head" : "",
                    isFood ? "food" : "",
                  ].join(" ")}
                />
              );
            })}
          </div>

          <div className="control-row">
            <button onClick={startGame} disabled={isRunning || showCaptcha}>
              Start
            </button>

            <button
              onClick={() => setIsRunning(false)}
              disabled={!isRunning || showCaptcha}
            >
              Pause
            </button>

            <button onClick={resetGame}>Restart</button>
          </div>
        </div>

        <aside className="side-card">
          <p className="eyebrow">Stats</p>
          <h2>Session</h2>

          <div className="stat-grid">
            <div className="stat-box">
              <span>Score</span>
              <strong>{score}</strong>
            </div>

            <div className="stat-box">
              <span>Best</span>
              <strong>{bestScore}</strong>
            </div>
          </div>

          <div className="info-box">
            <h3>Controls</h3>
            <p>
              Use Arrow Keys or WASD to move. Press Space to pause or continue.
            </p>
          </div>

          <div className="info-box">
            <h3>Verification</h3>
            <p>
              Every collected food requires a quick verification before the game
              can continue.
            </p>
          </div>
        </aside>
      </section>

      {isGameOver && (
        <div className="toast">
          Game over. Your final score is <strong>{score}</strong>.
        </div>
      )}

      {showCaptcha && (
        <div className="modal-backdrop">
          <form className="captcha-card" onSubmit={submitCaptcha}>
            <div className="modal-icon">🛡️</div>

            <h2>Human Verification</h2>

            <p>
              To continue the game, enter the verification code shown below.
            </p>

            <div className="captcha-code">
              {captchaCode.split("").map((char, index) => (
                <span key={index}>{char}</span>
              ))}
            </div>

            <input
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Enter code"
              autoFocus
            />

            {captchaError && (
              <div className="captcha-error">{captchaError}</div>
            )}

            <button type="submit">Verify & Continue</button>
          </form>
        </div>
      )}
    </main>
  );
}

export default App;
