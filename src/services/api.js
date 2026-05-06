const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL ||
  import.meta.env.API_GATEWAY_URL;
const AUTH_URL = `${API_GATEWAY_URL}/api/v1/auth`;
const CONF_URL = `${API_GATEWAY_URL}/conferences`;
const PAPER_URL = `${API_GATEWAY_URL}/papers`;
const FILE_URL = `${API_GATEWAY_URL}/files`;

const getToken = () => localStorage.getItem('accessToken');

const getAuthHeaders = (isJson = true) => {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
};

/** Papers/files en este microservicio: permitAll; sin Authorization (contrato actual). */
const getPaperHeaders = (isJson = true) => {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
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
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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
      role: "AUTHOR"
    };

    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyBackend),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Error en el registro'));
    }

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
      speakers: normalizeStringList(datos.speakers),
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
      speakers: normalizeStringList(datos.speakers),
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

  /**
   * POST /papers/conference/{conferenceId}/create
   * multipart/form-data: parte "paper" = JSON (PaperCreateDto), partes "files" = adjuntos iniciales (opcional).
   */
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
      body: formData,
    });

    if (!response.ok) throw new Error(await parseError(response, 'Error al crear paper'));
    return response.json();
  },

  /** GET /papers/conference/{conferenceId}/evaluations-tray */
  obtenerBandejaEvaluacion: async (conferenceId) => {
    const response = await fetch(`${papersBase(conferenceId)}/evaluations-tray`, {
      method: 'GET',
      headers: getPaperHeaders()
    });

    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener bandeja de evaluación'));
    return response.json();
  },

  /** GET /papers/conference/{conferenceId}/list (?status=) */
  obtenerPapers: async (conferenceId, status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await fetch(`${papersBase(conferenceId)}/list${query}`, {
      method: 'GET',
      headers: getPaperHeaders()
    });

    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener papers'));
    return response.json();
  },

  /** GET /papers/conference/{conferenceId}/{paperId} */
  obtenerPaper: async (conferenceId, paperId) => {
    const response = await fetch(`${papersBase(conferenceId)}/${encodeURIComponent(paperId)}`, {
      method: 'GET',
      headers: getPaperHeaders()
    });

    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener el paper'));
    return response.json();
  },

  /** PATCH /papers/conference/{conferenceId}/{paperId}/evaluations */
  evaluarPaper: async (conferenceId, paperId, evaluacion) => {
    const response = await fetch(
      `${papersBase(conferenceId)}/${encodeURIComponent(paperId)}/evaluations`,
      {
        method: 'PATCH',
        headers: getPaperHeaders(),
        body: JSON.stringify(evaluacion),
      }
    );

    if (!response.ok) throw new Error(await parseError(response, 'Error al evaluar paper'));
    return response.json();
  },

  /** POST /papers/conference/{conferenceId}/{paperId}/attachments */
  subirAdjuntosPaper: async (conferenceId, paperId, files) => {
    if (!conferenceId || !paperId) {
      throw new Error('conferenceId y paperId son obligatorios.');
    }
    if (!files?.length) {
      throw new Error('Selecciona al menos un archivo.');
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    const response = await fetch(
      `${papersBase(conferenceId)}/${encodeURIComponent(paperId)}/attachments`,
      {
        method: 'POST',
        headers: getPaperHeaders(false),
        body: formData,
      }
    );

    if (!response.ok) throw new Error(await parseError(response, 'Error al subir adjuntos'));
    return response.json().catch(() => ({}));
  },

  /** GET /papers/conference/{conferenceId}/{paperId}/attachments/{attachmentId} */
  descargarAdjuntoPaperBlob: async (conferenceId, paperId, attachmentId, nombreSugerido) => {
    if (!conferenceId || !paperId || !attachmentId) {
      throw new Error('conferenceId, paperId y attachmentId son obligatorios.');
    }
    const response = await fetch(
      `${papersBase(conferenceId)}/${encodeURIComponent(paperId)}/attachments/${encodeURIComponent(attachmentId)}`,
      {
        method: 'GET',
        headers: getPaperHeaders(false),
      }
    );

    if (!response.ok) {
      throw new Error(await parseError(response, 'Error al descargar el adjunto'));
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = resolveFilenameFromDisposition(disposition, nombreSugerido || 'adjunto');
    return { blob, filename };
  },

  /** POST /files/upload/{conferenceId} (multipart, campo file) */
  subirArchivoConferencia: async (conferenceId, file) => {
    if (!conferenceId) {
      throw new Error('conferenceId es obligatorio para subir archivos.');
    }
    if (!file) {
      throw new Error('Debes seleccionar un archivo para subir.');
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    const response = await fetch(`${FILE_URL}/upload/${encodeURIComponent(conferenceId)}`, {
      method: 'POST',
      headers: getPaperHeaders(false),
      body: formData,
    });

    if (!response.ok) throw new Error(await parseError(response, 'Error al subir archivo'));
    return response.json();
  },

  listarArchivosConferencia: async (conferenceId) => {
    const response = await fetch(`${FILE_URL}/list/${encodeURIComponent(conferenceId)}`, {
      method: 'GET',
      headers: getPaperHeaders()
    });

    if (!response.ok) throw new Error(await parseError(response, 'Error al listar archivos'));
    return response.json();
  },

  /** GET /files/{conferenceId}/download/{fileId} */
  descargarArchivoConferenciaBlob: async (conferenceId, fileId, nombreSugerido) => {
    if (!conferenceId || !fileId) {
      throw new Error('conferenceId y fileId son obligatorios para descargar el archivo.');
    }
    const response = await fetch(
      `${FILE_URL}/${encodeURIComponent(conferenceId)}/download/${encodeURIComponent(fileId)}`,
      {
        method: 'GET',
        headers: getPaperHeaders(false),
      }
    );

    if (!response.ok) {
      throw new Error(await parseError(response, 'Error al descargar el archivo'));
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = resolveFilenameFromDisposition(disposition, nombreSugerido || 'file');
    return { blob, filename };
  },

  eliminarArchivoConferencia: async (fileId) => {
    const response = await fetch(`${FILE_URL}/delete/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: getPaperHeaders()
    });

    if (!response.ok) throw new Error(await parseError(response, 'Error al eliminar archivo'));
    if (response.status === 204) return { ok: true };
    return response.json();
  },

  crearEspacio: async (conferenceId, datos) => {
    const body = {
      day: datos.day,
      room: datos.room,
      topic: datos.topic,
      startTime: datos.startTime,
      endTime: datos.endTime,
      capacity: Number(datos.capacity),
    };

    const response = await fetch(
      `${CONF_URL}/${encodeURIComponent(conferenceId)}/spaces/create`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) throw new Error(await parseError(response, 'Error al crear espacio'));
    return response.json();
  },

  obtenerEspacios: async (conferenceId) => {
    const response = await fetch(
      `${CONF_URL}/${encodeURIComponent(conferenceId)}/spaces`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) throw new Error(await parseError(response, 'Error al obtener espacios'));
    return response.json();
  },

  eliminarEspacio: async (conferenceId, spaceId) => {
    const response = await fetch(
      `${CONF_URL}/${encodeURIComponent(conferenceId)}/spaces/${encodeURIComponent(spaceId)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) throw new Error(await parseError(response, 'Error al eliminar espacio'));
    if (response.status === 204) return { ok: true };
    return response.json().catch(() => ({ ok: true }));
  },
};
