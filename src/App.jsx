import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import ProgramacionSalas from './components/ProgramacionSalas';

/** Compatibilidad: enlaces antiguos a /papers/:id/evaluar abren el detalle con contexto completo. */
function EvaluarArticuloRedirect() {
  const { conferenciaId, paperId } = useParams();
  return (
    <Navigate
      to={`/conferencia/${conferenciaId}/articulo/${paperId}#evaluar-articulo`}
      replace
    />
  );
}
import ConfigurarEspacios from './components/ConfigurarEspacios';
import SalasConferencia from './components/SalasConferencia';
import Salas from './components/Salas';
import InscripcionAsistente from './components/InscripcionAsistente';
import AdminPagos from './components/AdminPagos';
import ArticuloEnviadoExito from './components/ArticuloEnviadoExito';
import MisArticulos from './components/MisArticulos';
import AdminChairs from './components/AdminChairs';

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/iniciar-sesion" element={<Login />} />
                    <Route path="/registro" element={<Registro />} />
                    <Route path="/conferencias" element={<Conferencias />} />
                    <Route path="/salas" element={<Salas />} />
                    <Route path="/conferencia/:id" element={<LandingConferencia />} />
                    <Route path="/conferencia/:id/inscripcion" element={<InscripcionAsistente />} />
                    <Route path="/crear-conferencia" element={<CrearConferencia />} />
                    <Route path="/editar-conferencia/:id" element={<EditarConferencia />} />
                    <Route path="/enviar-articulo/:conferenciaId" element={<EnviarArticulo />} />
                    <Route path="/conferencia/:conferenciaId/articulo-enviado/:paperId" element={<ArticuloEnviadoExito />} />
                    <Route path="/conferencia/:conferenciaId/articulo/:paperId" element={<DetalleArticulo />} />
                    <Route path="/conferencia/:conferenciaId/evaluaciones" element={<BandejaEvaluacion />} />
                    <Route path="/conferencia/:conferenciaId/papers/:paperId/evaluar" element={<EvaluarArticuloRedirect />} />
                    <Route path="/conferencia/:conferenciaId/programacion" element={<ProgramacionSalas />} />
                    <Route path="/conferencia/:conferenceId/espacios" element={<ConfigurarEspacios />} />
                    <Route path="/conferencia/:conferenciaId/salas" element={<SalasConferencia />} />
                    <Route path="/admin/pagos" element={<AdminPagos />} />
                    <Route path="/admin/chairs" element={<AdminChairs />} />
                    <Route path="/mis-articulos" element={<MisArticulos />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
