// src/usePoll.js
import { useEffect, useState, useCallback } from 'react'
import { db } from './firebase'
import { ref, onValue, set, get, remove } from 'firebase/database'

export function usePoll() {
  const [votes, setVotes]               = useState({})   // { playerKey: { name, games, ts } }
  const [customGames, setCustomGames]   = useState([])
  const [availability, setAvailability] = useState({})   // { playerKey: { name, dates, ts } }
  const [loading, setLoading]           = useState(true)

  // Realtime listeners
  useEffect(() => {
    const votesRef        = ref(db, 'votes')
    const customRef       = ref(db, 'customGames')
    const availabilityRef = ref(db, 'availability')

    const unsubVotes        = onValue(votesRef,        snap => { setVotes(snap.val() || {}); setLoading(false) })
    const unsubCustom       = onValue(customRef,       snap => { setCustomGames(snap.val() || []) })
    const unsubAvailability = onValue(availabilityRef, snap => { setAvailability(snap.val() || {}) })

    return () => { unsubVotes(); unsubCustom(); unsubAvailability() }
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

  const submitAvailability = useCallback(async (name, selectedDates) => {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    await set(ref(db, `availability/${key}`), {
      name,
      dates: selectedDates,
      ts: Date.now(),
    })
  }, [])

  const getExistingAvailability = useCallback(async (name) => {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const snap = await get(ref(db, `availability/${key}`))
    return snap.val()
  }, [])

  const resetAll = useCallback(async () => {
    const [votesSnap, availSnap] = await Promise.all([
      get(ref(db, 'votes')),
      get(ref(db, 'availability')),
    ])
    const deletes = []
    votesSnap.forEach(child => deletes.push(remove(child.ref)))
    availSnap.forEach(child => deletes.push(remove(child.ref)))
    deletes.push(remove(ref(db, 'customGames')))
    await Promise.all(deletes)
  }, [])

  // Tally votes
  const tally = Object.values(votes).reduce((acc, { games }) => {
    games?.forEach(g => { acc[g] = (acc[g] || 0) + 1 })
    return acc
  }, {})

  const sortedTally = Object.entries(tally).sort((a, b) => b[1] - a[1])

  // Tally availability: { date -> { count, names[] } }, sorted by count desc
  const availabilityTally = Object.values(availability)
    .reduce((acc, { name, dates }) => {
      dates?.forEach(date => {
        if (!acc[date]) acc[date] = { count: 0, names: [] }
        acc[date].count++
        acc[date].names.push(name)
      })
      return acc
    }, {})

  const sortedAvailability = Object.entries(availabilityTally)
    .sort((a, b) => b[1].count - a[1].count)

  return {
    votes,
    customGames,
    availability,
    loading,
    tally: sortedTally,
    totalVoters: Object.keys(votes).length,
    availabilityTally: sortedAvailability,
    totalAvailability: Object.keys(availability).length,
    submitVote,
    getExistingVote,
    addCustomGame,
    submitAvailability,
    getExistingAvailability,
    resetAll,
  }
}
