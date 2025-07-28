import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ListaDeputados from './pages/ListaDeputados';
import DespesasDeputado from './pages/DespesasDeputado';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ListaDeputados />} />
      <Route path="/deputado/:id" element={<DespesasDeputado />} />
    </Routes>
  );
}

export default App;
