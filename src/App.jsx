import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FaBed,
  FaCalendarAlt,
  FaChartBar,
  FaChartPie,
  FaDoorOpen,
  FaEnvelope,
  FaHome,
  FaMoneyBillWave,
  FaPhone,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaUserPlus,
  FaWhatsapp,
} from 'react-icons/fa'
import { storage, supabase } from './lib/supabase'
import './App.css'
import logo from '../images/logo.jpg'
import ch1 from '../images/ch1.jpg'
import ch2 from '../images/ch2.jpg'
import ch3 from '../images/ch3.jpg'
import ch4 from '../images/ch4.jpg'
import ch5 from '../images/ch5.jpg'
import ch7 from '../images/ch7.jpg'
import ch8 from '../images/ch8.jpg'
import ch9 from '../images/ch9.jpg'

const STORAGE_KEYS = {
  users: 'elixir_users',
  reservations: 'elixir_reservations',
  expenses: 'elixir_expenses',
  session: 'elixir_session',
}

const roomSlides = [
  { title: 'Chambre Deluxe', image: ch1 },
  { title: 'Suite vue jardin', image: ch2 },
  { title: 'Chambre familiale', image: ch3 },
  { title: 'Appartement design', image: ch4 },
  { title: 'Chambre élégante', image: ch5 },
  { title: 'Hébergement premium', image: ch7 },
  { title: 'Séjour moderne', image: ch8 },
  { title: 'Suite confortable', image: ch9 },
]

const initialRooms = [
  { id: '202', name: 'Chambre 202', color: 'sky', price: 120, isBooked: false, releasedAt: null },
  { id: '203', name: 'Chambre 203', color: 'amber', price: 150, isBooked: false, releasedAt: null },
  { id: '205', name: 'Chambre 205', color: 'rose', price: 180, isBooked: false, releasedAt: null },
  { id: 'A-01', name: 'Ange Raphaël', color: 'violet', price: 210, isBooked: false, releasedAt: null },
]

const initialReservations = []
const initialExpenses = []

const formatCurrency = (value) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(value)

const addDays = (dateString, days) => {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return date
}

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diff = end.getTime() - start.getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

const normalizeName = (name) => String(name ?? '').trim()
const readLocalUsers = () => storage.get(STORAGE_KEYS.users, [])
const readLocalReservations = () => storage.get(STORAGE_KEYS.reservations, [])
const readLocalExpenses = () => storage.get(STORAGE_KEYS.expenses, [])

