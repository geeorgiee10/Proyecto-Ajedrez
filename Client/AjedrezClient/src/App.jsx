import { useState } from 'react'
import './assets/App.css';
import { Login } from './components/Login.jsx';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { Informacion } from './components/informacion.jsx';
import { Jugar } from './components/Jugar.jsx';
import { ModoLocal }from './components/ModoLocal.jsx';
import { ModoIA } from './components/ModoIA.jsx';
import { ModoOnline } from './components/ModoOnline.jsx';
import { Ranking } from './components/Ranking.jsx';
import { Error404 } from './components/Error404.jsx';
import { RutasProtegidas } from './components/RutasProtegidas.jsx';
import { RutasLogin } from './components/RutasLogin.jsx';
import { ScrollTop } from './components/ScrollTop.jsx';
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";


function App() {

  return (
    <BrowserRouter>
    <Header /> 
    <ScrollTop />
       
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/informacion" element={<Informacion />} />
          <Route element={<RutasLogin />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route path="/jugar" element={<Jugar />} />
          <Route element={<RutasProtegidas />}>
            <Route path="/modo-ia" element={<ModoIA />} />
          </Route>
          <Route element={<RutasProtegidas />}>
            <Route path="/modo-online" element={<ModoOnline />} />
          </Route>
          <Route path="/modo-local" element={<ModoLocal />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="*" element={<Error404 />} />
        </Routes>
      </main>
      
    <Footer /> 
    </BrowserRouter>
  )
}

export default App
