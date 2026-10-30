import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'


function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <h1 className="text-5xl font-bold text-violet-400">
        EventPulse
      </h1>
      <p className="mt-4 text-lg text-slate-300">
        Discover. Book. Experience.
      </p>
      <button className="mt-8 rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-700">
        Explore Events
      </button>
    </div>
  )
}

export default App
