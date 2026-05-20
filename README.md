# Sistema de conferencias frontend

Frontend de ConfManager construido con React 19, Vite y React Router. La aplicacion permite descubrir conferencias, autenticar usuarios, crear y editar eventos, enviar articulos, gestionar adjuntos/evaluaciones, configurar salas y franjas horarias, y completar inscripciones de asistentes contra un API Gateway.

## Stack y estructura

- `src/App.jsx`: declara las rutas publicas de la SPA y el redirect legacy de evaluacion.
- `src/components/`: vistas y flujos de usuario.
- `src/services/api.js`: cliente HTTP centralizado para auth, conferencias, papers, archivos, salas, agenda, inscripciones y notificaciones.
- `src/styles/components/`: estilos CSS por componente, mas utilidades compartidas como `shared-forms.css`.
- `vite.config.js`: configura React, prefijos de variables de entorno y `vite preview` con hosts permitidos.

## Configuracion local

Requisitos:

- Node.js compatible con Vite 8.
- Un API Gateway accesible desde el navegador.

Instalacion y ejecucion:

```bash
npm install
cp .env.example .env.local # si existe en tu entorno; este repo no versiona .env
npm run dev
```

Define una de estas variables antes de iniciar Vite:

```bash
VITE_API_GATEWAY_URL=http://localhost:8080
# o, por compatibilidad con vite.config.js:
API_GATEWAY_URL=http://localhost:8080
```

`src/services/api.js` espera que esa URL base no termine en una ruta especifica; el cliente agrega los segmentos `/api/v1/auth`, `/conferences`, `/papers`, `/files`, `/rooms`, `/schedule`, `/registrations` y `/notifications`.

Comandos disponibles:

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor local de Vite con HMR. |
| `npm run build` | Build de produccion en `dist/`. |
| `npm run preview` | Sirve el build localmente con Vite. |
| `npm run start` | Preview para despliegue, usando `--host 0.0.0.0 --port $PORT`. |
| `npm run lint` | ESLint sobre archivos JS/JSX. |

## Rutas principales

| Ruta | Componente | Proposito |
| --- | --- | --- |
| `/` | `Home` | Landing inicial con acceso al catalogo. |
| `/iniciar-sesion` | `Login` | Autentica al usuario y guarda `accessToken`, `userName` y `userRole` en `localStorage`. |
| `/registro` | `Registro` | Registra usuarios con rol seleccionable (`ADMIN`, `CHAIR`, `AUTHOR`, `ASISTANT`). |
| `/conferencias` | `Conferencias` | Lista conferencias, aplica busqueda local por nombre o categoria y enlaza al detalle. |
| `/salas` | `Salas` | Catalogo global de salas; el enlace de navbar/home solo aparece para `ADMIN`. |
| `/conferencia/:id` | `LandingConferencia` | Muestra detalle de conferencia, fechas, ponentes, topicos y acciones. |
| `/conferencia/:id/inscripcion` | `InscripcionAsistente` | Permite a asistentes subir comprobante de pago y revisar estado de inscripcion. |
| `/crear-conferencia` | `CrearConferencia` | Crea eventos y normaliza topicos/ponentes separados por coma. |
| `/editar-conferencia/:id` | `EditarConferencia` | Carga, actualiza o elimina una conferencia existente. |
| `/enviar-articulo/:conferenciaId` | `EnviarArticulo` | Crea un paper con metadatos y adjuntos iniciales opcionales. |
| `/conferencia/:conferenciaId/articulo/:paperId` | `DetalleArticulo` | Consulta, descarga/previsualiza adjuntos PDF, agrega archivos y actualiza estado de evaluacion. |
| `/conferencia/:conferenciaId/evaluaciones` | `BandejaEvaluacion` | Lista papers pendientes para evaluacion y navega al detalle con `#evaluar-articulo`. |
| `/conferencia/:conferenciaId/papers/:paperId/evaluar` | `EvaluarArticuloRedirect` | Compatibilidad con enlaces antiguos: redirige al detalle del articulo con hash de evaluacion. |
| `/conferencia/:conferenciaId/programacion` | `ProgramacionSalas` | Muestra la agenda por sala para usuarios `ADMIN` o `CHAIR` desde el catalogo. |
| `/conferencia/:conferenceId/espacios` | `ConfigurarEspacios` | Crea franjas horarias por dia, sala, topico y capacidad. |
| `/conferencia/:conferenciaId/salas` | `SalasConferencia` | Crea y lista salas asociadas a una conferencia. |

