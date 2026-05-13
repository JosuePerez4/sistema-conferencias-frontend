# Sistema de conferencias frontend

Frontend de ConfManager construido con React 19, Vite y React Router. La aplicacion permite descubrir conferencias, autenticar usuarios, crear y editar eventos, enviar articulos, gestionar evaluaciones, configurar salas/agenda y registrar pagos de inscripcion contra un API Gateway.

## Stack y estructura

- `src/App.jsx`: declara las rutas publicas de la SPA y redirects de compatibilidad.
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
| `/iniciar-sesion` | `Login` | Autentica al usuario y guarda `accessToken`, `userName` y, si el JWT lo incluye, `userRole` en `localStorage`. |
| `/registro` | `Registro` | Registra usuarios con rol elegido en UI (`ADMIN`, `CHAIR`, `AUTHOR`, `ASISTANT`). |
| `/conferencias` | `Conferencias` | Lista conferencias, aplica busqueda local por nombre o categoria y enlaza al detalle. |
| `/salas` | `Salas` | Vista global de salas por conferencia; disponible desde la navegacion para administradores. |
| `/conferencia/:id` | `LandingConferencia` | Muestra detalle de conferencia, fechas, ponentes, topicos y acciones. |
| `/conferencia/:id/inscripcion` | `InscripcionAsistente` | Permite a asistentes enviar comprobante de pago y ver estado de inscripcion. |
| `/crear-conferencia` | `CrearConferencia` | Crea eventos y normaliza topicos/ponentes separados por coma. |
| `/editar-conferencia/:id` | `EditarConferencia` | Carga, actualiza o elimina una conferencia existente. |
| `/enviar-articulo/:conferenciaId` | `EnviarArticulo` | Crea un paper con metadatos y adjuntos iniciales opcionales. |
| `/conferencia/:conferenciaId/articulo/:paperId` | `DetalleArticulo` | Consulta, descarga/previsualiza adjuntos PDF, agrega archivos y actualiza estado de evaluacion. |
| `/conferencia/:conferenciaId/evaluaciones` | `BandejaEvaluacion` | Bandeja de evaluacion para chairs; enlaza al detalle con `#evaluar-articulo`. |
| `/conferencia/:conferenciaId/papers/:paperId/evaluar` | `EvaluarArticuloRedirect` | Redirect compatible hacia `/conferencia/:conferenciaId/articulo/:paperId#evaluar-articulo`. |
| `/conferencia/:conferenciaId/programacion` | `ProgramacionSalas` | Programacion por sala con franjas ordenadas por dia y hora. |
| `/conferencia/:conferenceId/espacios` | `ConfigurarEspacios` | Configura franjas de presentacion asociadas a salas. |
| `/conferencia/:conferenciaId/salas` | `SalasConferencia` | Lista y crea salas para una conferencia especifica. |

Todas las rutas se renderizan dentro de `Layout`, que incluye `Navbar` y `Footer`.

## Navegacion y roles

El rol se lee desde `localStorage.userRole`, guardado por `Login` al decodificar el JWT. La UI usa ese valor para mostrar acciones, pero la autorizacion final depende del backend.

| Rol | Accesos visibles en UI |
| --- | --- |
| `ADMIN` | En `Navbar`: `Salas` y `Crear Evento`. En detalle de conferencia: editar conferencia, configurar espacios y ver salas. |
| `CHAIR` | En detalle de conferencia: bandeja `Evaluar Articulos`. En catalogo: boton `Ver programacion`. |
| `AUTHOR` | En detalle de conferencia: enviar articulo y, si tiene articulos asociados por nombre de autor, lista `Mis Articulos`. |
| `ASISTANT` / `ASSISTANT` | En detalle de conferencia: estado de pago e ingreso a compra si no hay pago aprobado o pendiente. |

Para probar flujos por rol en local, inicia sesion con un JWT que incluya `role`; cerrar sesion elimina `accessToken`, `userName` y `userRole`.

## Contrato del API Gateway

El cliente vive en `src/services/api.js` y usa `fetch`. Los errores HTTP se convierten en mensajes legibles con `parseError`, incluyendo `message`, `detail`, `error`, `fieldErrors` o `errors` cuando el backend los envia.

### Autenticacion

- `POST /api/v1/auth/login`
  - Body enviado: `{ email, password }`, mapeado desde el formulario `{ correo, password }`.
  - Si la respuesta contiene `accessToken`, `Login` lo guarda en `localStorage` y trata de extraer `role` del JWT para persistir `userRole`.
  - Si la respuesta contiene `name`, se guarda como `userName`.
- `POST /api/v1/auth/register`
  - Body enviado con `documentType: "CC"`, `role` normalizado a `ADMIN`, `CHAIR`, `AUTHOR` o `ASISTANT`, y valores por defecto para institucion, pais y ciudad.
  - Si la UI o el payload entregan un rol no permitido, `apiService.registro` usa `AUTHOR`.
  - `documentNumber` se genera en frontend con timestamp y aleatorio para evitar colisiones simples.

Las funciones del cliente agregan `Authorization: Bearer <accessToken>` cuando existe token. En llamadas `multipart/form-data` o descargas se usa `getAuthHeaders(false)`: no define `Content-Type`, pero conserva `Authorization` si hay sesion.

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

Estados de paper mostrados por `DetalleArticulo`:

- `SUBMITTED`
- `ACCEPTED`
- `REJECTED`
- `IN_CORRECTIONS`
- `PRESENTED`
- `PUBLISHED`

### Archivos de conferencia

Base: `/files`

- `POST /upload/{conferenceId}`: sube un archivo con campo `file`.
- `GET /list/{conferenceId}`: lista archivos de conferencia.
- `GET /{conferenceId}/download/{fileId}`: descarga archivo como blob.
- `DELETE /delete/{fileId}`: elimina archivo.

