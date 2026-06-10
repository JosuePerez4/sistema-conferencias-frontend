import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/components/enviar-articulo.css';

function normalizarIdConferencia(raw) {
  const s = raw != null ? String(raw).trim() : '';
  if (!s) return null;
  const soloDigitos = /^\d+$/.test(s);
  if (soloDigitos) {
    const n = Number(s);
    if (Number.isFinite(n) && n > 0) return n;
    return null;
  }
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  return uuid ? s : null;
}

const EnviarArticulo = () => {
  const { conferenciaId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    titulo: '',
    abstractText: '',
    topic: '',
    institutionalAffiliation: '',
    keywords: ''
  });

  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  // Estados para Autores
  const [authorSearch, setAuthorSearch] = useState('');
  const [authorResults, setAuthorResults] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [buscandoAutores, setBuscandoAutores] = useState(false);

  // Estados para Ponente
  const [presenterSearch, setPresenterSearch] = useState('');
  const [presenterResults, setPresenterResults] = useState([]);
  const [selectedPresenter, setSelectedPresenter] = useState(null);
  const [buscandoPonente, setBuscandoPonente] = useState(false);

  let searchTimeout = null;

  const handleAuthorSearchChange = (e) => {
    const val = e.target.value;
    setAuthorSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (val.trim().length < 2) {
      setAuthorResults([]);
      return;
    }

    setBuscandoAutores(true);
    searchTimeout = setTimeout(async () => {
      try {
        const results = await apiService.buscarPonentes(val);
        setAuthorResults(results);
      } catch (err) {
        console.error("Error buscando autores", err);
      } finally {
        setBuscandoAutores(false);
      }
    }, 500);
  };

  const handlePresenterSearchChange = (e) => {
    const val = e.target.value;
    setPresenterSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (val.trim().length < 2) {
      setPresenterResults([]);
      return;
    }

    setBuscandoPonente(true);
    searchTimeout = setTimeout(async () => {
      try {
        const results = await apiService.buscarPonentes(val);
        setPresenterResults(results);
      } catch (err) {
        console.error("Error buscando ponente", err);
      } finally {
        setBuscandoPonente(false);
      }
    }, 500);
  };

  const addAuthor = (author) => {
    if (!selectedAuthors.find(a => a.id === author.id)) {
      setSelectedAuthors([...selectedAuthors, author]);
    }
    setAuthorSearch('');
    setAuthorResults([]);
  };

  const removeAuthor = (id) => {
    setSelectedAuthors(selectedAuthors.filter(a => a.id !== id));
  };

  const selectPresenter = (presenter) => {
    setSelectedPresenter(presenter);
    setPresenterSearch('');
    setPresenterResults([]);
  };

  const clearPresenter = () => {
    setSelectedPresenter(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setArchivos(list);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const title = formData.titulo.trim();
    const abstractText = formData.abstractText.trim();
    const topic = formData.topic.trim();
    const institutionalAffiliation = formData.institutionalAffiliation.trim();
    const keywords = formData.keywords.trim();

    if (!title || !abstractText || !topic || !institutionalAffiliation || !keywords) {
      setError('Todos los campos de texto son obligatorios y no pueden quedar en blanco.');
      return;
    }

    if (selectedAuthors.length === 0) {
      setError('Debes seleccionar al menos un autor para este artículo.');
      return;
    }

    if (!selectedPresenter) {
      setError('Debes especificar quién será el ponente de este artículo.');
      return;
    }

    setCargando(true);

    try {
      const conferenceIdResolved = normalizarIdConferencia(conferenciaId);
      if (conferenceIdResolved == null) {
        throw new Error('La conferencia no es válida o no se pudo identificar.');
      }

      /** PaperCreateDto — todos string, camelCase, más UUIDs para authors y presenter */
      const payloadPaper = {
        title,
        abstractText,
        topic,
        institutionalAffiliation,
        keywords,
        authorIds: selectedAuthors.map(a => a.id),
        presenterId: selectedPresenter.id
      };

      /** Una sola petición: multipart paper (JSON) + files opcionales */
      const paperCreado = await apiService.crearPaper(conferenceIdResolved, payloadPaper, archivos);
      const paperId = paperCreado?.id ?? paperCreado?.paperId;
      if (!paperId) {
        throw new Error('El servidor no confirmó la creación del artículo. Intenta de nuevo.');
      }

      setExito(true);
      setTimeout(() => {
        navigate(
          `/conferencia/${encodeURIComponent(conferenceIdResolved)}/articulo-enviado/${encodeURIComponent(paperId)}`
        );
      }, 2000);
    } catch (err) {
      setError(err.message || 'No se pudo enviar el artículo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="enviar-page">
      <div className="enviar-header">
        <Link to={`/conferencia/${conferenciaId}`} className="enviar-back">
          ← Volver a la conferencia
        </Link>
        <h1 className="enviar-title">Enviar Artículo / Ponencia</h1>
        <p className="enviar-subtitle">Sube tu propuesta para esta conferencia.</p>
      </div>

      <div className="enviar-card">
        {exito && (
          <div className="enviar-alert-success">
            ¡Tu artículo ha sido enviado con éxito para revisión!
          </div>
        )}
        {error && (
          <div className="enviar-alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="enviar-form">
          <div>
            <label className="sf-label" htmlFor="enviar-titulo">Título *</label>
            <input
              id="enviar-titulo"
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              className="sf-input"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-abstractText">Resumen (abstractText) *</label>
            <textarea
              id="enviar-abstractText"
              name="abstractText"
              value={formData.abstractText}
              onChange={handleChange}
              required
              rows="4"
              className="sf-textarea"
              placeholder="Resumen o abstract completo del trabajo"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-topic">Tema / área temática *</label>
            <input
              id="enviar-topic"
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              placeholder="Ej. Inteligencia artificial"
              className="sf-input"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-affiliation">Afiliación institucional *</label>
            <input
              id="enviar-affiliation"
              type="text"
              name="institutionalAffiliation"
              value={formData.institutionalAffiliation}
              onChange={handleChange}
              required
              placeholder="Ej. Universidad X"
              className="sf-input"
            />
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-keywords">Palabras clave *</label>
            <input
              id="enviar-keywords"
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              required
              placeholder="Ej. machine learning; NLP; evaluación"
              className="sf-input"
            />
          </div>

          <div>
            <label className="sf-label">Autores registrados *</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={authorSearch} 
                onChange={handleAuthorSearchChange} 
                placeholder="Busca autores por nombre o correo..." 
                className="sf-input" 
              />
              {buscandoAutores && <span style={{ fontSize: '12px', color: '#666' }}>Buscando...</span>}
              
              {authorResults.length > 0 && (
                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '4px', zIndex: 10, listStyle: 'none', padding: 0, margin: '4px 0', maxHeight: '150px', overflowY: 'auto' }}>
                  {authorResults.map(a => {
                    const rolLegible = a.role === 'GUEST_SPOKER' ? 'Invitado Especial' : (a.role === 'AUTHOR' ? 'Autor' : a.role);
                    return (
                      <li 
                        key={a.id} 
                        onClick={() => addAuthor(a)}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      >
                        {a.displayName} <span style={{ color: '#888', fontSize: '12px' }}>({rolLegible})</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {selectedAuthors.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedAuthors.map(a => (
                  <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '16px', fontSize: '14px' }}>
                    {a.displayName}
                    <button type="button" onClick={() => removeAuthor(a.id)} style={{ background: 'none', border: 'none', color: '#3730a3', marginLeft: '4px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <p className="enviar-field-hint">Añade a todos los coautores registrados en la plataforma.</p>
          </div>

          <div>
            <label className="sf-label">Ponente (quien expondrá) *</label>
            {!selectedPresenter ? (
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={presenterSearch} 
                  onChange={handlePresenterSearchChange} 
                  placeholder="Busca al ponente por nombre o correo..." 
                  className="sf-input" 
                />
                {buscandoPonente && <span style={{ fontSize: '12px', color: '#666' }}>Buscando...</span>}
                
                {presenterResults.length > 0 && (
                  <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '4px', zIndex: 10, listStyle: 'none', padding: 0, margin: '4px 0', maxHeight: '150px', overflowY: 'auto' }}>
                    {presenterResults.map(p => {
                      const rolLegible = p.role === 'GUEST_SPOKER' ? 'Invitado Especial' : (p.role === 'AUTHOR' ? 'Autor' : p.role);
                      return (
                        <li 
                          key={p.id} 
                          onClick={() => selectPresenter(p)}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                        >
                          {p.displayName} <span style={{ color: '#888', fontSize: '12px' }}>({rolLegible})</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', border: '1px solid #bbf7d0' }}>
                  <strong>{selectedPresenter.displayName}</strong>
                </span>
                <button type="button" onClick={clearPresenter} style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                  Cambiar ponente
                </button>
              </div>
            )}
            <p className="enviar-field-hint">Selecciona a una sola persona como el presentador oficial del artículo.</p>
          </div>

          <div>
            <label className="sf-label" htmlFor="enviar-file">Adjuntos iniciales (opcional)</label>
            <div className="enviar-upload-wrap">
              <label className="enviar-dropzone">
                <div className="enviar-dropzone-inner">
                  <svg className="enviar-upload-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="enviar-dropzone-hint">
                    <strong>Haz clic para elegir</strong> uno o varios archivos
                  </p>
                  <p className="enviar-dropzone-note">PDF, Word, etc.</p>
                </div>
                <input
                  id="enviar-file"
                  type="file"
                  className="enviar-file-input"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="enviar-field-hint">
              Si no adjuntas nada aquí, el artículo se crea solo con metadatos; podrás subir archivos después desde el detalle.
            </p>
            {archivos.length > 0 && (
              <ul className="enviar-file-list">
                {archivos.map((f) => (
                  <li key={`${f.name}-${f.size}`}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="enviar-actions">
            <button type="submit" disabled={cargando} className="enviar-submit">
              {cargando ? 'Enviando…' : 'Enviar artículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnviarArticulo;