function App() {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [activeTab, setActiveTab] = useState('Chambres')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [signupMessage, setSignupMessage] = useState('')
  const [rooms, setRooms] = useState(initialRooms)
  const [reservations, setReservations] = useState(initialReservations)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    motif: '',
    montant: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [authForm, setAuthForm] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  })
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    checkIn: '',
    checkOut: '',
    unitPrice: '',
  })
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [bookingError, setBookingError] = useState('')
  const [selectedReservationMonth, setSelectedReservationMonth] = useState('')

  useEffect(() => {
    const savedSession = storage.get(STORAGE_KEYS.session, null)
    if (savedSession?.name) {
      setIsLoggedIn(true)
      setActiveTab('Chambres')
    }

    const loadPersistedData = async () => {
      if (supabase) {
        try {
          const [{ data: reservationData }, { data: expenseData }] = await Promise.all([
            supabase.from('reservations').select('*').order('created_at', { ascending: false }),
            supabase.from('expenses').select('*').order('created_at', { ascending: false }),
          ])

          setReservations(reservationData ?? [])
          setExpenses(expenseData ?? [])
        } catch {
          setReservations(readLocalReservations())
          setExpenses(readLocalExpenses())
        }
      } else {
        setReservations(readLocalReservations())
        setExpenses(readLocalExpenses())
      }
    }

    loadPersistedData()
  }, [])

  useEffect(() => {
    if (supabase) {
      return
    }
    storage.set(STORAGE_KEYS.reservations, reservations)
  }, [reservations])

  useEffect(() => {
    if (supabase) {
      return
    }
    storage.set(STORAGE_KEYS.expenses, expenses)
  }, [expenses])

  useEffect(() => {
    const timer = setInterval(() => {
      setRooms((currentRooms) =>
        currentRooms.map((room) => {
          if (!room.isBooked || !room.releasedAt) return room
          const now = new Date()
          const releaseTime = new Date(room.releasedAt)
          if (now >= releaseTime) {
            return { ...room, isBooked: false, releasedAt: null }
          }
          return room
        }),
      )
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.montant || 0), 0),
    [expenses],
  )

  const reservationMonths = useMemo(() => {
    const year = new Date().getFullYear()
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(year, index, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      return {
        key,
        label: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date),
      }
    })
  }, [])

  useEffect(() => {
    if (reservationMonths.length === 0) {
      setSelectedReservationMonth('')
      return
    }

    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

    if (!selectedReservationMonth || !reservationMonths.some((month) => month.key === selectedReservationMonth)) {
      setSelectedReservationMonth(currentMonthKey)
    }
  }, [reservationMonths, selectedReservationMonth])

  const groupedReservations = useMemo(() => {
    const groups = {}

    reservations.forEach((reservation) => {
      const date = new Date(`${reservation.monthKey}-01T00:00:00`)
      const label = new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric',
      }).format(date)

      if (!groups[label]) {
        groups[label] = []
      }

      groups[label].push(reservation)
    })

    return Object.entries(groups)
  }, [reservations])

  const selectedMonthReservations = useMemo(() => {
    if (!selectedReservationMonth) return []
    return reservations.filter((reservation) => reservation.monthKey === selectedReservationMonth)
  }, [reservations, selectedReservationMonth])

  const monthlyTotals = useMemo(() => {
    const currentMonth = new Date()
    const monthLabels = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (6 - index), 1)
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date),
      }
    })

    const totals = monthLabels.map(({ key, label }) => ({
      key,
      label,
      value: reservations
        .filter((reservation) => reservation.monthKey === key)
        .reduce((sum, reservation) => sum + Number(reservation.total || 0), 0),
    }))

    return totals
  }, [reservations])

  const occupancyShare = useMemo(() => {
    const totalRooms = rooms.length || 1
    const bookedCount = rooms.filter((room) => room.isBooked).length
    const freeCount = totalRooms - bookedCount

    return [
      { name: 'Libre', value: Math.round((freeCount / totalRooms) * 100), color: '#9dd9d2' },
      { name: 'Réservée', value: Math.round((bookedCount / totalRooms) * 100), color: '#f4b664' },
    ]
  }, [rooms])

  const openAuth = (mode) => {
    setAuthMode(mode)
    setShowAuth(true)
    setLoginError('')
    setSignupMessage('')
  }

  const handleAuthChange = (event) => {
    const { name, value } = event.target
    setAuthForm((current) => ({ ...current, [name]: value }))
  }

  const persistSession = (userName) => {
    storage.set(STORAGE_KEYS.session, { name: userName })
    setIsLoggedIn(true)
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    if (!authForm.name || !authForm.password) {
      setLoginError('Veuillez saisir votre nom et votre mot de passe.')
      return
    }

    const trimmedName = normalizeName(authForm.name)

    const users = readLocalUsers()
    const validLogin = users.find(
      (user) => user.name.toLowerCase() === trimmedName.toLowerCase() && user.password === authForm.password,
    )

    if (!validLogin) {
      setLoginError('Identifiants incorrects. Vérifiez votre nom et votre mot de passe.')
      return
    }

    persistSession(validLogin.name)
    setLoginError('')
    setShowAuth(false)
    setActiveTab('Chambres')
    setAuthForm({ name: '', password: '', confirmPassword: '' })
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()

    if (!authForm.name || !authForm.password) {
      setSignupMessage('Veuillez remplir tous les champs.')
      return
    }

    if (authForm.password !== authForm.confirmPassword) {
      setSignupMessage('Les mots de passe ne correspondent pas.')
      return
    }

    const trimmedName = normalizeName(authForm.name)

    const users = readLocalUsers()
    const duplicateUser = users.some(
      (user) => user.name.toLowerCase() === trimmedName.toLowerCase(),
    )

    if (duplicateUser) {
      setSignupMessage('Ce nom est déjà utilisé. Choisissez un autre nom.')
      return
    }

    users.push({ name: trimmedName, password: authForm.password })
    storage.set(STORAGE_KEYS.users, users)
    setSignupMessage('Inscription confirmée. Vous pouvez maintenant vous connecter.')
    setAuthMode('login')
    setAuthForm({ name: '', password: '', confirmPassword: '' })
  }

  const handleBookingChange = (event) => {
    const { name, value } = event.target
    setBookingForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmitBooking = (event) => {
    event.preventDefault()

    if (!bookingForm.roomId || !bookingForm.checkIn || !bookingForm.checkOut || !bookingForm.unitPrice) {
      setBookingError('Veuillez remplir tous les champs du formulaire.')
      return
    }

    const room = rooms.find((item) => item.id === bookingForm.roomId)
    if (!room) {
      setBookingError('Cette chambre est introuvable.')
      return
    }

    if (room.isBooked) {
      setBookingError('Cette chambre est déjà réservée ou en attente de libération.')
      return
    }

    const nights = calculateNights(bookingForm.checkIn, bookingForm.checkOut)
    const total = nights * Number(bookingForm.unitPrice)
    const releaseDate = addDays(bookingForm.checkIn, 1)
    const releaseAt = new Date(releaseDate)
    releaseAt.setHours(12, 0, 0, 0)

    const newReservation = {
      id: Date.now(),
      roomId: room.id,
      roomName: room.name,
      guest: 'Client Elixir',
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      unitPrice: Number(bookingForm.unitPrice),
      total,
      monthKey: new Date(bookingForm.checkIn).toISOString().slice(0, 7),
    }

    const nextReservations = [newReservation, ...reservations]
    setReservations(nextReservations)
    if (supabase) {
      supabase.from('reservations').insert({
        room_id: room.id,
        room_name: room.name,
        guest_name: 'Client Elixir',
        check_in: bookingForm.checkIn,
        check_out: bookingForm.checkOut,
        unit_price: Number(bookingForm.unitPrice),
        total,
        month_key: new Date(bookingForm.checkIn).toISOString().slice(0, 7),
      })
    } else {
      storage.set(STORAGE_KEYS.reservations, nextReservations)
    }

    setRooms((current) =>
      current.map((item) =>
        item.id === room.id ? { ...item, isBooked: true, releasedAt: releaseAt.toISOString() } : item,
      ),
    )
    setBookingForm({ roomId: '', checkIn: '', checkOut: '', unitPrice: '' })
    setSelectedRoomId(null)
    setBookingError('')
    setActiveTab('Réservations')
  }

  const handleCancelReservation = async (reservationId) => {
    const reservation = reservations.find((item) => item.id === reservationId)
    if (!reservation) return

    const nextReservations = reservations.filter((item) => item.id !== reservationId)
    setReservations(nextReservations)
    if (supabase) {
      await supabase.from('reservations').delete().eq('room_id', reservation.roomId).eq('check_in', reservation.checkIn)
    } else {
      storage.set(STORAGE_KEYS.reservations, nextReservations)
    }

    setRooms((current) =>
      current.map((room) =>
        room.id === reservation.roomId ? { ...room, isBooked: false, releasedAt: null } : room,
      ),
    )
  }

  const handleExpenseSubmit = async (event) => {
    event.preventDefault()

    if (!expenseForm.motif || !expenseForm.montant || !expenseForm.date) {
      return
    }

    const newExpense = {
      id: Date.now(),
      motif: expenseForm.motif,
      montant: Number(expenseForm.montant),
      date: expenseForm.date,
    }

    const nextExpenses = [newExpense, ...expenses]
    setExpenses(nextExpenses)
    if (supabase) {
      await supabase.from('expenses').insert({
        motif: expenseForm.motif,
        montant: Number(expenseForm.montant),
        date: expenseForm.date,
      })
    } else {
      storage.set(STORAGE_KEYS.expenses, nextExpenses)
    }

    setExpenseForm({ motif: '', montant: '', date: new Date().toISOString().slice(0, 10) })
    setShowExpenseForm(false)
  }

  const renderDashboardContent = () => {
    if (activeTab === 'Chambres') {
      return (
        <div className="room-grid">
          {rooms.map((room) => {
            const selected = selectedRoomId === room.id
            const isBlocked = room.isBooked

            return (
              <div key={room.id} className="room-card-wrapper">
                <motion.button
                  type="button"
                  whileHover={!isBlocked ? { y: -4 } : undefined}
                  disabled={isBlocked}
                  className={`room-card ${room.color} ${isBlocked ? 'blocked' : ''}`}
                  onClick={() => {
                    if (isBlocked) return
                    setSelectedRoomId(room.id)
                    setBookingForm((current) => ({
                      ...current,
                      roomId: room.id,
                      unitPrice: String(room.price),
                    }))
                    setBookingError('')
                  }}
                >
                  <div className="room-badge">
                    <FaBed />
                  </div>
                  <div className="room-card-header">
                    <span className="room-tag">{room.id}</span>
                    <span className={`status-pill ${isBlocked ? 'occupied' : 'free'}`}>
                      {isBlocked ? 'Réservée' : 'Libre'}
                    </span>
                  </div>
                  <h3>{room.name}</h3>
                  <p>{formatCurrency(room.price)}/nuit</p>
                </motion.button>

                <AnimatePresence>
                  {selected && (
                    <motion.form
                      initial={{ opacity: 0, height: 0, y: -12 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                      className="booking-form"
                      onSubmit={handleSubmitBooking}
                    >
                      <div className="form-row">
                        <label>
                          Date d’entrée
                          <input
                            type="date"
                            name="checkIn"
                            min={new Date().toISOString().split('T')[0]}
                            value={bookingForm.checkIn}
                            onChange={handleBookingChange}
                          />
                        </label>
                        <label>
                          Date de sortie
                          <input
                            type="date"
                            name="checkOut"
                            min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                            value={bookingForm.checkOut}
                            onChange={handleBookingChange}
                          />
                        </label>
                      </div>

                      <div className="form-row price-row">
                        <label>
                          Prix unitaire
                          <input
                            type="number"
                            name="unitPrice"
                            value={bookingForm.unitPrice}
                            placeholder={String(room.price)}
                            onChange={handleBookingChange}
                          />
                        </label>
                        <div className="total-box">
                          <span>Total estimé</span>
                          <strong>
                            {bookingForm.checkIn && bookingForm.checkOut && bookingForm.unitPrice
                              ? formatCurrency(
                                  calculateNights(bookingForm.checkIn, bookingForm.checkOut) *
                                    Number(bookingForm.unitPrice),
                                )
                              : '0'}
                          </strong>
                        </div>
                      </div>

                      <div className="booking-actions">
                        <button type="submit" className="primary-btn">
                          Valider
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => {
                            setSelectedRoomId(null)
                            setBookingForm({ roomId: '', checkIn: '', checkOut: '', unitPrice: '' })
                            setBookingError('')
                          }}
                        >
                          Annuler
                        </button>
                      </div>

                      {bookingError && <p className="form-alert">{bookingError}</p>}
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )
    }

    if (activeTab === 'Réservations') {
      return (
        <div className="reservation-panel">
          <div className="month-filter-row">
            {reservationMonths.map((month) => (
              <button
                key={month.key}
                type="button"
                className={selectedReservationMonth === month.key ? 'month-filter active' : 'month-filter'}
                onClick={() => setSelectedReservationMonth(month.key)}
              >
                {month.label.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="month-block">
            <h3>
              {reservationMonths.find((month) => month.key === selectedReservationMonth)?.label || 'Réservations'}
            </h3>
            <div className="reservation-list">
              {selectedMonthReservations.length === 0 ? (
                <div className="empty-state">Aucune réservation pour ce mois.</div>
              ) : (
                selectedMonthReservations.map((reservation) => (
                  <div key={reservation.id} className="reservation-item">
                    <div>
                      <span className="reservation-room">{reservation.roomName}</span>
                      <h4>{reservation.guest}</h4>
                      <p>
                        {reservation.checkIn} → {reservation.checkOut}
                      </p>
                      <p>
                        {formatCurrency(reservation.unitPrice)} / nuit · {formatCurrency(reservation.total)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => handleCancelReservation(reservation.id)}
                    >
                      Annuler
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'Dépenses') {
      return (
        <div className="expenses-panel">
          <div className="section-header">
            <h3>Dépenses</h3>
            <button type="button" className="primary-btn" onClick={() => setShowExpenseForm(true)}>
              Ajouter une dépense
            </button>
          </div>

          {showExpenseForm && (
            <form className="expense-form" onSubmit={handleExpenseSubmit}>
              <label>
                Motif
                <input
                  type="text"
                  value={expenseForm.motif}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, motif: event.target.value }))
                  }
                />
              </label>
              <label>
                Montant
                <input
                  type="number"
                  value={expenseForm.montant}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, montant: event.target.value }))
                  }
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </label>
              <div className="booking-actions">
                <button type="submit" className="primary-btn">
                  Ajouter
                </button>
                <button type="button" className="ghost-btn" onClick={() => setShowExpenseForm(false)}>
                  Fermer
                </button>
              </div>
            </form>
          )}

          <div className="expense-summary">
            <div className="summary-card">
              <span>Total des dépenses</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>
          </div>

          <div className="expense-list">
            {expenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div>
                  <h4>{expense.motif}</h4>
                  <p>{expense.date}</p>
                </div>
                <strong>{formatCurrency(expense.montant)}</strong>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (activeTab === 'Analyse et performances') {
      return (
        <div className="analytics-panel">
          <div className="analytics-grid">
            <div className="chart-card large">
              <h3>Répartition des chambres</h3>
              <div className="donut-container">
                <div
                  className="donut-chart"
                  style={{
                    background: `conic-gradient(${occupancyShare[0].color} 0 ${occupancyShare[0].value}%, ${occupancyShare[1].color} ${occupancyShare[0].value}% 100%)`,
                  }}
                >
                  <div className="donut-inner">
                    <strong>{Math.max(occupancyShare[1].value, 0)}%</strong>
                    <span>Occupation</span>
                  </div>
                </div>
              </div>
              <div className="legend">
                {occupancyShare.map((item) => (
                  <div key={item.name} className="legend-item">
                    <span className="dot" style={{ background: item.color }}></span>
                    <span>{item.name}</span>
                    <strong>{item.value}%</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h3>Variation mensuelle</h3>
              <div className="bar-chart">
                {monthlyTotals.map(({ key, label, value }) => (
                  <div key={key} className="bar-column">
                    <div
                      className="bar"
                      style={{ height: `${Math.max(8, (value / Math.max(...monthlyTotals.map((item) => item.value), 1)) * 100)}%` }}
                    ></div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const dashboardTabs = ['Chambres', 'Réservations', 'Dépenses', 'Analyse et performances']

  return (
    <div className="app-shell">
      {!isLoggedIn ? (
        <>
          <header className="landing-header">
            <div className="brand-block">
              <div className="logo-badge">
                <img src={logo} alt="Elixir Homes logo" />
              </div>
              <div className="brand-copy">
                <span>Elixir Homes</span>
              </div>
            </div>

            <div className="header-actions">
              <button type="button" className="login-link" onClick={() => openAuth('login')}>
                <FaSignInAlt /> Se connecter
              </button>
              <button type="button" className="register-link" onClick={() => openAuth('signup')}>
                <FaUserPlus /> S&apos;inscrire
              </button>
            </div>
          </header>

          <main className="landing-page">
            <div className="hero-panel">
              <div className="hero-logo-watermark">EH</div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="hero-copy"
              >
                <span className="eyebrow">Hébergement premium</span>
                <h1>BIENVENU A ELIXIR HOMES</h1>
                <p>
                  Des séjours calmes, élégants et confortables pour les voyageurs qui recherchent plus
                  qu’une simple chambre : une expérience chaleureuse, inspirante et parfaitement gérée.
                </p>
              </motion.div>
            </div>

            <section className="slider-section">
              <div className="slider-track">
                {[...roomSlides, ...roomSlides].map((slide, index) => (
                  <motion.div
                    key={`${slide.title}-${index}`}
                    className="slide-item"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
                  >
                    <img src={slide.image} alt={slide.title} />
                    <div className="slide-caption">{slide.title}</div>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="info-grid">
              <div className="info-card">
                <FaDoorOpen />
                <h3>Confort de séjour</h3>
                <p>
                  Chaque chambre est pensée pour offrir un cadre apaisant, lumineux et premium ideal pour
                  les clients qui recherchent un séjour agréable.
                </p>
              </div>
              <div className="info-card">
                <FaCalendarAlt />
                <h3>Réservation fluide</h3>
                <p>
                  Gère vos réservations, calcule les montants automatiquement et optimises la rotation des
                  chambres sans effort.
                </p>
              </div>
              <div className="info-card">
                <FaChartBar />
                <h3>Performance claire</h3>
                <p>
                  Analysez les tendances, suivez les dépenses et visualisez la performance du logement grâce à
                  des tableaux simples et lisibles.
                </p>
              </div>
            </section>

            <footer className="contact-footer">
              <div>
                <h4>Nous contacter</h4>
                <p>Contact rapide et bienveillant pour votre séjour ou votre gestion.</p>
              </div>
              <div className="contact-links">
                <a href="https://wa.me/23767103608" target="_blank" rel="noreferrer">
                  <FaWhatsapp /> +237 671 036 08
                </a>
                <a href="mailto:belamninon@gmail.com">
                  <FaEnvelope /> belamninon@gmail.com
                </a>
                <a href="tel:+237658294373">
                  <FaPhone /> 658 294 373
                </a>
              </div>
            </footer>
          </main>

          <AnimatePresence>
            {showAuth && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="modal-backdrop"
                onClick={() => setShowAuth(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="auth-modal"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button type="button" className="close-btn" onClick={() => setShowAuth(false)}>
                    <FaTimes />
                  </button>

                  <div className="auth-header">
                    <div className="logo-badge small">
                      <img src={logo} alt="Elixir Homes logo" />
                    </div>
                    <h2>{authMode === 'login' ? 'Se connecter' : 'S’inscrire'}</h2>
                  </div>

                  {authMode === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="auth-form">
                      <label>
                        Nom
                        <input
                          type="text"
                          name="name"
                          value={authForm.name}
                          onChange={handleAuthChange}
                          placeholder="Votre nom"
                        />
                      </label>
                      <label>
                        Mot de passe
                        <input
                          type="password"
                          name="password"
                          value={authForm.password}
                          onChange={handleAuthChange}
                          placeholder="••••••••"
                        />
                      </label>
                      <button type="submit" className="primary-btn full-width">
                        Se connecter
                      </button>
                      {loginError && <p className="form-alert">{loginError}</p>}
                    </form>
                  ) : (
                    <form onSubmit={handleSignupSubmit} className="auth-form">
                      <label>
                        Nom
                        <input
                          type="text"
                          name="name"
                          value={authForm.name}
                          onChange={handleAuthChange}
                          placeholder="Votre nom"
                        />
                      </label>
                      <label>
                        Mot de passe
                        <input
                          type="password"
                          name="password"
                          value={authForm.password}
                          onChange={handleAuthChange}
                          placeholder="Créer un mot de passe"
                        />
                      </label>
                      <label>
                        Répéter le mot de passe
                        <input
                          type="password"
                          name="confirmPassword"
                          value={authForm.confirmPassword}
                          onChange={handleAuthChange}
                          placeholder="Répétez votre mot de passe"
                        />
                      </label>
                      <button type="submit" className="primary-btn full-width">
                        Confirmer
                      </button>
                      {signupMessage && <p className="form-success">{signupMessage}</p>}
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="dashboard-shell">
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="logo-badge sidebar-logo">
                <img src={logo} alt="Elixir Homes logo" />
              </div>
              <div>
                <strong>Elixir Homes</strong>
                <small>Manager</small>
              </div>
            </div>

            <nav className="nav-menu">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? 'nav-item active' : 'nav-item'}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'Chambres' && <FaBed />}
                  {tab === 'Réservations' && <FaCalendarAlt />}
                  {tab === 'Dépenses' && <FaMoneyBillWave />}
                  {tab === 'Analyse et performances' && <FaChartPie />}
                  <span>{tab}</span>
                </button>
              ))}
            </nav>

            <button
              type="button"
              className="logout-btn"
              onClick={() => {
                setIsLoggedIn(false)
                storage.remove(STORAGE_KEYS.session)
                if (supabase) {
                  supabase.auth.signOut()
                }
                setActiveTab('Chambres')
              }}
            >
              <FaSignOutAlt /> Se déconnecter
            </button>
          </aside>

          <main className="dashboard-main">
            <header className="dashboard-header">
              <div>
                <span className="eyebrow">Tableau de bord</span>
                <h2>{activeTab}</h2>
              </div>
              <div className="dashboard-user">
                <FaUser />
                <span>Admin</span>
              </div>
            </header>

            {renderDashboardContent()}
          </main>
        </div>
      )}
    </div>
  )
}

export default App
