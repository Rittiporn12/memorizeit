import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BsArrowLeft,
  BsPlayFill,
  BsPersonFill,
  BsVolumeMuteFill,
  BsVolumeUpFill,
  BsStars
} from 'react-icons/bs';
import './styles.css';

const APP_BASE = import.meta.env.BASE_URL || '/';
const assetPath = (path) => `${APP_BASE}${path.replace(/^\/+/, '')}`;
const PROJECT_OWNER_URL = 'https://github.com/Rittiporn12';

const COLORS = [
  { id: 'red', label: 'Red', sound: assetPath('memorizeit_1/sound/equip_runite_1.wav') },
  { id: 'green', label: 'Green', sound: assetPath('memorizeit_1/sound/equip_runite_2.wav') },
  { id: 'blue', label: 'Blue', sound: assetPath('memorizeit_1/sound/equip_runite_5.wav') },
  { id: 'yellow', label: 'Yellow', sound: assetPath('memorizeit_1/sound/equip_runite_4.wav') },
  { id: 'purple', label: 'Purple', sound: assetPath('memorizeit_1/sound/equip_runite_5.wav') },
  { id: 'brown', label: 'Brown', sound: assetPath('memorizeit_1/sound/equip_runite_2.wav') },
  { id: 'orange', label: 'Orange', sound: assetPath('memorizeit_1/sound/equip_runite_1.wav') }
];

const BASE_TILES = ['red', 'green', 'blue', 'yellow'];
const BONUS_TILES = ['purple', 'brown', 'orange'];
const MAX_LEVEL = 20;

const modeConfig = {
  memorize: {
    title: 'MEMORIZE',
    subtitle: 'Watch the color sequence and repeat it in the correct order.',
    music: assetPath('memorizeit_1/sound/music_easy.mp3'),
    loginBackground: assetPath('memorizeit_1/image/background.gif'),
    backgrounds: [
      assetPath('memorizeit_1/image/background_1.gif'),
      assetPath('memorizeit_1/image/background_2.gif'),
      assetPath('memorizeit_1/image/background_3.gif'),
      assetPath('memorizeit_1/image/background_4.gif')
    ],
    description: 'Remember the pattern and tap it back.',
    badge: 'Memory mode'
  },
  observation: {
    title: 'OBSERVATION',
    subtitle: 'Read the color word and tap the matching button.',
    music: assetPath('memorizeit_1/sound/music_hard.mp3'),
    loginBackground: assetPath('memorizeit_2/image/background.gif'),
    backgrounds: [
      assetPath('memorizeit_2/image/background_1.gif'),
      assetPath('memorizeit_2/image/background_2.gif'),
      assetPath('memorizeit_2/image/background_3.gif'),
      assetPath('memorizeit_2/image/background_4.gif')
    ],
    description: 'Stay focused and react to the right color.',
    badge: 'Focus mode'
  }
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackgroundForLevel(mode, level) {
  const backgrounds = modeConfig[mode].backgrounds;
  if (level < 6) return backgrounds[0];
  if (level < 11) return backgrounds[1];
  if (level < 16) return backgrounds[2];
  return backgrounds[3];
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function useAudio(notify) {
  const musicRef = useRef(null);
  const soundsRef = useRef(new Map());
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [musicSrc, setMusicSrc] = useState(assetPath('memorizeit_1/sound/music_login.mp3'));

  const getSound = useCallback((src, volume = 0.3) => {
    if (!soundsRef.current.has(src)) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      soundsRef.current.set(src, audio);
    }

    const audio = soundsRef.current.get(src);
    audio.volume = volume;
    return audio;
  }, []);

  const playSound = useCallback((src, volume = 0.3) => {
    const audio = getSound(src, volume);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [getSound]);

  const playMusic = useCallback(async () => {
    const audio = musicRef.current;
    if (!audio || !isMusicOn) return false;

    try {
      audio.volume = 0.08;
      audio.loop = true;
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }, [isMusicOn]);

  const unlockAudio = useCallback(() => {
    playMusic();
  }, [playMusic]);

  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [unlockAudio]);

  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.src = musicSrc;
    audio.load();
    if (isMusicOn) playMusic();
  }, [musicSrc, isMusicOn, playMusic]);

  const toggleMusic = useCallback(() => {
    const audio = musicRef.current;
    playSound(assetPath('memorizeit_1/sound/selectsound.mp3'), 0.25);

    if (!audio) return;

    if (isMusicOn) {
      audio.pause();
      setIsMusicOn(false);
      notify('Background music muted.', 'muted');
      return;
    }

    setIsMusicOn(true);
    setTimeout(async () => {
      const played = await playMusic();
      if (!played) notify('Tap once more to enable audio.', 'info');
    }, 0);
  }, [isMusicOn, notify, playMusic, playSound]);

  return {
    musicRef,
    isMusicOn,
    setMusicSrc,
    playMusic,
    playSound,
    toggleMusic
  };
}

