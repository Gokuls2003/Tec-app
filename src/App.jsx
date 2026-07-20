import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Players from './pages/Players.jsx'
import PlayerProfile from './pages/PlayerProfile.jsx'
import Teams from './pages/Teams.jsx'
import TeamProfile from './pages/TeamProfile.jsx'
import Fixtures from './pages/Fixtures.jsx'
import Rankings from './pages/Rankings.jsx'
import Stats from './pages/Stats.jsx'
import Champions from './pages/Champions.jsx'
import BallonDor from './pages/BallonDor.jsx'
import SearchPage from './pages/Search.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:id" element={<PlayerProfile />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:name" element={<TeamProfile />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/champions" element={<Champions />} />
          <Route path="/balondor" element={<BallonDor />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
