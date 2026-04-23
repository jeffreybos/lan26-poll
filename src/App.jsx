// src/App.jsx
import { useState } from 'react'
import { DEFAULT_GAMES } from './games'
import { MONTHS } from './dates'
import { usePoll } from './usePoll'
import './App.css'

export default function App() {
  const [tab, setTab]                     = useState('vote')
  const [name, setName]                   = useState('')
  const [selected, setSelected]           = useState(new Set())
  const [customInput, setCustomInput]     = useState('')
  const [status, setStatus]               = useState(null) // { msg, type }
  const [hasVoted, setHasVoted]           = useState(false)
  const [selectedDates, setSelectedDates] = useState(new Set())
  const [hasSavedDates, setHasSavedDates] = useState(false)

  const {
    votes, customGames, loading, tally, totalVoters,
    availabilityTally, totalAvailability,
    submitVote, getExistingVote, addCustomGame,
    submitAvailability, getExistingAvailability,
    resetAll,
  } = usePoll()

  const allDefaultGames = DEFAULT_GAMES.flatMap(c => c.games)

  // Load previous vote + availability when name changes (on blur)
  const handleNameBlur = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const [prevVote, prevAvail] = await Promise.all([
      getExistingVote(trimmed),
      getExistingAvailability(trimmed),
    ])
    if (prevVote?.games) {
      setSelected(new Set(prevVote.games))
      setHasVoted(true)
    }
    if (prevAvail?.dates) {
      setSelectedDates(new Set(prevAvail.dates))
      setHasSavedDates(true)
    }
    if (prevVote?.games || prevAvail?.dates) {
      showStatus('► Vorige keuzes geladen — pas aan en sla opnieuw op', 'info')
    }
  }

  const toggleDate = (date) => {
    setSelectedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  const handleSubmitAvailability = async () => {
    const trimmed = name.trim()
    if (!trimmed || selectedDates.size === 0) return
    showStatus('Opslaan...', 'info')
    await submitAvailability(trimmed, Array.from(selectedDates))
    setHasSavedDates(true)
    showStatus('✓ Beschikbaarheid opgeslagen!', 'success')
  }

  const toggleGame = (game) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(game) ? next.delete(game) : next.add(game)
      return next
    })
  }

  const handleAddCustomGame = async () => {
    const trimmed = customInput.trim()
    if (!trimmed) return

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

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed || selected.size === 0) return
    showStatus('Opslaan...', 'info')
    await submitVote(trimmed, Array.from(selected))
    setHasVoted(true)
    showStatus('✓ Stem opgeslagen!', 'success')
  }

  const handleReset = async () => {
    if (!confirm('Alle stemmen, beschikbaarheid én toegevoegde games verwijderen?')) return
    await resetAll()
    setSelected(new Set())
    setSelectedDates(new Set())
    setHasVoted(false)
    setHasSavedDates(false)
    setName('')
    showStatus('✓ Alles gereset', 'success')
  }

  const showStatus = (msg, type) => {
    setStatus({ msg, type })
    setTimeout(() => setStatus(null), 4000)
  }

  const canSubmit        = name.trim() && selected.size > 0
  const canSubmitDates   = name.trim() && selectedDates.size > 0

  return (
    <div className="container">
      <header>
        <h1>👾 LAN '26 👾</h1>
        <div className="subtitle">OLD BUT GOLD EDITIE</div>
        <div className="instruction">Stem op jouw favoriete games <span className="blink">_</span></div>
      </header>

      <div className="tabs">
        <button className={`tab ${tab === 'vote' ? 'active' : ''}`} onClick={() => setTab('vote')}>► Stemmen</button>
        <button className={`tab ${tab === 'availability' ? 'active' : ''}`} onClick={() => setTab('availability')}>📅 Beschikbaarheid</button>
        <button className={`tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>📊 Resultaten</button>
      </div>

      {status && <div className={`status status--${status.type}`}>{status.msg}</div>}

      {/* ---- VOTE TAB ---- */}
      {tab === 'vote' && (
        <div>
          {hasVoted && (
            <div className="voted-banner">
              ✓ Stem opgeslagen! Je kunt altijd herzien en opnieuw opslaan.
            </div>
          )}

          <div className="field">
            <label className="label">► Jouw naam</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Player 1..."
              maxLength={30}
            />
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
            <div className="add-hint">→ Wordt direct zichtbaar voor iedereen en automatisch geselecteerd</div>
          </div>

          <button className="submit-btn" onClick={handleSubmit} disabled={!canSubmit}>
            ► Stem opslaan ◄
          </button>
        </div>
      )}

      {/* ---- AVAILABILITY TAB ---- */}
      {tab === 'availability' && (
        <div>
          {hasSavedDates && (
            <div className="voted-banner">
              ✓ Beschikbaarheid opgeslagen! Je kunt altijd herzien en opnieuw opslaan.
            </div>
          )}

          <div className="field">
            <label className="label">► Jouw naam</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Player 1..."
              maxLength={30}
            />
          </div>

          <div className="instruction" style={{ marginBottom: '1rem' }}>
            Klik op de vrijdagen waarop jij kan
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

          <button className="submit-btn" onClick={handleSubmitAvailability} disabled={!canSubmitDates}>
            ► Beschikbaarheid opslaan ◄
          </button>
        </div>
      )}

      {/* ---- RESULTS TAB ---- */}
      {tab === 'results' && (
        <div>
          <div className="results-header">
            <div className="results-title">📊 Live resultaten</div>
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
            <>
              {availabilityTally.map(([date, { count, names }]) => {
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
              })}
            </>
          )}

          <div className="admin">
            <button className="reset-btn" onClick={handleReset}>✕ Reset alles</button>
          </div>
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
