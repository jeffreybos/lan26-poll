// src/usePoll.js
import { useEffect, useState, useCallback } from 'react'
import { db } from './firebase'
import { ref, onValue, set, get, remove } from 'firebase/database'

export function usePoll() {
  const [votes, setVotes]           = useState({})   // { playerName: { games: [], ts: number } }
  const [customGames, setCustomGames] = useState([])
  const [loading, setLoading]       = useState(true)

  // Realtime listeners
  useEffect(() => {
    const votesRef  = ref(db, 'votes')
    const customRef = ref(db, 'customGames')

    const unsubVotes  = onValue(votesRef,  snap => { setVotes(snap.val() || {}); setLoading(false) })
    const unsubCustom = onValue(customRef, snap => { setCustomGames(snap.val() || []) })

    return () => { unsubVotes(); unsubCustom() }
  }, [])

  const submitVote = useCallback(async (name, selectedGames) => {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    await set(ref(db, `votes/${key}`), {
      name,
      games: selectedGames,
      ts: Date.now(),
    })
  }, [])

  const getExistingVote = useCallback(async (name) => {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const snap = await get(ref(db, `votes/${key}`))
    return snap.val()
  }, [])

  const addCustomGame = useCallback(async (gameName) => {
    const updated = [...customGames, gameName]
    await set(ref(db, 'customGames'), updated)
  }, [customGames])

  const resetAll = useCallback(async () => {
    await remove(ref(db, 'votes'))
    await remove(ref(db, 'customGames'))
  }, [])

  // Tally votes
  const tally = Object.values(votes).reduce((acc, { games }) => {
    games?.forEach(g => { acc[g] = (acc[g] || 0) + 1 })
    return acc
  }, {})

  const sortedTally = Object.entries(tally).sort((a, b) => b[1] - a[1])

  return {
    votes,
    customGames,
    loading,
    tally: sortedTally,
    totalVoters: Object.keys(votes).length,
    submitVote,
    getExistingVote,
    addCustomGame,
    resetAll,
  }
}
