const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL ||
  import.meta.env.API_GATEWAY_URL ||
  'http://localhost:8080';
const AUTH_URL = `${API_GATEWAY_URL}/api/v1/auth`;
const CONF_URL = `${API_GATEWAY_URL}/conferences`;
const PAPER_URL = `${API_GATEWAY_URL}/papers`;
const FILE_URL = `${API_GATEWAY_URL}/files`;
const ROOM_URL = `${API_GATEWAY_URL}/rooms`;
const SCHEDULE_URL = `${API_GATEWAY_URL}/schedule`;
const NOTIF_URL = `${API_GATEWAY_URL}/notifications`;
const REG_URL = `${API_GATEWAY_URL}/registrations`;
const USERS_URL = `${API_GATEWAY_URL}/api/v1/users`;

const getToken = () => localStorage.getItem('accessToken');

const getAuthHeaders = (isJson = true) => {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const papersBase = (conferenceId) =>
  `${PAPER_URL}/conference/${encodeURIComponent(conferenceId)}`;

const resolveFilenameFromDisposition = (disposition, fallback) => {
  const utfMatch = /filename\*=UTF-8''([^;\s]+)/i.exec(disposition || '');
  const asciiMatch = /filename="([^"]+)"|filename=([^;\s]+)/i.exec(disposition || '');
  const raw = utfMatch?.[1] || asciiMatch?.[1] || asciiMatch?.[2];
  if (!raw) return fallback;
  try {
    return decodeURIComponent(raw.replace(/^["']|["']$/g, ''));
  } catch {
    return raw;
  }
};

const parseError = async (response, fallbackMessage) => {
  try {
    const text = await response.text();
    if (!text) {
      return response.status === 500 ? `${fallbackMessage} (error del servidor, sin detalle)` : `${fallbackMessage} (HTTP ${response.status})`;
    }
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch {
      return text.length > 280 ? `${text.slice(0, 280)}…` : text;
    }

    const fieldList = errorData.fieldErrors || errorData.errors;
    if (Array.isArray(fieldList) && fieldList.length > 0) {
      const msgs = fieldList
        .map((fe) => fe.defaultMessage || fe.message || (fe.field != null ? `${fe.field}: inválido` : null))
        .filter(Boolean);
      if (msgs.length) return msgs.join(' · ');
    }

    return (
      errorData.message ||
      errorData.detail ||
      (typeof errorData.error === 'string' ? errorData.error : null) ||
      fallbackMessage
    );
  } catch {
    return `${fallbackMessage} (HTTP ${response.status})`;
  }
};

const normalizeStringList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value !== 'string') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

export const apiService = {
  login: async (credenciales) => {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email: credenciales.correo,
        password: credenciales.password
      }),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al iniciar sesión'));
    return response.json();
  },

  registro: async (datos) => {
    const uniqueDocumentNumber = `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90) + 10}`;
    const allowedRoles = new Set(['ADMIN', 'CHAIR', 'AUTHOR', 'ASISTANT']);
    const role =
      datos.role && allowedRoles.has(String(datos.role).toUpperCase())
        ? String(datos.role).toUpperCase()
        : 'AUTHOR';
    const bodyBackend = {
      documentType: "CC",
      documentNumber: uniqueDocumentNumber,
      firstName: datos.nombre,
      lastName: datos.apellido,
      email: datos.correo,
      phoneNumber: datos.telefono,
      password: datos.password,
      institution: "Ninguna",
      country: "Colombia",
      city: "Desconocida",
      role
    };
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyBackend),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error en el registro'));
    return response.json();
  },

  obtenerConferencias: async () => {
    const response = await fetch(`${CONF_URL}/get-all`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener conferencias'));
    return response.json();
  },

  crearConferencia: async (datos) => {
    const bodyBackend = {
      name: datos.name,
      description: datos.description,
      location: datos.location,
      virtual: Boolean(datos.virtual),
      inscriptionPrice: Number(datos.inscriptionPrice),
      startDate: datos.startDate,
      endDate: datos.endDate,
      submissionDeadline: datos.submissionDeadline,
      topics: normalizeStringList(datos.topics),
      sponsors: normalizeStringList(datos.sponsors),
      speakerIds: datos.speakerIds,
      state: datos.state
    };
    const response = await fetch(`${CONF_URL}/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyBackend),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al crear conferencia'));
    return response.json();
  },

  obtenerConferencia: async (id) => {
    const response = await fetch(`${CONF_URL}/get/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener la conferencia'));
    return response.json();
  },

  editarConferencia: async (id, datos) => {
    const bodyBackend = {
      id: datos.id ?? id,
      name: datos.name,
      description: datos.description,
      location: datos.location,
      virtual: Boolean(datos.virtual),
      inscriptionPrice: Number(datos.inscriptionPrice),
      startDate: datos.startDate,
      endDate: datos.endDate,
      submissionDeadline: datos.submissionDeadline,
      topics: normalizeStringList(datos.topics),
      sponsors: normalizeStringList(datos.sponsors),
      speakerIds: datos.speakerIds,
      state: datos.state
    };
    const response = await fetch(`${CONF_URL}/edit/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyBackend),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al editar conferencia'));
    return response.json();
  },

  eliminarConferencia: async (id) => {
    const response = await fetch(`${CONF_URL}/delete/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al eliminar conferencia'));
    if (response.status === 204) return { ok: true };
    return response.json().catch(() => ({ ok: true }));
  },

  crearPaper: async (conferenceId, paperDto, archivosIniciales = []) => {
    const formData = new FormData();
    formData.append(
      'paper',
      new Blob([JSON.stringify(paperDto)], { type: 'application/json' })
    );
    for (const file of archivosIniciales) {
      formData.append('files', file, file.name);
    }
    const response = await fetch(`${papersBase(conferenceId)}/create`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: formData,
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al crear paper'));
    return response.json();
  },

  // ✅ CORREGIDO: usa getAuthHeaders para enviar el token
  obtenerBandejaEvaluacion: async (conferenceId) => {
    const response = await fetch(`${papersBase(conferenceId)}/evaluations-tray`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener bandeja de evaluación'));
    return response.json();
  },

  obtenerPapers: async (conferenceId, status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await fetch(`${papersBase(conferenceId)}/list${query}`, {
      method: 'GET',
      headers: getAuthHeaders(false)
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener papers'));
    return response.json();
  },

  obtenerPaper: async (conferenceId, paperId) => {
    const response = await fetch(`${papersBase(conferenceId)}/${encodeURIComponent(paperId)}`, {
      method: 'GET',
      headers: getAuthHeaders(false)
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener el paper'));
    return response.json();
  },

  evaluarPaper: async (conferenceId, paperId, evaluacion) => {
    const response = await fetch(
      `${papersBase(conferenceId)}/${encodeURIComponent(paperId)}/evaluations`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(evaluacion),
      }
    );
    if (!response.ok) throw new Error(await parseError(response, 'Error al evaluar paper'));
    return response.json();
  },

  subirAdjuntosPaper: async (conferenceId, paperId, files) => {
    if (!conferenceId || !paperId) throw new Error('conferenceId y paperId son obligatorios.');
    if (!files?.length) throw new Error('Selecciona al menos un archivo.');
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }
    const response = await fetch(
      `${papersBase(conferenceId)}/${encodeURIComponent(paperId)}/attachments`,
      {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
      }
    );
    if (!response.ok) throw new Error(await parseError(response, 'Error al subir adjuntos'));
    return response.json().catch(() => ({}));
  },

  descargarAdjuntoPaperBlob: async (conferenceId, paperId, attachmentId, nombreSugerido) => {
    if (!conferenceId || !paperId || !attachmentId) throw new Error('conferenceId, paperId y attachmentId son obligatorios.');
    const response = await fetch(
      `${papersBase(conferenceId)}/${encodeURIComponent(paperId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { method: 'GET', headers: getAuthHeaders(false) }
    );
    if (!response.ok) throw new Error(await parseError(response, 'Error al descargar el adjunto'));
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = resolveFilenameFromDisposition(disposition, nombreSugerido || 'adjunto');
    return { blob, filename };
  },

  subirArchivoConferencia: async (conferenceId, file) => {
    if (!conferenceId) throw new Error('conferenceId es obligatorio para subir archivos.');
    if (!file) throw new Error('Debes seleccionar un archivo para subir.');
    const formData = new FormData();
    formData.append('file', file, file.name);
    const response = await fetch(`${FILE_URL}/upload/${encodeURIComponent(conferenceId)}`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: formData,
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al subir archivo'));
    return response.json();
  },

  listarArchivosConferencia: async (conferenceId) => {
    const response = await fetch(`${FILE_URL}/list/${encodeURIComponent(conferenceId)}`, {
      method: 'GET',
      headers: getAuthHeaders(false)
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al listar archivos'));
    return response.json();
  },

  descargarArchivoConferenciaBlob: async (conferenceId, fileId, nombreSugerido) => {
    if (!conferenceId || !fileId) throw new Error('conferenceId y fileId son obligatorios para descargar el archivo.');
    const response = await fetch(
      `${FILE_URL}/${encodeURIComponent(conferenceId)}/download/${encodeURIComponent(fileId)}`,
      { method: 'GET', headers: getAuthHeaders(false) }
    );
    if (!response.ok) throw new Error(await parseError(response, 'Error al descargar el archivo'));
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = resolveFilenameFromDisposition(disposition, nombreSugerido || 'file');
    return { blob, filename };
  },

  eliminarArchivoConferencia: async (fileId) => {
    const response = await fetch(`${FILE_URL}/delete/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false)
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al eliminar archivo'));
    if (response.status === 204) return { ok: true };
    return response.json();
  },

  // ─── Room Service ────────────────────────────────────────────────────────
  crearSala: async (conferenceId, datos) => {
    const response = await fetch(`${ROOM_URL}/conference/${encodeURIComponent(conferenceId)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: datos.name,
        capacity: Number(datos.capacity),
        type: datos.type || 'PRESENCIAL',
        locationOrLink: datos.locationOrLink || 'Por definir',
        topicHints: datos.topicHints || ''
      }),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al crear sala'));
    return response.json();
  },

  obtenerSalas: async (conferenceId) => {
    const response = await fetch(`${ROOM_URL}/conference/${encodeURIComponent(conferenceId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener salas'));
    return response.json();
  },

  // ─── Schedule Service ────────────────────────────────────────────────────
  crearSlotAgenda: async (conferenceId, datos) => {
    const response = await fetch(`${SCHEDULE_URL}/slots/conference/${encodeURIComponent(conferenceId)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        day: datos.day,
        roomId: datos.roomId,
        topic: datos.topic,
        startTime: datos.startTime,
        endTime: datos.endTime,
        maxPapers: Number(datos.maxPapers)
      }),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al crear slot de agenda'));
    return response.json();
  },

  obtenerSlots: async (conferenceId) => {
    const response = await fetch(`${SCHEDULE_URL}/slots/conference/${encodeURIComponent(conferenceId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener franjas horarias'));
    return response.json();
  },

  obtenerAgendaPorDia: async (conferenceId, day) => {
    const response = await fetch(`${SCHEDULE_URL}/conference/${encodeURIComponent(conferenceId)}/day/${encodeURIComponent(day)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener agenda'));
    return response.json();
  },

  obtenerAgendaPorSala: async (conferenceId, roomId) => {
    const response = await fetch(
      `${SCHEDULE_URL}/conference/${encodeURIComponent(conferenceId)}/room/${encodeURIComponent(roomId)}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener agenda por sala'));
    return response.json();
  },

  /**
   * Estado de pago/inscripción del usuario autenticado para una conferencia.
   * @returns {Promise<{ paid: boolean, registrationId: string|null, paymentStatus: 'PENDING'|'APPROVED'|null }>}
   */
  obtenerEstadoPagoInscripcion: async (conferenceId) => {
    if (!conferenceId) throw new Error('Identificador de conferencia no válido.');
    const response = await fetch(
      `${REG_URL}/payment-status?conferenceId=${encodeURIComponent(conferenceId)}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error(await parseError(response, 'Error al consultar el estado de pago'));
    return response.json();
  },

  /** Pago simulado de inscripción (multipart: conferenceId, file). Requiere JWT con rol asistente. */
  enviarPagoInscripcion: async (conferenceId, file) => {
    if (!conferenceId) throw new Error('Identificador de conferencia no válido.');
    if (!file) throw new Error('Debes adjuntar el comprobante de pago.');
    const formData = new FormData();
    formData.append('conferenceId', conferenceId);
    formData.append('file', file, file.name);
    const response = await fetch(`${REG_URL}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: formData,
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al enviar el pago'));
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  },

  obtenerRegistrosConferencia: async (conferenceId) => {
    const response = await fetch(`${REG_URL}/register-list?conferenceId=${encodeURIComponent(conferenceId)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener inscripciones'));
    return response.json();
  },

  aprobarPago: async (registrationId) => {
    const response = await fetch(`${REG_URL}/approve-payment?registrationId=${encodeURIComponent(registrationId)}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al aprobar pago'));
    return response.json();
  },

  // ─── User Service ────────────────────────────────────────────────────────

  buscarPonentes: async (query) => {
    const response = await fetch(`${USERS_URL}/paper-authors/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al buscar ponentes'));
    return response.json();
  },

  obtenerPonentesPorId: async (ids) => {
    if (!ids || ids.length === 0) return { authors: [] };
    const response = await fetch(`${USERS_URL}/paper-authors/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds: ids })
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener detalles de ponentes'));
    return response.json();
  },

  obtenerChairs: async () => {
    const response = await fetch(`${USERS_URL}/chairs`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener lista de chairs'));
    return response.json();
  },

  activarChair: async (id) => {
    const response = await fetch(`${USERS_URL}/chairs/${encodeURIComponent(id)}/activate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al activar chair'));
    return;
  },

  // ─── Notification Service ────────────────────────────────────────────────
  obtenerNotificacionesPaper: async (paperId) => {
    const response = await fetch(`${NOTIF_URL}/paper/${encodeURIComponent(paperId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener notificaciones'));
    return response.json();
  },
};