Todas las rutas se renderizan dentro de `Layout`, que incluye `Navbar` y `Footer`.

## Roles y permisos visibles en la UI

El frontend obtiene `userRole` decodificando el claim `role` del JWT recibido en `Login` y lo persiste en `localStorage`. Ese valor controla enlaces, botones y algunos formularios; el backend debe seguir aplicando la autorizacion definitiva.

| Rol | Acciones expuestas por la UI |
| --- | --- |
| `ADMIN` | Crear conferencias, editar/eliminar conferencias, acceder al catalogo global de salas, crear salas por conferencia y configurar franjas horarias. |
| `CHAIR` | Abrir la bandeja de evaluacion desde el detalle de conferencia, evaluar articulos en `DetalleArticulo` y ver la programacion por sala. |
| `AUTHOR` | Enviar articulos, ver "Mis Articulos" cuando sus papers aparecen asociados a su nombre y subir correcciones/adjuntos desde el detalle del articulo mientras el estado lo permita. |
| `ASISTANT` / `ASSISTANT` | Consultar el estado de pago, entrar a `/conferencia/:id/inscripcion` y subir comprobante de inscripcion. |

> Nota: las validaciones actuales del frontend aceptan `ASISTANT` y `ASSISTANT` al identificar cuentas de asistente.

## Contrato del API Gateway

El cliente vive en `src/services/api.js` y usa `fetch`. Los errores HTTP se convierten en mensajes legibles con `parseError`, incluyendo `message`, `detail`, `error`, `fieldErrors` o `errors` cuando el backend los envia.

### Autenticacion

- `POST /api/v1/auth/login`
  - Body enviado: `{ email, password }`, mapeado desde el formulario `{ correo, password }`.
  - Si la respuesta contiene `accessToken`, `Login` lo guarda en `localStorage`, decodifica el payload JWT y persiste `userRole` cuando existe el claim `role`.
  - Si la respuesta contiene `name`, tambien persiste `userName`.
- `POST /api/v1/auth/register`
  - Body enviado con `documentType: "CC"`, el rol elegido en el formulario y valores por defecto para institucion, pais y ciudad.
  - Roles permitidos en el cliente: `ADMIN`, `CHAIR`, `AUTHOR`, `ASISTANT`; si llega un valor inesperado, se usa `AUTHOR`.
  - `documentNumber` se genera en frontend con timestamp y aleatorio para evitar colisiones simples.

Las peticiones que usan `getAuthHeaders()` agregan `Authorization: Bearer <accessToken>` cuando existe token. Si se llama con `false`, se omite `Content-Type: application/json` para permitir `multipart/form-data`, pero el token se sigue enviando si esta disponible.

### Conferencias

Base: `/conferences`

- `GET /get-all`: catalogo de conferencias.
- `GET /get/{id}`: detalle de conferencia.
- `POST /create`: crea conferencia.
- `PUT /edit/{id}`: edita conferencia.
- `DELETE /delete/{id}`: elimina conferencia.

Campos enviados al crear/editar:

```json
{
  "name": "Conferencia IA 2026",
  "description": "Evento sobre IA aplicada",
  "location": "Bogota",
  "virtual": false,
  "inscriptionPrice": 0,
  "startDate": "2026-05-01",
  "endDate": "2026-05-03",
  "submissionDeadline": "2026-05-02",
  "topics": ["IA", "Microservicios"],
  "speakers": ["Ana Perez", "Luis Gomez"],
  "state": "PUBLISHED"
}
```

Restricciones implementadas en UI:

