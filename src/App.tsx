import { useState, useEffect, useRef } from 'react';

// --- Constants & Types ---
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 3;
const MIN_SPEED = 40;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const TRACKS = [
  { id: 1, title: 'STREAM_001.WAV', tag: 'NEURAL_MIX', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'SECTOR_7_ANOMALY.OGG', tag: 'SYNTH_CORE', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 3, title: 'RAW_NOISE_DATA.MP3', tag: 'AMBIENT_SYS', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';

const generateFood = (snakeBody: Point[]): Point => {
  let newFood: Point;
  let isOccupied = true;
  while (isOccupied) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    isOccupied = snakeBody.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
  }
  return newFood!;
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(12450);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const stateRef = useRef({ snake, direction, food, gameOver, isGameRunning, score, speed });
  useEffect(() => {
    stateRef.current = { snake, direction, food, gameOver, isGameRunning, score, speed };
  }, [snake, direction, food, gameOver, isGameRunning, score, speed]);

  const nextDirectionRef = useRef<Direction>(INITIAL_DIRECTION);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    nextDirectionRef.current = INITIAL_DIRECTION;
    if (score > highScore) setHighScore(score);
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const stopGame = () => {
    setIsGameRunning(false);
    setGameOver(true);
    if (stateRef.current.score > highScore) setHighScore(stateRef.current.score);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && (!stateRef.current.isGameRunning || stateRef.current.gameOver)) {
        startGame();
        return;
      }

      const currentDir = nextDirectionRef.current;
      if (e.key === 'ArrowUp' && currentDir !== 'DOWN') nextDirectionRef.current = 'UP';
      if (e.key === 'ArrowDown' && currentDir !== 'UP') nextDirectionRef.current = 'DOWN';
      if (e.key === 'ArrowLeft' && currentDir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
      if (e.key === 'ArrowRight' && currentDir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [highScore]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const gameLoop = setInterval(() => {
      const { snake: currentSnake, food: currentFood, gameOver: isOver } = stateRef.current;
      if (isOver) return;

      const head = currentSnake[0];
      const actualDirection = nextDirectionRef.current;
      setDirection(actualDirection);

      const newHead = { ...head };

      switch (actualDirection) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        stopGame();
        return;
      }

      if (currentSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        stopGame();
        return;
      }

      const newSnake = [newHead, ...currentSnake];

      if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
        setSpeed((s) => Math.max(MIN_SPEED, s - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    }, speed);

    return () => clearInterval(gameLoop);
  }, [isGameRunning, gameOver, speed, highScore]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true); 
  };

  const skipBack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true); 
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress(total ? (current / total) * 100 : 0);
    }
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => {
        console.error("Audio playback prevented:", e);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex]);

  const difficultyPercent = Math.max(5, Math.min(100, ((INITIAL_SPEED - speed) / (INITIAL_SPEED - MIN_SPEED)) * 100));

  return (
    <div className="crt min-h-screen h-[100vh] w-full flex flex-col p-4 bg-black font-sans uppercase tracking-[0.2em]">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 shrink-0 relative z-10">
        <div className="flex flex-col">
          <span className="text-[#f0f] text-xl font-bold mb-2">&gt; TERMINAL_ROOT // OVERRIDE</span>
          <h1 
            className="text-4xl sm:text-5xl font-display text-[#0ff] glitch uppercase" 
            data-text="GLITCH_SNAKE v0.9B"
          >
            GLITCH_SNAKE v0.9B
          </h1>
        </div>
        <div className="flex flex-col items-end mt-4 sm:mt-0">
          <p className="text-xl text-[#0ff]">STATUS: <span className="text-[#f0f] animate-pulse">ANOMALOUS</span></p>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-4 w-4 border-2 border-[#0ff] ${isPlaying ? 'bg-[#f0f] animate-ping' : 'bg-transparent'}`}></div>
            ))}
          </div>
        </div>
      </header>

      {/* CORE LAYOUT */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 min-h-0">
        
        {/* LEFT COLUMN: DIAGNOSTICS & AUDIO */}
        <div className="lg:col-span-4 flex flex-col gap-8 min-h-0">
          
          {/* STATS PANEL */}
          <div className="border-jarring p-6 bg-black flex flex-col justify-center relative">
            <div className="absolute top-0 right-0 bg-[#f0f] text-black px-2 py-1 text-sm font-bold">MEMORY_DUMP</div>
            <div className="text-[#0ff] text-2xl mb-2">&gt; BYTES_EXTRACTED</div>
            <div className="text-[#f0f] font-display text-4xl mb-4">{score.toString().padStart(4, '0')}</div>
            
            <div className="text-[#0ff] text-2xl mb-2">&gt; PEAK_OVERFLOW</div>
            <div className="text-[#0ff] font-display text-4xl">{highScore.toString().padStart(4, '0')}</div>
          </div>

          {/* AUDIO INJECTOR */}
          <div className="border-jarring-alt p-6 bg-black flex flex-col gap-4 overflow-hidden relative">
             <div className="absolute top-0 right-0 bg-[#0ff] text-black px-2 py-1 text-sm font-bold">AUDIO_INJECTOR</div>
             
             <div className="flex-1 space-y-4 overflow-y-auto mt-4">
              {TRACKS.map((track, i) => {
                const active = i === currentTrackIndex;
                return (
                  <button 
                    key={track.id} 
                    onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }}
                    className={`w-full flex flex-col p-3 border-2 transition-all text-left ${active ? 'border-[#f0f] bg-[#f0f]/10 translate-x-2' : 'border-[#0ff]/30 hover:border-[#0ff]'}`}
                  >
                    <p className={`text-xl font-bold truncate ${active ? 'text-[#f0f]' : 'text-[#0ff]'}`}>
                       {active ? '[ RUNNING ] ' : '[ WAITING ] '}{track.title}
                    </p>
                    <p className="text-sm text-[#0ff]/70 mt-1">TAG: {track.tag}</p>
                  </button>
                );
              })}
             </div>

             {/* DIAGNOSTIC BARS */}
             <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xl text-[#0ff] mb-2">
                    <span>AUDIO_BUFFER</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <div className="relative h-6 border-2 border-[#0ff] bg-black">
                     <input 
                       type="range" min="0" max="1" step="0.01" 
                       value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                     />
                     <div className="h-full bg-[#f0f] transition-all" style={{ width: `${volume * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xl text-[#0ff] mb-2">
                    <span>SYSTEM_LOAD</span>
                    <span className="text-[#f0f]">{Math.round(difficultyPercent)}%</span>
                  </div>
                  <div className="h-6 border-2 border-[#f0f] bg-black">
                     <div className="h-full bg-[#0ff] transition-all" style={{ width: `${difficultyPercent}%` }}></div>
                  </div>
                </div>
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MAIN EXECUTION THREAD (GAME) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center relative">
          
          <div className="border-jarring bg-black p-2 relative">
             <div className="absolute -top-4 -left-4 bg-[#f0f] text-black px-3 py-1 font-display text-xs z-20">EXECUTION_NODE</div>
             
             <div 
                className="relative bg-[#000] border-4 border-[#0ff] overflow-hidden"
                style={{ width: `${GRID_SIZE * 20}px`, height: `${GRID_SIZE * 20}px` }}
             >
                {/* Visual grid / static noise */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                ></div>

                {/* Grid Lines */}
                <div className="absolute inset-0 opacity-30"
                   style={{
                     backgroundImage: 'linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)',
                     backgroundSize: '20px 20px'
                   }}
                />

                {/* Target Food */}
                <div 
                  className="absolute animate-ping"
                  style={{ left: `${food.x * 20}px`, top: `${food.y * 20}px`, width: '20px', height: '20px', backgroundColor: '#f0f' }}
                />
                <div 
                  className="absolute"
                  style={{ left: `${food.x * 20 + 4}px`, top: `${food.y * 20 + 4}px`, width: '12px', height: '12px', backgroundColor: '#fff', border: '2px solid #f0f' }}
                />

                {/* Snake Entities */}
                {snake.map((segment, index) => {
                  const isHead = index === 0;
                  return (
                    <div
                      key={`${segment.x}-${segment.y}-${index}`}
                      className={`absolute ${isHead ? 'bg-[#0ff] border-2 border-[#fff] z-10' : 'bg-[#f0f] border border-[#0ff] opacity-90'}`}
                      style={{
                        left: `${segment.x * 20}px`,
                        top: `${segment.y * 20}px`,
                        width: '20px',
                        height: '20px',
                      }}
                    />
                  );
                })}

                {/* OVERLAYS */}
                {(!isGameRunning || gameOver) && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 p-4 border-8 border-transparent">
                    {gameOver && (
                      <h2 className="text-[#f0f] text-4xl sm:text-5xl font-display mb-8 text-center glitch" data-text="SYSTEM FAILURE">
                        SYSTEM FAILURE
                      </h2>
                    )}
                    
                    <button
                      onClick={startGame}
                      className="px-8 py-4 border-4 border-[#0ff] bg-black text-[#0ff] font-display hover:bg-[#0ff] hover:text-black hover:border-[#f0f] transition-all text-xl"
                    >
                      {gameOver ? 'REBOOT_SEQUENCE' : 'EXECUTE_PROTOCOL'}
                    </button>

                    {!isGameRunning && !gameOver && (
                      <p className="text-[#f0f] mt-8 text-xl animate-pulse">
                        &gt; AWAITING INPUT [SPACE]
                      </p>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>

      </main>

      {/* BOTTOM CONTROLS BOARD */}
      <footer className="mt-8 border-t-4 border-[#f0f] pt-4 flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10 flex-shrink-0">
         <div className="flex items-center gap-4 w-full sm:w-1/3">
            <div className="w-16 h-16 border-4 border-[#0ff] flex items-center justify-center bg-black overflow-hidden relative">
               <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjQiIGZpbGw9IiMwZmYiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')] ${isPlaying ? 'animate-[slide_1s_linear_infinite]' : ''}`} />
            </div>
            <div>
               <p className="text-[#f0f] text-2xl font-bold truncate max-w-[200px]">{TRACKS[currentTrackIndex].title}</p>
               <p className="text-[#0ff] text-sm">ACTIVE_THREAD</p>
            </div>
         </div>

         <div className="flex gap-4 items-center">
            <button onClick={skipBack} className="text-3xl text-[#0ff] hover:text-[#f0f] px-4 border-2 border-transparent hover:border-[#f0f] bg-black">[ &lt;&lt; ]</button>
            <button onClick={togglePlay} className="text-4xl text-black bg-[#0ff] hover:bg-[#f0f] px-6 py-2 border-4 border-[#f0f] font-bold">
               {isPlaying ? '[ || ]' : '[ &gt;  ]'}
            </button>
            <button onClick={skipForward} className="text-3xl text-[#0ff] hover:text-[#f0f] px-4 border-2 border-transparent hover:border-[#f0f] bg-black">[ &gt;&gt; ]</button>
         </div>

         <div className="flex-1 w-full flex items-center gap-4 text-xl">
            <span className="text-[#0ff] font-display text-sm">{formatTime(audioRef.current?.currentTime || 0)}</span>
            <div 
              className="flex-1 h-8 border-2 border-[#0ff] bg-black relative cursor-pointer"
              onClick={(e) => {
                 if (audioRef.current && audioRef.current.duration) {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const clickPos = (e.clientX - rect.left) / rect.width;
                   audioRef.current.currentTime = clickPos * audioRef.current.duration;
                 }
              }}
            >
               <div className="h-full bg-[#f0f] relative overflow-hidden" style={{ width: `${progress}%` }}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')] opacity-50" />
               </div>
               <span className="absolute inset-0 flex items-center justify-center mix-blend-difference text-white text-sm pointer-events-none">STREAMING_DATA</span>
            </div>
            <span className="text-[#0ff] font-display text-sm">{formatTime(audioRef.current?.duration || 0)}</span>
         </div>
         
         <audio 
            ref={audioRef} 
            src={TRACKS[currentTrackIndex].url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={skipForward}
            preload="metadata"
         />
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide {
          from { background-position: 0 0; }
          to { background-position: 4px 0; }
        }
      `}} />
    </div>
  );
}
