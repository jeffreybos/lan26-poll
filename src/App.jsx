// src/App.jsx
import { useState, useEffect, useRef } from 'react'
import { DEFAULT_GAMES } from './games'
import { MONTHS } from './dates'
import { usePoll } from './usePoll'
import './App.css'

// step: 'login' | 'availability' | 'vote' | 'results'

export default function App() {
  const [step, setStep]               = useState('login')
  const [name, setName]               = useState('')
  const [nameInput, setNameInput]     = useState('')
  const [selected, setSelected]       = useState(new Set())
  const [customInput, setCustomInput] = useState('')
  const [status, setStatus]           = useState(null)
  const [hasVoted, setHasVoted]       = useState(false)
  const [selectedDates, setSelectedDates] = useState(new Set())
  const [hasSavedDates, setHasSavedDates] = useState(false)
  const [showReset, setShowReset]         = useState(false)
  const konamiRef = useRef([])

  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

  useEffect(() => {
    const handleKey = (e) => {
      const seq = [...konamiRef.current, e.key].slice(-KONAMI.length)
      konamiRef.current = seq
      if (seq.join(',') === KONAMI.join(',') && name.toLowerCase() === 'jeffrey') {
        setShowReset(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [name])

  const {
    votes, customGames, loading, tally, totalVoters,
    availabilityTally, totalAvailability,
    submitVote, getExistingVote, addCustomGame,
    submitAvailability, getExistingAvailability,
    resetAll,
  } = usePoll()

  const showStatus = (msg, type) => {
    setStatus({ msg, type })
    setTimeout(() => setStatus(null), 4000)
  }

  const handleLogin = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setName(trimmed)
    const [prevVote, prevAvail] = await Promise.all([
      getExistingVote(trimmed),
      getExistingAvailability(trimmed),
    ])
    if (prevVote?.games) { setSelected(new Set(prevVote.games)); setHasVoted(true) }
    if (prevAvail?.dates) { setSelectedDates(new Set(prevAvail.dates)); setHasSavedDates(true) }
    setStep('availability')
  }

  const toggleDate = (date) => {
    setSelectedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  const toggleGame = (game) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(game) ? next.delete(game) : next.add(game)
      return next
    })
  }

  const handleSubmitAvailability = async () => {
    showStatus('Opslaan...', 'info')
    await submitAvailability(name, Array.from(selectedDates))
    setHasSavedDates(true)
    showStatus('✓ Beschikbaarheid opgeslagen!', 'success')
    setTimeout(() => setStep('vote'), 800)
  }

  const handleAddCustomGame = async () => {
    const trimmed = customInput.trim()
    if (!trimmed) return
    const allDefaultGames = DEFAULT_GAMES.flatMap(c => c.games)
    const allGames = [...allDefaultGames, ...customGames].map(g => g.toLowerCase())
    if (allGames.includes(trimmed.toLowerCase())) {
      showStatus('Game staat al in de lijst!', 'error')
      return
    }
    await addCustomGame(trimmed)
    setSelected(prev => new Set([...prev, trimmed]))
    setCustomInput('')
    showStatus(`✓ "${trimmed}" toegevoegd en geselecteerd!`, 'success')
  }

  const handleSubmitVote = async () => {
    if (!name || selected.size === 0) return
    showStatus('Opslaan...', 'info')
    await submitVote(name, Array.from(selected))
    setHasVoted(true)
    showStatus('✓ Stem opgeslagen!', 'success')
    setTimeout(() => setStep('results'), 800)
  }

  const handleReset = async () => {
    if (!confirm('Alle stemmen, beschikbaarheid én toegevoegde games verwijderen?')) return
    await resetAll()
    setSelected(new Set())
    setSelectedDates(new Set())
    setHasVoted(false)
    setHasSavedDates(false)
    setName('')
    setNameInput('')
    setShowReset(false)
    konamiRef.current = []
    setStep('login')
    showStatus('✓ Alles gereset', 'success')
  }

  const canSubmitDates = selectedDates.size > 0
  const canSubmit      = selected.size > 0

  return (
    <div className="container">
      {status && <div className={`status status--${status.type}`}>{status.msg}</div>}

      {/* ---- LOGIN ---- */}
      {step === 'login' && (
        <div className="login-screen">
          <div className="login-scanline" />
          <div className="login-header">
            <h1>👾 LAN '26 👾</h1>
            <div className="subtitle">OLD BUT GOLD EDITIE</div>
          </div>
          <div className="login-box">
            <div className="login-prompt">PLAYER LOGIN</div>
            <div className="login-field">
              <span className="login-cursor">&gt;</span>
              <input
                className="login-input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="ENTER YOUR NAME_"
                maxLength={30}
                autoFocus
              />
            </div>
            <button
              className="submit-btn"
              onClick={handleLogin}
              disabled={!nameInput.trim()}
            >
              ► PRESS START ◄
            </button>
          </div>
          <div className="login-footer">
            <span className="blink">INSERT COIN</span>
          </div>
        </div>
      )}

      {/* ---- AVAILABILITY ---- */}
      {step === 'availability' && (
        <div>
          <header>
            <h1>👾 LAN '26 👾</h1>
            <div className="subtitle">OLD BUT GOLD EDITIE</div>
          </header>

          <div className="step-bar">
            <div className="step-item step-item--done">1. LOGIN</div>
            <div className="step-sep">▶</div>
            <div className="step-item step-item--active">2. BESCHIKBAARHEID</div>
            <div className="step-sep">▶</div>
            <div className="step-item">3. STEMMEN</div>
          </div>

          <div className="player-tag">► {name}</div>

          {hasSavedDates && (
            <div className="voted-banner">✓ Beschikbaarheid al opgeslagen — pas aan of ga verder.</div>
          )}

          <div className="instruction" style={{ marginBottom: '1rem' }}>
            Op welke vrijdagen en zaterdagen kan jij? <span className="blink">_</span>
          </div>

          {MONTHS.map(month => (
            <div key={month.name} className="category">
              <div className="cat-title">{month.name}</div>
              <div className="games-grid">
                {month.dates.map(({ date, label }) => (
                  <div
                    key={date}
                    className={`game-card ${selectedDates.has(date) ? 'game-card--selected' : ''}`}
                    onClick={() => toggleDate(date)}
                  >
                    <div className={`checkbox ${selectedDates.has(date) ? 'checkbox--checked' : ''}`}>
                      {selectedDates.has(date) ? '✓' : ''}
                    </div>
                    <div className="game-name">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="nav-row">
            <button className="skip-btn" onClick={() => setStep('vote')}>
              overslaan →
            </button>
            <button
              className="submit-btn nav-submit"
              onClick={handleSubmitAvailability}
              disabled={!canSubmitDates}
            >
              ► Opslaan & verder ◄
            </button>
          </div>
        </div>
      )}

      {/* ---- VOTE ---- */}
      {step === 'vote' && (
        <div>
          <header>
            <h1>👾 LAN '26 👾</h1>
            <div className="subtitle">OLD BUT GOLD EDITIE</div>
          </header>

          <div className="step-bar">
            <div className="step-item step-item--done">1. LOGIN</div>
            <div className="step-sep">▶</div>
            <div className="step-item step-item--done">2. BESCHIKBAARHEID</div>
            <div className="step-sep">▶</div>
            <div className="step-item step-item--active">3. STEMMEN</div>
          </div>

          <div className="player-tag">► {name}</div>

          {hasVoted && (
            <div className="voted-banner">✓ Stem al opgeslagen — pas aan of bekijk de resultaten.</div>
          )}

          <div className="instruction" style={{ marginBottom: '1.2rem' }}>
            Stem op jouw favoriete games <span className="blink">_</span>
          </div>

          {DEFAULT_GAMES.map(cat => (
            <div key={cat.cat} className="category">
              <div className="cat-title">{cat.cat}</div>
              <div className="games-grid">
                {cat.games.map(game => (
                  <GameCard key={game} name={game} selected={selected.has(game)} onToggle={toggleGame} />
                ))}
              </div>
            </div>
          ))}

          {customGames.length > 0 && (
            <div className="category">
              <div className="cat-title">⭐ Toegevoegd door spelers</div>
              <div className="games-grid">
                {customGames.map(game => (
                  <GameCard key={game} name={game} selected={selected.has(game)} onToggle={toggleGame} isCustom />
                ))}
              </div>
            </div>
          )}

          <div className="category">
            <div className="cat-title">➕ Game niet in de lijst?</div>
            <div className="add-row">
              <input
                className="input add-input"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustomGame()}
                placeholder="Naam van de game..."
                maxLength={50}
              />
              <button className="add-btn" onClick={handleAddCustomGame} disabled={!customInput.trim()}>
                + Toevoegen
              </button>
            </div>
            <div className="add-hint">→ Wordt direct zichtbaar voor iedereen</div>
          </div>

          <div className="nav-row">
            <button className="skip-btn" onClick={() => setStep('availability')}>
              ← beschikbaarheid aanpassen
            </button>
            <button className="skip-btn" onClick={() => setStep('results')}>
              resultaten bekijken →
            </button>
            <button
              className="submit-btn nav-submit"
              onClick={handleSubmitVote}
              disabled={!canSubmit}
            >
              ► Stem opslaan ◄
            </button>
          </div>
        </div>
      )}

      {/* ---- RESULTS ---- */}
      {step === 'results' && (
        <div>
          <header>
            <h1>👾 LAN '26 👾</h1>
            <div className="subtitle">OLD BUT GOLD EDITIE</div>
          </header>

          <div className="results-header">
            <div className="results-title">📊 Games</div>
            <div className="results-meta">{totalVoters} stem{totalVoters !== 1 ? 'men' : ''}</div>
          </div>

          {loading && <div className="no-votes">Laden...</div>}

          {!loading && tally.length === 0 && (
            <div className="no-votes">Nog geen stemmen. Wees de eerste! 👾</div>
          )}

          {!loading && tally.length > 0 && (
            <>
              {tally.map(([game, count], i) => (
                <div key={game} className="result-row">
                  <div className="result-meta-row">
                    <span className="result-game">{game}</span>
                    <span className="result-count">{count}x</span>
                  </div>
                  <div className="bar-bg">
                    <div
                      className={`bar-fill ${i === 0 ? 'bar-fill--top' : ''}`}
                      style={{ width: `${(count / tally[0][1] * 100).toFixed(1)}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="votes-list">
                <div className="votes-list-title">► Alle stemmen:</div>
                {Object.values(votes).map(v => (
                  <div key={v.name} className="vote-entry">
                    <span className="vote-name">{v.name}</span> → {v.games?.join(', ')}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="results-header" style={{ marginTop: '2rem' }}>
            <div className="results-title">📅 Beschikbaarheid</div>
            <div className="results-meta">{totalAvailability} reactie{totalAvailability !== 1 ? 's' : ''}</div>
          </div>

          {!loading && availabilityTally.length === 0 && (
            <div className="no-votes">Nog niemand heeft beschikbaarheid opgegeven.</div>
          )}

          {!loading && availabilityTally.length > 0 && (
            availabilityTally.map(([date, { count, names }]) => {
              const allDates = MONTHS.flatMap(m => m.dates)
              const label = allDates.find(d => d.date === date)?.label ?? date
              return (
                <div key={date} className="result-row">
                  <div className="result-meta-row">
                    <span className="result-game">{label}</span>
                    <span className="result-count">{count}x</span>
                  </div>
                  <div className="bar-bg">
                    <div
                      className={`bar-fill ${date === availabilityTally[0][0] ? 'bar-fill--top' : ''}`}
                      style={{ width: `${(count / availabilityTally[0][1].count * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <div className="add-hint">→ {names.join(', ')}</div>
                </div>
              )
            })
          )}

          <div className="nav-row" style={{ marginTop: '2rem' }}>
            <button className="skip-btn" onClick={() => setStep('availability')}>
              ← beschikbaarheid aanpassen
            </button>
            <button className="skip-btn" onClick={() => setStep('vote')}>
              ← stem aanpassen
            </button>
          </div>

          {showReset && (
            <div className="admin">
              <button className="reset-btn" onClick={handleReset}>✕ Reset alles</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GameCard({ name, selected, onToggle, isCustom }) {
  return (
    <div
      className={`game-card ${selected ? 'game-card--selected' : ''} ${isCustom ? 'game-card--custom' : ''}`}
      onClick={() => onToggle(name)}
    >
      <div className={`checkbox ${selected ? 'checkbox--checked' : ''}`}>{selected ? '✓' : ''}</div>
      <div className="game-name">{name}</div>
      {isCustom && <span className="custom-badge">NEW</span>}
    </div>
  )
}
