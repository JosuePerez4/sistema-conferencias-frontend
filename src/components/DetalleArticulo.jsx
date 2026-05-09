import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/detalle-articulo.css';

/** PaperStatus (backend, mayúsculas) */
const STATUS_LABELS = {
  SUBMITTED: 'Enviado',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  IN_CORRECTIONS: 'En correcciones',
  PRESENTED: 'Presentado',
  PUBLISHED: 'Publicado',
};

function formatearTamano(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function esPdfAdjunto(adj) {
  const tipo = (adj?.contentType || '').toLowerCase();
  if (tipo.includes('pdf')) return true;
  const nombre = (adj?.originalFileName || '').toLowerCase();
  return nombre.endsWith('.pdf');
}

function esPdfBlob(blob, nombre) {
  const tipo = (blob?.type || '').toLowerCase();
  if (tipo.includes('pdf')) return true;
  return (nombre || '').toLowerCase().endsWith('.pdf');
}

const DetalleArticulo = () => {
  const { conferenciaId, paperId } = useParams();
  const [articulo, setArticulo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [subiendoAdjuntos, setSubiendoAdjuntos] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [archivosSubir, setArchivosSubir] = useState([]);
  const [evaluacion, setEvaluacion] = useState({
    status: 'SUBMITTED',
    observations: ''
  });

  const getEstadoClass = (estado) => {
    const n = (estado || '').toUpperCase();
    if (n === 'ACCEPTED') return 'detalle-estado detalle-estado--aceptado';
    if (n === 'REJECTED') return 'detalle-estado detalle-estado--rechazado';
    if (n === 'PUBLISHED' || n === 'PRESENTED') return 'detalle-estado detalle-estado--publicado';
    return 'detalle-estado detalle-estado--revision';
  };

  const cargarArticulo = useCallback(async () => {
    setError('');
    setCargando(true);
    try {
      const respuesta = await apiService.obtenerPaper(conferenciaId, paperId);
      const datos = respuesta?.data !== undefined ? respuesta.data : respuesta;
      if (!datos) {
        throw new Error('Respuesta inválida del servidor.');
      }
      setArticulo(datos);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle del artículo.');
      setArticulo(null);
    } finally {
      setCargando(false);
    }
  }, [conferenciaId, paperId]);

  useEffect(() => {
    cargarArticulo();
  }, [cargarArticulo]);

  useEffect(() => {
    if (!articulo) return;
    setEvaluacion({
      status: articulo.status || 'SUBMITTED',
      observations: articulo.evaluationObservations ?? ''
    });
  }, [articulo]);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview?.url]);

  const cerrarPreview = useCallback(() => {
    setPreview((p) => {
      if (p?.url) URL.revokeObjectURL(p.url);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!preview) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') cerrarPreview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview, cerrarPreview]);

  const documentos = Array.isArray(articulo?.documents) ? articulo.documents : [];
  const hayAdjuntos = documentos.length > 0 || articulo?.hasDocument;

  const handleDescargarAdjunto = async (adj) => {
    const aid = adj?.id;
    if (!aid) return;
    setError('');
    setCargandoArchivo(true);
    try {
      const { blob, filename } = await apiService.descargarAdjuntoPaperBlob(
        conferenciaId,
        paperId,
        aid,
        adj.originalFileName || 'adjunto'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || adj.originalFileName || 'adjunto';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'No se pudo descargar el adjunto.');
    } finally {
      setCargandoArchivo(false);
    }
  };

  const handleVistaPreviaAdjunto = async (adj) => {
    if (!esPdfAdjunto(adj)) {
      setError('La vista previa solo está disponible para PDF. Descarga el archivo para abrirlo en tu equipo.');
      return;
    }
    const aid = adj?.id;
    if (!aid) return;
    setError('');
    setCargandoArchivo(true);
    try {
      const { blob, filename } = await apiService.descargarAdjuntoPaperBlob(
        conferenciaId,
        paperId,
        aid,
        adj.originalFileName || 'adjunto'
      );
      const nombre = filename || adj.originalFileName || 'adjunto';
      if (!esPdfBlob(blob, nombre)) {
        setError('La vista previa solo está disponible para PDF.');
        return;
      }
      const url = URL.createObjectURL(blob);
      if (preview?.url) URL.revokeObjectURL(preview.url);
      setPreview({ url, title: nombre });
    } catch (err) {
      setError(err.message || 'No se pudo cargar la vista previa.');
    } finally {
      setCargandoArchivo(false);
    }
  };

  const handleArchivosSubirChange = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setArchivosSubir(list);
  };

  const handleSubirMasAdjuntos = async (e) => {
    e.preventDefault();
    if (!archivosSubir.length) {
      setError('Selecciona uno o más archivos.');
      return;
    }
    setError('');
    setSubiendoAdjuntos(true);
    try {
      await apiService.subirAdjuntosPaper(conferenciaId, paperId, archivosSubir);
      setArchivosSubir([]);
      const input = document.getElementById('detalle-adjuntos-extra');
      if (input) input.value = '';
      await cargarArticulo();
    } catch (err) {
      setError(err.message || 'No se pudieron subir los adjuntos.');
    } finally {
      setSubiendoAdjuntos(false);
    }
  };

  const handleEvaluar = async (e) => {
    e.preventDefault();
    try {
      const body = {
        status: evaluacion.status,
        observations: evaluacion.observations.trim() === '' ? null : evaluacion.observations.trim()
      };
      await apiService.evaluarPaper(conferenciaId, paperId, body);
      await cargarArticulo();
    } catch (err) {
      setError(err.message || 'No fue posible evaluar el artículo.');
    }
  };

  if (cargando) {
    return (
      <div className="detalle-page detalle-loading">
        Cargando detalle del artículo...
      </div>
    );
  }

  if (!articulo) {
    return (
      <div className="detalle-error-wrap">
        <div className="detalle-error">{error || 'No se encontró el artículo solicitado.'}</div>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/conferencias" className="detalle-back-link">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const estadoActual = articulo.status || 'SUBMITTED';
  const autoresTexto = typeof articulo.authors === 'string'
    ? articulo.authors
    : (Array.isArray(articulo.authors) ? articulo.authors.join('; ') : 'Sin autores');
  const nombreConferencia =
    articulo.conferenceName ?? articulo.conference?.name ?? articulo.eventName ?? null;
  const abstractTexto = articulo.abstractText ?? articulo.abstract ?? '';

  return (
    <div className="detalle-page">
      <div className="detalle-back">
        <Link to={`/conferencia/${conferenciaId}`} className="detalle-back-link">
          ← Volver a la conferencia
        </Link>
        <Link to="/conferencias" className="detalle-back-link detalle-back-link--muted">
          Catálogo de conferencias
        </Link>
      </div>

      <div className="detalle-card">
        <div className="detalle-header">
          <div>
            <div className="detalle-header-meta">
              <span className={getEstadoClass(estadoActual)} title={estadoActual}>
                {STATUS_LABELS[estadoActual] || estadoActual}
              </span>
            </div>
            <h1 className="detalle-title">{articulo.title || 'Sin título'}</h1>
            {nombreConferencia && (
              <p className="detalle-conference">
                Conferencia: <span>{nombreConferencia}</span>
              </p>
            )}
          </div>
        </div>

        <div className="detalle-body">
          {error && (
            <div className="sf-alert-error">{error}</div>
          )}

          <section>
            <h3 className="detalle-section-title">Autores</h3>
            <p className="detalle-authors-box">{autoresTexto}</p>
          </section>

          <section>
            <h3 className="detalle-section-title">Tema</h3>
            <p className="detalle-abstract">{articulo.topic || '—'}</p>
          </section>

          <section>
            <h3 className="detalle-section-title">Afiliación institucional</h3>
            <p className="detalle-abstract">{articulo.institutionalAffiliation || '—'}</p>
          </section>

          <section>
            <h3 className="detalle-section-title">Palabras clave</h3>
            <p className="detalle-abstract">{articulo.keywords || '—'}</p>
          </section>

          <section>
            <h3 className="detalle-section-title">Resumen (abstractText)</h3>
            <p className="detalle-abstract">{abstractTexto || '—'}</p>
          </section>

          <section>
            <h3 className="detalle-section-title">Adjuntos</h3>
            <p className="detalle-section-hint">
              Descarga o previsualiza cada archivo. Si el servidor no envía nombre en la cabecera, se usará «adjunto» por defecto.
            </p>

            {documentos.length > 0 ? (
              <div>
                {documentos.map((adj) => (
                  <div key={adj.id} className="detalle-file-row">
                    <div className="detalle-file-info">
                      <svg className="detalle-file-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <div className="detalle-file-meta">
                        <span className="detalle-file-name">{adj.originalFileName || 'Adjunto'}</span>
                        <span className="detalle-file-sub">
                          {adj.contentType || '—'} · {formatearTamano(adj.fileSize)}
                        </span>
                      </div>
                    </div>
                    <div className="detalle-file-actions">
                      {esPdfAdjunto(adj) && (
                        <button
                          type="button"
                          disabled={cargandoArchivo}
                          onClick={() => handleVistaPreviaAdjunto(adj)}
                          className="detalle-file-btn detalle-file-btn--primary"
                        >
                          Vista previa
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={cargandoArchivo}
                        onClick={() => handleDescargarAdjunto(adj)}
                        className="detalle-file-btn detalle-file-btn--secondary"
                      >
                        Descargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="detalle-empty">
                {hayAdjuntos
                  ? 'El servidor indica que hay documento (hasDocument), pero la lista aún no llegó en la respuesta.'
                  : 'No hay adjuntos registrados para este artículo.'}
              </p>
            )}

            <form onSubmit={handleSubirMasAdjuntos} className="detalle-adjuntos-upload">
              <p className="sf-label detalle-adjuntos-section-title">Añadir adjuntos</p>
              <div className="detalle-adjuntos-upload-inner">
                <label className="detalle-adjuntos-dropzone" htmlFor="detalle-adjuntos-extra">
                  <input
                    id="detalle-adjuntos-extra"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleArchivosSubirChange}
                    className="detalle-adjuntos-file-input"
                  />
                  <div className="detalle-adjuntos-dropzone-inner">
                    <svg className="detalle-adjuntos-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="detalle-adjuntos-dropzone-hint">
                      <strong>Haz clic para elegir</strong> uno o varios archivos
                    </p>
                    <p className="detalle-adjuntos-dropzone-note">PDF, Word</p>
                  </div>
                </label>
                <div className="detalle-adjuntos-actions">
                  {archivosSubir.length > 0 ? (
                    <ul className="detalle-adjuntos-file-list">
                      {archivosSubir.map((f) => (
                        <li key={`${f.name}-${f.size}`}>{f.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="detalle-adjuntos-empty-hint">Aún no has seleccionado archivos.</p>
                  )}
                  <button
                    type="submit"
                    disabled={subiendoAdjuntos || !archivosSubir.length}
                    className="detalle-adjuntos-submit"
                  >
                    {subiendoAdjuntos ? 'Subiendo…' : 'Subir archivos'}
                  </button>
                </div>
              </div>
              <p className="detalle-section-hint detalle-section-hint--tight">
                Puedes añadir más archivos en cualquier momento.
              </p>
            </form>
          </section>

          <section id="evaluar-articulo">
            <h3 className="detalle-section-title">Evaluar artículo</h3>
            <p className="detalle-section-hint">
              Elige el nuevo estado del artículo y, si quieres, deja observaciones para el autor.
            </p>
            <form onSubmit={handleEvaluar} className="detalle-eval-form">
              <div>
                <label className="sf-label" htmlFor="eval-status">Estado (PaperStatus)</label>
                <select
                  id="eval-status"
                  value={evaluacion.status}
                  onChange={(e) => setEvaluacion((prev) => ({ ...prev, status: e.target.value }))}
                  className="sf-select"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label} ({value})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="sf-label" htmlFor="eval-observations">Observaciones</label>
                <textarea
                  id="eval-observations"
                  value={evaluacion.observations}
                  onChange={(e) => setEvaluacion((prev) => ({ ...prev, observations: e.target.value }))}
                  rows="3"
                  className="sf-textarea"
                  placeholder="Observaciones de la evaluación (opcional)"
                />
              </div>
              <button type="submit" className="detalle-eval-submit">
                Guardar evaluación
              </button>
            </form>
          </section>
        </div>
      </div>

      {preview && (
        <div
          className="detalle-preview-backdrop"
          role="presentation"
          onClick={cerrarPreview}
          onKeyDown={(e) => e.key === 'Escape' && cerrarPreview()}
        >
          <div
            className="detalle-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-preview-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detalle-preview-toolbar">
              <h2 id="detalle-preview-title" className="detalle-preview-title">
                {preview.title}
              </h2>
              <button type="button" className="detalle-preview-close" onClick={cerrarPreview}>
                Cerrar
              </button>
            </div>
            <iframe
              title={preview.title}
              src={`${preview.url}#view=FitH`}
              className="detalle-preview-iframe"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleArticulo;