function useNotifications() {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const notify = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, message, type }]);
    setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  const openDialog = useCallback((options) => {
    setDialog(options);
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  return { toasts, dialog, notify, openDialog, closeDialog };
}

function Toasts({ items }) {
  return (
    <div className="toast-wrap" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className={`toast toast-${item.type}`}>
          <span className="toast-dot" />
          <p>{item.message}</p>
        </div>
      ))}
    </div>
  );
}

function AppDialog({ dialog, onClose }) {
  if (!dialog) return null;

  const {
    title,
    message,
    confirmText = 'OK',
    cancelText,
    onConfirm,
    onCancel,
    locked = false
  } = dialog;

  const confirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={locked ? undefined : onClose}>
      <section className="dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-icon"><BsStars /></div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          {cancelText && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                onCancel?.();
                onClose();
              }}
            >
              {cancelText}
            </button>
          )}
          <button className="btn btn-primary" type="button" onClick={confirm}>{confirmText}</button>
        </div>
      </section>
    </div>
  );
}

function Landing({ selectedMode, setSelectedMode, username, setUsername, onStart, audio }) {
  const chooseMode = (mode) => {
    audio.playSound(assetPath('memorizeit_1/sound/selectsound.mp3'), 0.25);
    audio.setMusicSrc(modeConfig[mode].music);
    setSelectedMode(mode);
  };

  return (
    <main className="landing-shell">
      <section className="hero-card">
        <div className="logo-row brand-block">
          <img className="brand-logo" src={assetPath('memorizeit_1/image/logo.png')} alt="MemorizeIT logo" />
          <p className="hero-subtitle">Memory and focus mini game</p>
        </div>

        <div className="mode-section">
          <div className="section-heading">
            <span className="heading-badge">Step 1</span>
            <h2>Select Mode</h2>
            <p>Choose a game mode to begin.</p>
          </div>

          <div className="mode-list mode-grid">
            {Object.entries(modeConfig).map(([key, config]) => (
              <button
                key={key}
                type="button"
                className={`mode-card ${selectedMode === key ? 'is-selected' : ''}`}
                onClick={() => chooseMode(key)}
                aria-pressed={selectedMode === key}
              >
                <div className="mode-card-top">
                  <strong>{config.title}</strong>
                  {selectedMode === key && <span className="selected-chip">Selected</span>}
                </div>
                <span>{config.description}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="name-field">
          <span><BsPersonFill /> Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your name"
            autoComplete="nickname"
          />
        </label>

        <button className="btn btn-primary join-button" type="button" onClick={onStart}>
          <BsPlayFill /> Start Game
        </button>
      </section>
    </main>
  );
}

function GameHeader({ mode, level, username, status, onLeave }) {
  return (
    <header className="game-header">
      <button className="icon-btn" type="button" onClick={onLeave} aria-label="Back to menu">
        <BsArrowLeft />
      </button>
      <div>
        {username ? (
          <p className="player-line">Player: <strong>{username}</strong></p>
        ) : (
          <p>MemorizeIT</p>
        )}
        <h1>{level > 0 ? `Level ${level} / ${MAX_LEVEL}` : modeConfig[mode].title}</h1>
        <span>{status}</span>
      </div>
    </header>
  );
}

function TileButton({ color, active, disabled, onClick }) {
  const data = COLORS.find((item) => item.id === color);

  return (
    <button
      type="button"
      className={`tile tile-${color} ${active ? 'activated' : ''}`}
      disabled={disabled}
      onClick={() => onClick(color)}
      aria-label={data?.label || color}
    >
      <span>{data?.label || color}</span>
    </button>
  );
}

function ObservationDisplay({ value, textColor }) {
  return (
    <div className="observation-display" aria-live="polite">
      {value ? (
        <span className={`display-text text-${textColor}`}>{value}</span>
      ) : (
        <span className="display-placeholder">Watch here</span>
      )}
    </div>
  );
}

function CountdownOverlay({ value }) {
  if (value === null) return null;

  return (
    <div className="countdown-overlay" aria-live="assertive">
      <div className="countdown-card">
        <span className="countdown-label">Get ready</span>
        <strong className="countdown-value">{value}</strong>
      </div>
    </div>
  );
}

function GameBoard({ mode, username, onExit, audio, notify, openDialog }) {
  const [level, setLevel] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [humanSequence, setHumanSequence] = useState([]);
  const [status, setStatus] = useState('Ready to play');
  const [activeTile, setActiveTile] = useState(null);
  const [displayWord, setDisplayWord] = useState('');
  const [displayColor, setDisplayColor] = useState('blue');
  const [isHumanTurn, setIsHumanTurn] = useState(false);
  const [visibleTiles, setVisibleTiles] = useState(BASE_TILES);
  const [hiddenTiles, setHiddenTiles] = useState(BONUS_TILES);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const startRunRef = useRef(0);

  const resetState = useCallback(() => {
    startRunRef.current += 1;
    setLevel(0);
    setSequence([]);
    setHumanSequence([]);
    setStatus('Ready to play');
    setActiveTile(null);
    setDisplayWord('');
    setDisplayColor('blue');
    setIsHumanTurn(false);
    setVisibleTiles(BASE_TILES);
    setHiddenTiles(BONUS_TILES);
    setIsPlaying(false);
    setCountdown(null);
    setIsCountingDown(false);
  }, []);

  useEffect(() => {
    audio.setMusicSrc(modeConfig[mode].music);
    document.body.style.setProperty('--page-bg', `url(${getBackgroundForLevel(mode, Math.max(level, 1))})`);
  }, [audio, level, mode]);

  useEffect(() => {
    return () => {
      document.body.style.removeProperty('--page-bg');
    };
  }, []);

  const playTile = useCallback(async (color) => {
    const found = COLORS.find((item) => item.id === color);
    setActiveTile(color);
    if (found) audio.playSound(found.sound, 0.3);
    await wait(560);
    setActiveTile(null);
    await wait(260);
  }, [audio]);

  const showObservation = useCallback(async (color, currentLevel) => {
    audio.playSound(assetPath('memorizeit_1/sound/sound_font.mp3'), 0.45);
    const randomTextColor = currentLevel >= 11 ? pickRandom(visibleTiles) : color;
    setDisplayWord(color.toUpperCase());
    setDisplayColor(randomTextColor);
    await wait(430);
    setDisplayWord('');
    await wait(420);
  }, [audio, visibleTiles]);

  const showSequence = useCallback(async (nextSequence, currentLevel) => {
    setIsHumanTurn(false);
    setStatus('Watch carefully...');

    for (const color of nextSequence) {
      if (mode === 'memorize') {
        await playTile(color);
      } else {
        await showObservation(color, currentLevel);
      }
    }

    setHumanSequence([]);
    setIsHumanTurn(true);
    setStatus(`Your turn: ${nextSequence.length} tap${nextSequence.length > 1 ? 's' : ''}`);
  }, [mode, playTile, showObservation]);

  const nextRound = useCallback(async () => {
    setIsHumanTurn(false);
    setStatus('Preparing next level...');

    let nextLevelValue = level + 1;
    let tilesForRound = [...visibleTiles];
    let hiddenForRound = [...hiddenTiles];

    if (nextLevelValue === MAX_LEVEL + 1) {
      audio.playSound(assetPath('memorizeit_1/sound/sound_congrade.mp3'), 0.5);
      openDialog({
        title: 'Congratulations!',
        message: 'You cleared all 20 levels. Thanks for playing MemorizeIT.',
        confirmText: 'Play again',
        locked: true,
        onConfirm: () => {
          resetState();
        }
      });
      return;
    }

    if (nextLevelValue % 5 === 1 && nextLevelValue > 5 && hiddenForRound.length > 0) {
      const nextColor = pickRandom(hiddenForRound);
      hiddenForRound = hiddenForRound.filter((color) => color !== nextColor);
      tilesForRound = [...tilesForRound, nextColor];
      setVisibleTiles(tilesForRound);
      setHiddenTiles(hiddenForRound);
      audio.playSound(assetPath('memorizeit_1/sound/nextlevel.mp3'), 0.5);
      notify(`New color unlocked: ${nextColor.toUpperCase()}`, 'success');
      await wait(450);
    }

    const baseSequence = nextLevelValue % 10 === 1 ? [] : sequence;
    const nextSequence = [...baseSequence, pickRandom(tilesForRound)];

    setLevel(nextLevelValue);
    setSequence(nextSequence);
    setStatus('Waiting...');
    await wait(650);
    await showSequence(nextSequence, nextLevelValue);
  }, [audio, hiddenTiles, level, notify, openDialog, resetState, sequence, showSequence, visibleTiles]);

  const startGame = async () => {
    audio.playMusic();
    audio.playSound(assetPath('memorizeit_1/sound/selectsound.mp3'), 0.25);
    resetState();
    setIsPlaying(true);
    setIsCountingDown(true);

    const runId = startRunRef.current;

    for (const step of [3, 2, 1]) {
      setCountdown(step);
      setStatus(`Starting in ${step}...`);
      audio.playSound(assetPath('memorizeit_1/sound/selectsound.mp3'), 0.18);
      await wait(1000);
      if (runId !== startRunRef.current) return;
    }

    setCountdown('GO!');
    setStatus('Go!');
    audio.playSound(assetPath('memorizeit_1/sound/nextlevel.mp3'), 0.4);
    await wait(700);
    if (runId !== startRunRef.current) return;

    setCountdown(null);
    setStatus('Get ready...');
    await wait(1500);
    if (runId !== startRunRef.current) return;

    setIsCountingDown(false);
    notify('Game started.', 'info');

    const nextLevelValue = 1;
    const nextSequence = [pickRandom(BASE_TILES)];
    setLevel(nextLevelValue);
    setSequence(nextSequence);
    await showSequence(nextSequence, nextLevelValue);
  };

  const loseGame = useCallback(() => {
    audio.playSound(assetPath('memorizeit_1/sound/sound_error.mp3'), 0.55);
    openDialog({
      title: 'Round failed',
      message: 'That was not the correct answer. Do you want to try again?',
      confirmText: 'Play again',
      cancelText: 'Back to menu',
      onConfirm: () => {
        resetState();
      },
      onCancel: () => {
        resetState();
        onExit();
      }
    });
    resetState();
  }, [audio, onExit, openDialog, resetState]);

  const handleTileClick = async (color) => {
    if (!isPlaying || !isHumanTurn) return;

    const index = humanSequence.length;
    const nextHumanSequence = [...humanSequence, color];
    setHumanSequence(nextHumanSequence);

    const found = COLORS.find((item) => item.id === color);
    if (found) audio.playSound(found.sound, 0.32);

    if (sequence[index] !== color) {
      loseGame();
      return;
    }

    const remaining = sequence.length - nextHumanSequence.length;
    if (remaining === 0) {
      setIsHumanTurn(false);
      setStatus('Success!');
      notify('Correct! Next level coming...', 'success');
      await wait(850);
      nextRound();
      return;
    }

    setStatus(`Your turn: ${remaining} tap${remaining > 1 ? 's' : ''}`);
  };

  const askLeave = () => {
    openDialog({
      title: 'Leave this mode?',
      message: 'Your current progress in this round will be reset.',
      confirmText: 'Leave',
      cancelText: 'Stay',
      onConfirm: () => {
        resetState();
        onExit();
      }
    });
  };

  const boardDisabled = !isPlaying || !isHumanTurn || isCountingDown;

  return (
    <main className="game-shell">
      <section className={`game-card ${mode === 'observation' ? 'observation-card' : 'memorize-card'}`}>
        <CountdownOverlay value={countdown} />
        <GameHeader mode={mode} level={level} username={username} status={status} onLeave={askLeave} />

        <div className="mode-subtitle-row">
          <p className="mode-subtitle">{modeConfig[mode].subtitle}</p>
          <span className="mode-pill">{modeConfig[mode].badge}</span>
        </div>

        {mode === 'observation' && <ObservationDisplay value={displayWord} textColor={displayColor} />}

        <section className={`tile-grid tile-count-${visibleTiles.length}`} aria-label="Game color buttons">
          {visibleTiles.map((color) => (
            <TileButton
              key={color}
              color={color}
              active={activeTile === color}
              disabled={boardDisabled}
              onClick={handleTileClick}
            />
          ))}
        </section>

        <footer className="game-footer">
          {!isPlaying ? (
            <button className="btn btn-primary action-button" type="button" onClick={startGame}>
              <BsPlayFill /> Play game
            </button>
          ) : (
            <div className="progress-wrap" aria-label="Level progress">
              <span style={{ width: `${Math.min((level / MAX_LEVEL) * 100, 100)}%` }} />
            </div>
          )}
        </footer>
      </section>
    </main>
  );
}

function FloatingControls({ audio }) {
  return (
    <div className="floating-controls">
      <button className="round-control" type="button" onClick={audio.toggleMusic} aria-label="Toggle background music">
        {audio.isMusicOn ? <BsVolumeUpFill /> : <BsVolumeMuteFill />}
      </button>
    </div>
  );
}

function EmbeddedCredit() {
  return (
    <a
      className="embedded-credit"
      href={PROJECT_OWNER_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="MemorizeIT project credit: Rittiporn12 on GitHub"
      title="MemorizeIT by Rittiporn12"
    >
      Made by Rittiporn12
    </a>
  );
}

function App() {
  const { toasts, dialog, notify, openDialog, closeDialog } = useNotifications();
  const audio = useAudio(notify);
  const [screen, setScreen] = useState('landing');
  const [selectedMode, setSelectedMode] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const bg = selectedMode ? modeConfig[selectedMode].loginBackground : assetPath('memorizeit_1/image/background.gif');
    document.body.style.setProperty('--page-bg', `url(${bg})`);
  }, [selectedMode]);

  const startSelectedMode = () => {
    audio.playMusic();
    audio.playSound(assetPath('memorizeit_1/sound/selectsound.mp3'), 0.25);

    if (!selectedMode) {
      notify('Please choose a mode first.', 'warning');
      openDialog({
        title: 'Select a mode',
        message: 'Choose MEMORIZE or OBSERVATION before starting the game.',
        confirmText: 'OK'
      });
      return;
    }

    if (!username.trim()) {
      notify('Please enter your username.', 'warning');
      return;
    }

    notify(`Entering ${modeConfig[selectedMode].title} mode.`, 'success');
    setScreen('game');
  };

  const goLanding = () => {
    setScreen('landing');
  };

  const appClass = useMemo(() => `app ${screen === 'game' ? 'is-game' : 'is-landing'}`, [screen]);

  return (
    <div className={appClass}>
      <audio ref={audio.musicRef} preload="auto" />

      <div className="background-overlay" />

      {screen === 'landing' ? (
        <Landing
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          username={username}
          setUsername={setUsername}
          onStart={startSelectedMode}
          audio={audio}
        />
      ) : (
        <GameBoard
          mode={selectedMode || 'memorize'}
          username={username.trim()}
          onExit={goLanding}
          audio={audio}
          notify={notify}
          openDialog={openDialog}
        />
      )}

      <EmbeddedCredit />
      <FloatingControls audio={audio} />
      <Toasts items={toasts} />
      <AppDialog dialog={dialog} onClose={closeDialog} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