- `CrearConferencia` rechaza `endDate < startDate`.
- `CrearConferencia` exige que `submissionDeadline` quede entre inicio y fin.
- `topics` y `speakers` se ingresan como texto separado por comas y se normalizan a arreglos.
- Estados disponibles: `DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `CLOSED`, `ACTIVE`.

### Papers y adjuntos

Base: `/papers/conference/{conferenceId}`

- `POST /create`: crea un paper en `multipart/form-data`.
  - Parte `paper`: JSON de `PaperCreateDto`.
  - Parte `files`: cero o mas adjuntos iniciales.
- `GET /{paperId}`: detalle del paper.
- `GET /list?status=`: lista papers de una conferencia.
- `GET /evaluations-tray`: bandeja de evaluacion.
- `PATCH /{paperId}/evaluations`: actualiza `status` y `observations`.
- `POST /{paperId}/attachments`: agrega adjuntos.
- `GET /{paperId}/attachments/{attachmentId}`: descarga adjunto como blob.

`EnviarArticulo` valida que `conferenceId` sea numerico positivo o UUID, y que los campos de texto no queden vacios. Los adjuntos aceptados en UI son `.pdf`, `.doc` y `.docx`.

La bandeja de evaluacion (`/conferencia/:conferenciaId/evaluaciones`) requiere sesion en el frontend. El boton "Evaluar" navega a `/conferencia/{conferenciaId}/articulo/{paperId}#evaluar-articulo`, donde `DetalleArticulo` muestra el formulario de estado/observaciones para `ADMIN` y `CHAIR`.

Estados de paper mostrados por `DetalleArticulo`:

- `SUBMITTED`
- `ACCEPTED`
- `REJECTED`
- `IN_CORRECTIONS`
- `PRESENTED`
- `PUBLISHED`

### Salas y programacion

Las pantallas de salas y agenda usan los servicios `/rooms` y `/schedule` para preparar espacios de presentacion por conferencia.

Base salas: `/rooms`

- `POST /conference/{conferenceId}`: crea una sala.
- `GET /conference/{conferenceId}`: lista salas de una conferencia.

Payload enviado al crear sala:

```json
{
  "name": "Auditorio Principal",
  "capacity": 120,
  "type": "PRESENCIAL",
  "locationOrLink": "Edificio A, Piso 3",
  "topicHints": "IA, Cloud"
}
```

Restricciones implementadas en UI:

- `type` se elige entre `PRESENCIAL`, `VIRTUAL` e `HIBRIDA`; si no hay valor, el cliente usa `PRESENCIAL`.
- `locationOrLink` es obligatorio en `SalasConferencia`; el servicio tiene fallback `"Por definir"`.
- `topicHints` se ingresa como texto libre y se muestra como chips separados por coma.

Base programacion: `/schedule`

- `POST /slots/conference/{conferenceId}`: crea una franja horaria.
- `GET /slots/conference/{conferenceId}`: lista franjas de una conferencia.
- `GET /conference/{conferenceId}/day/{day}`: contrato disponible en `apiService`; no hay pantalla que lo consuma actualmente.
- `GET /conference/{conferenceId}/room/{roomId}`: agenda por sala usada por `ProgramacionSalas`.

Payload enviado al crear slot:

```json
{
  "day": "2026-05-01",
  "roomId": "12",
  "topic": "IA",
  "startTime": "09:00:00",
  "endTime": "10:30:00",
  "maxPapers": 4
}
```

`ConfigurarEspacios` genera la lista de dias entre `startDate` y `endDate`, toma topicos desde la conferencia, valida que `endTime` sea posterior a `startTime` y consulta slots existentes para impedir cruces en la misma sala/dia antes de crear una franja. La eliminacion de espacios aun no esta disponible en el backend; la UI muestra ese mensaje cuando se intenta borrar.

### Inscripciones de asistentes

Base: `/registrations`

- `GET /payment-status?conferenceId={conferenceId}`: devuelve el estado de pago del usuario autenticado para una conferencia.
- `POST /pay`: envia un pago simulado en `multipart/form-data` con campos `conferenceId` y `file`.

