import { Routes, Route } from 'react-router-dom';
import FormularioContribuicao from './FormularioContribuicao';
import Admin from './Admin';

function App() {
  return (
    <Routes>
      <Route path="/" element={<FormularioContribuicao />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;