### Salas y agenda

Base salas: `/rooms`

- `GET /conference/{conferenceId}`: lista salas de una conferencia.
- `POST /conference/{conferenceId}`: crea una sala.

Payload de sala enviado por `SalasConferencia`:

```json
{
  "name": "Auditorio Principal",
  "capacity": 120,
  "type": "PRESENCIAL",
  "locationOrLink": "Edificio A, Piso 3",
  "topicHints": "IA, Cloud"
}
```

Restricciones de UI:

- `name` y `locationOrLink` son obligatorios.
- `capacity` se envia como numero.
- `type` puede ser `PRESENCIAL`, `VIRTUAL` o `HIBRIDA`.
- `Salas` arma la vista global consultando conferencias y luego salas por conferencia; si una conferencia falla al cargar salas, se omite de esa agregacion.

Base agenda: `/schedule`

- `POST /slots/conference/{conferenceId}`: crea una franja horaria.
- `GET /slots/conference/{conferenceId}`: lista franjas de una conferencia.
- `GET /conference/{conferenceId}/day/{day}`: obtiene agenda por dia.
- `GET /conference/{conferenceId}/room/{roomId}`: obtiene programacion de una sala.

Payload de franja enviado por `ConfigurarEspacios`:

```json
{
  "day": "2026-05-01",
  "roomId": "room-1",
  "topic": "IA",
  "startTime": "09:00:00",
  "endTime": "10:30:00",
  "maxPapers": 10
}
```

`ConfigurarEspacios` carga los dias entre `startDate` y `endDate`, exige sala/topico/hora inicio/hora fin, convierte horas a formato `HH:mm:ss` y valida cruces contra las franjas existentes de la misma sala y dia antes de crear. La eliminacion de espacios aun no esta disponible en el backend: el boton muestra un mensaje informativo.

`ProgramacionSalas` muestra las salas de una conferencia, consulta `/schedule/conference/{conferenceId}/room/{roomId}` al cambiar de sala y ordena las franjas por dia y hora. El catalogo muestra `Ver programacion` para usuarios autenticados con rol `ADMIN` o `CHAIR`.

### Inscripciones y pagos

Base: `/registrations`

- `GET /payment-status?conferenceId={conferenceId}`: estado de pago/inscripcion del usuario autenticado para una conferencia.
- `POST /pay`: envia comprobante de pago en `multipart/form-data`.
  - Campos: `conferenceId` y `file`.

`LandingConferencia` consulta el estado de pago solo para roles `ASISTANT` o `ASSISTANT`. Si el pago esta aprobado (`paid: true`), muestra la inscripcion activa; si `paymentStatus` es `PENDING`, indica que el comprobante esta en revision; en otro caso enlaza a `/conferencia/:id/inscripcion`.

`InscripcionAsistente` valida que exista `accessToken`, que el rol local sea asistente y que se adjunte un archivo antes de llamar a `enviarPagoInscripcion`. El selector de archivo acepta imagenes y PDF (`image/*,.pdf`).

### Notificaciones

Base: `/notifications`

- `GET /paper/{paperId}`: `apiService.obtenerNotificacionesPaper`.

El cliente HTTP existe, pero no hay una vista que consuma esta funcion en el frontend actual.

## Flujos de desarrollo comunes

### Agregar una vista nueva

1. Crear el componente en `src/components/NombreVista.jsx`.
2. Agregar sus estilos en `src/styles/components/nombre-vista.css` e importarlos desde el componente.
3. Registrar la ruta en `src/App.jsx`.
4. Si necesita backend, agregar una funcion en `apiService` para mantener el contrato HTTP centralizado.
5. Enlazar desde `Navbar`, `LandingConferencia` u otra vista segun corresponda.

### Agregar o cambiar acciones por rol

1. Revisar donde se lee `localStorage.userRole` (`Navbar`, `LandingConferencia`, `Conferencias`, `DetalleArticulo` e `InscripcionAsistente`).
2. Mantener nombres de rol consistentes con el backend. El asistente se registra como `ASISTANT`, pero algunos flujos tambien aceptan `ASSISTANT` por compatibilidad.
3. No confiar solo en ocultar botones: el backend debe validar permisos de cada endpoint.

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

- **Las llamadas salen al host incorrecto**: si no defines `VITE_API_GATEWAY_URL` o `API_GATEWAY_URL`, el cliente usa `http://localhost:8080`. Reinicia Vite despues de cambiar la variable.
- **401/403 en llamadas autenticadas**: revisa que `Login` haya recibido `accessToken` y que exista en `localStorage`.
- **No aparecen botones de admin/chair/author/asistente**: confirma que el JWT tenga un claim `role` y que `localStorage.userRole` se haya actualizado; cierra sesion y vuelve a iniciar si cambiaste de usuario.
- **No se puede previsualizar un adjunto**: la vista previa solo se habilita para PDF detectado por `contentType` o extension `.pdf`; otros formatos deben descargarse.
- **Nombre de descarga inesperado**: si el backend no envia `Content-Disposition`, el frontend usa `adjunto` o `file` como nombre por defecto.
- **Fechas desplazadas por zona horaria**: las fechas con formato `YYYY-MM-DD` se normalizan creando `Date(year, month, day)` para evitar conversion UTC en catalogo y detalle.
- **No se puede crear una franja horaria**: primero debe existir al menos una sala para la conferencia; ademas la hora de fin debe ser posterior a la de inicio y no cruzarse con otra franja de la misma sala/dia.
- **Compra de entrada bloqueada**: el flujo solo envia comprobantes para roles `ASISTANT`/`ASSISTANT` con sesion activa y archivo adjunto; si el estado esta `PENDING`, la UI espera aprobacion del backend.