Respuesta esperada por el cliente al consultar estado:

```json
{
  "paid": false,
  "registrationId": null,
  "paymentStatus": "PENDING"
}
```

`InscripcionAsistente` exige sesion y rol de asistente antes de enviar el comprobante. La vista acepta imagenes o PDF (`accept="image/*,.pdf"`). `LandingConferencia` muestra tres estados para asistentes: pago aprobado, comprobante pendiente de revision o boton "Comprar Entrada".

### Archivos de conferencia

Base: `/files`

- `POST /upload/{conferenceId}`: sube un archivo con campo `file`.
- `GET /list/{conferenceId}`: lista archivos de conferencia.
- `GET /{conferenceId}/download/{fileId}`: descarga archivo como blob.
- `DELETE /delete/{fileId}`: elimina archivo.

Este contrato esta implementado en `apiService`, pero no hay una pantalla de UI que gestione archivos de conferencia en la version actual. Las llamadas usan `getAuthHeaders(false)`: no fijan `Content-Type` para que el navegador arme el multipart, pero si agregan `Authorization` cuando hay token.

### Notificaciones

Base: `/notifications`

- `GET /paper/{paperId}`: obtiene notificaciones asociadas a un paper.

El cliente expone `obtenerNotificacionesPaper`, pero actualmente no hay componente que consuma este metodo.

## Flujos de desarrollo comunes

### Agregar una vista nueva

1. Crear el componente en `src/components/NombreVista.jsx`.
2. Agregar sus estilos en `src/styles/components/nombre-vista.css` e importarlos desde el componente.
3. Registrar la ruta en `src/App.jsx`.
4. Si necesita backend, agregar una funcion en `apiService` para mantener el contrato HTTP centralizado.
5. Enlazar desde `Navbar`, `LandingConferencia` u otra vista segun corresponda.

### Cambiar un contrato de backend

1. Actualizar primero la funcion correspondiente en `src/services/api.js`.
2. Ajustar los formularios o mapeos que consumen esa funcion.
3. Revisar mensajes de error: `parseError` ya soporta texto plano, JSON con `message/detail/error` y listas de errores de campo.
4. Ejecutar `npm run lint` y `npm run build`.

## Despliegue

El script `npm run start` ejecuta:

```bash
vite preview --host 0.0.0.0 --port $PORT
```

Esto asume que la plataforma de despliegue define `PORT`. Tambien debes configurar `VITE_API_GATEWAY_URL` o `API_GATEWAY_URL` en el entorno del build/runtime usado por Vite.

## Troubleshooting

- **Las llamadas salen a `undefined/...`**: falta `VITE_API_GATEWAY_URL` o `API_GATEWAY_URL`. Reinicia Vite despues de definirla.
- **401/403 en conferencias, evaluaciones, salas o inscripciones**: revisa que `Login` haya recibido `accessToken`, que exista en `localStorage` y que el JWT incluya el `role` esperado.
- **La UI no muestra acciones de rol**: confirma que `userRole` este en `localStorage`; se escribe al iniciar sesion decodificando el JWT.
- **El comprobante de inscripcion no se envia**: se requiere sesion, rol `ASISTANT`/`ASSISTANT` y archivo seleccionado; la UI acepta imagenes o PDF.
- **No se pueden crear franjas horarias**: primero debe existir al menos una sala en la conferencia; ademas la UI bloquea cruces de horario en la misma sala/dia.
- **No se puede previsualizar un adjunto**: la vista previa solo se habilita para PDF detectado por `contentType` o extension `.pdf`; otros formatos deben descargarse.
- **Nombre de descarga inesperado**: si el backend no envia `Content-Disposition`, el frontend usa `adjunto` o `file` como nombre por defecto.
- **Fechas desplazadas por zona horaria**: las fechas con formato `YYYY-MM-DD` se normalizan creando `Date(year, month, day)` para evitar conversion UTC en catalogo y detalle.
