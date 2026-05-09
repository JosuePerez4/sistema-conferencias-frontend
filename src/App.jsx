import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Login from './components/Login';
import Registro from './components/Registro';
import Conferencias from './components/Conferencias';
import LandingConferencia from './components/LandingConferencia';
import CrearConferencia from './components/CrearConferencia';
import EditarConferencia from './components/EditarConferencia';
import EnviarArticulo from './components/EnviarArticulo';
import DetalleArticulo from './components/DetalleArticulo';
import BandejaEvaluacion from './components/BandejaEvaluacion';
import EvaluarArticulo   from './components/EvaluarArticulo';
import ProgramacionSalas from './components/ProgramacionSalas';
import ConfigurarEspacios from './components/ConfigurarEspacios';

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/iniciar-sesion" element={<Login />} />
                    <Route path="/registro" element={<Registro />} />
                    <Route path="/conferencias" element={<Conferencias />} />
                    <Route path="/conferencia/:id" element={<LandingConferencia />} />
                    <Route path="/crear-conferencia" element={<CrearConferencia />} />
                    <Route path="/editar-conferencia/:id" element={<EditarConferencia />} />
                    <Route path="/enviar-articulo/:conferenciaId" element={<EnviarArticulo />} />
                    <Route path="/conferencia/:conferenciaId/articulo/:paperId" element={<DetalleArticulo />} />
                    <Route path="/conferencia/:conferenciaId/evaluaciones" element={<BandejaEvaluacion />} />
                    <Route path="/conferencia/:conferenciaId/papers/:paperId/evaluar" element={<EvaluarArticulo />} />
                    <Route path="/conferencia/:conferenciaId/programacion" element={<ProgramacionSalas />} />
                    <Route path="/conferencia/:conferenceId/espacios" element={<ConfigurarEspacios />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
