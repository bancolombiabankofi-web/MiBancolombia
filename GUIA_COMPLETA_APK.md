# GUÍA COMPLETA — Mi Bancolombia APK
## Conexión, Sincronización y Compilación desde GitHub Actions
**Versión del documento:** 1.0 — 25 de junio de 2026  
**Proyecto desplegado:** https://bancolombia--bankbancolombia.replit.app

---

## ÍNDICE
1. [Arquitectura general del sistema](#1-arquitectura-general-del-sistema)
2. [URLs y dominios del sistema](#2-urls-y-dominios-del-sistema)
3. [Variable de entorno crítica](#3-variable-de-entorno-crítica)
4. [Cómo el APK se conecta al servidor](#4-cómo-el-apk-se-conecta-al-servidor)
5. [Catálogo completo de endpoints de la API](#5-catálogo-completo-de-endpoints-de-la-api)
6. [Estructura de datos (modelos)](#6-estructura-de-datos-modelos)
7. [Workflow de GitHub Actions — archivo completo](#7-workflow-de-github-actions--archivo-completo)
8. [Archivos de configuración del proyecto](#8-archivos-de-configuración-del-proyecto)
9. [Pasos exactos para compilar el APK en GitHub](#9-pasos-exactos-para-compilar-el-apk-en-github)
10. [Sincronización en tiempo real](#10-sincronización-en-tiempo-real)
11. [Preguntas frecuentes y errores comunes](#11-preguntas-frecuentes-y-errores-comunes)

---

## 1. ARQUITECTURA GENERAL DEL SISTEMA

El sistema tiene **tres clientes** que comparten **un único backend y una única base de datos**:

```
┌────────────────────────────────────────────────────────────┐
│            BASE DE DATOS PostgreSQL (Replit)               │
│         Única. Todos los clientes leen y escriben aquí.    │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│            API SERVER (Express 5 + Node 24)                │
│   URL: https://bancolombia--bankbancolombia.replit.app/api │
│   Puerto interno: 3001 (proxy Replit lo expone en 443)     │
└────────┬─────────────────────┬────────────────────┬────────┘
         │                     │                    │
┌────────▼──────┐  ┌───────────▼──────┐  ┌─────────▼──────┐
│  APK Android  │  │   PWA (web app   │  │  Web browser   │
│  (compilado   │  │   instalable)    │  │  (versión web  │
│  en GitHub)   │  │                  │  │   normal)      │
└───────────────┘  └──────────────────┘  └────────────────┘
```

**Regla clave:** Ningún cliente guarda datos propios de forma permanente.
Todo se guarda en la base de datos remota. Cualquier cambio es visible
inmediatamente en todos los dispositivos.

---

## 2. URLs Y DOMINIOS DEL SISTEMA

| Recurso | URL completa |
|---|---|
| **App web / PWA (raíz)** | `https://bancolombia--bankbancolombia.replit.app/` |
| **API base** | `https://bancolombia--bankbancolombia.replit.app/api` |
| **Health check** | `https://bancolombia--bankbancolombia.replit.app/api/healthz` |
| **Login** | `https://bancolombia--bankbancolombia.replit.app/api/auth/login` |
| **Usuarios** | `https://bancolombia--bankbancolombia.replit.app/api/users` |
| **Cuentas** | `https://bancolombia--bankbancolombia.replit.app/api/accounts` |
| **Transacciones** | `https://bancolombia--bankbancolombia.replit.app/api/transactions` |
| **Tarjetas** | `https://bancolombia--bankbancolombia.replit.app/api/cards` |
| **Radicados** | `https://bancolombia--bankbancolombia.replit.app/api/radicados` |
| **Eventos de login** | `https://bancolombia--bankbancolombia.replit.app/api/login-events` |
| **Auditoría** | `https://bancolombia--bankbancolombia.replit.app/api/audit-logs` |
| **Cambios de PIN** | `https://bancolombia--bankbancolombia.replit.app/api/pin-changes` |
| **Configuración** | `https://bancolombia--bankbancolombia.replit.app/api/settings` |
| **Eventos PWA** | `https://bancolombia--bankbancolombia.replit.app/api/pwa-events` |

---

## 3. VARIABLE DE ENTORNO CRÍTICA

Esta es la única variable que necesita el APK para conectarse al backend remoto.

| Nombre de la variable | Valor exacto |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://bancolombia--bankbancolombia.replit.app` |

**Por qué existe esta variable:**  
La app corre en web (PWA) y en Android (APK). En web, las peticiones al
API usan rutas relativas (`/api/...`) porque el servidor web y el API
comparten el mismo dominio. En Android no hay dominio base, así que
la app necesita la URL completa. Esta variable le dice al APK a qué
servidor debe apuntar.

**Cómo se usa en el código** (`artifacts/mi-bancolombia/utils/api.ts`):
```typescript
// En web/PWA → ruta relativa:  apiUrl("/api/users") = "/api/users"
// En APK     → ruta absoluta:  apiUrl("/api/users") = "https://bancolombia--bankbancolombia.replit.app/api/users"
const _base =
  Platform.OS === "web"
    ? ""
    : (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${_base}${path}`;
}
```

**Prefijo `EXPO_PUBLIC_`:**  
El prefijo `EXPO_PUBLIC_` es obligatorio en Expo/React Native. Solo las
variables con ese prefijo son accesibles dentro del código del cliente.
Sin ese prefijo, la variable existe en el servidor de compilación pero
el APK no puede leerla y todas las peticiones fallan.

---

## 4. CÓMO EL APK SE CONECTA AL SERVIDOR

El flujo de una petición desde el APK es el siguiente:

```
APK Android
    │
    │  1. Llama a apiUrl("/api/auth/login")
    │     → Resultado: "https://bancolombia--bankbancolombia.replit.app/api/auth/login"
    │
    │  2. fetch(url, { method: "POST", body: JSON.stringify({ documentNumber, pin }) })
    │
    ▼
https://bancolombia--bankbancolombia.replit.app  (Replit Proxy — HTTPS/443)
    │
    ▼
API Server interno en puerto 3001
    │
    ▼
Base de datos PostgreSQL de Replit
    │
    ▼
Respuesta JSON → APK actualiza pantalla
```

No hay caché, no hay datos locales persistentes más allá de la sesión
activa en memoria. Cada vez que el APK abre una pantalla, hace una
petición nueva al servidor real.

---

## 5. CATÁLOGO COMPLETO DE ENDPOINTS DE LA API

**Base URL para el APK:** `https://bancolombia--bankbancolombia.replit.app/api`  
**Todos los cuerpos de petición y respuesta son JSON.**  
**Header requerido en POST/PUT:** `Content-Type: application/json`

---

### 5.1 SALUD DEL SERVIDOR

#### `GET /healthz`
Comprueba que el servidor está en línea.

**Respuesta exitosa (200):**
```json
{ "status": "ok" }
```

---

### 5.2 AUTENTICACIÓN

#### `POST /auth/login`
Autentica a un usuario con su documento y PIN.

**Body requerido:**
```json
{
  "documentNumber": "1234567890",
  "pin": "1234"
}
```

**Respuesta exitosa (200):** Devuelve el objeto completo del usuario.
```json
{
  "user": {
    "id": "uuid-del-usuario",
    "documentNumber": "1234567890",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "status": "active",
    "isAdmin": false,
    ...
  }
}
```

**Errores:**
| Código | Mensaje | Causa |
|---|---|---|
| `400` | `"documentNumber and pin are required"` | Falta alguno de los dos campos |
| `401` | `"Credenciales inválidas"` | Documento o PIN incorrectos |
| `403` | `"blocked"` | La cuenta está bloqueada por el administrador |

---

### 5.3 USUARIOS

#### `GET /users`
Lista todos los usuarios registrados.  
**Uso:** Panel de administrador.

**Respuesta (200):** Array de objetos usuario ordenados por fecha de creación.

---

#### `GET /users/:id`
Obtiene un usuario específico por su UUID interno.

**Parámetro de ruta:** `:id` = UUID del usuario (ej. `"a3f2c1d0-..."`).

**Respuesta (200):** Objeto usuario completo.  
**Error (404):** `{ "error": "User not found" }`

---

#### `POST /users`
Crea un nuevo usuario (registro).

**Body requerido (campos mínimos):**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "pin": "1234",
  "firstName": "Juan",
  "secondName": "",
  "lastName": "Pérez",
  "secondLastName": "",
  "birthDate": "1990-01-15",
  "email": "juan@example.com",
  "phone": "3001234567",
  "countryResidence": "CO",
  "countryBirth": "CO",
  "currencyCode": "COP",
  "currencySymbol": "$",
  "status": "active"
}
```

**Respuesta (201):** Objeto usuario creado.  
**Error (409):** `{ "error": "Ya existe un usuario con ese número de documento" }`

---

#### `PUT /users/:id`
Actualiza cualquier campo de un usuario existente.  
**Uso principal:** El admin suspende, bloquea, aprueba verificación, etc.

**Parámetro de ruta:** `:id` = UUID del usuario.

**Ejemplo body (suspender usuario):**
```json
{
  "status": "suspended",
  "suspensionReason": "Actividad sospechosa detectada",
  "suspensionDate": "2026-06-25T10:00:00Z"
}
```

**Ejemplo body (aprobar verificación):**
```json
{
  "verificationStatus": "approved",
  "status": "active"
}
```

**Respuesta (200):** Objeto usuario actualizado.

---

#### `DELETE /users/:id`
Elimina un usuario y TODOS sus datos asociados:
- Sus cuentas bancarias
- Sus transacciones
- Sus tarjetas

**Parámetro de ruta:** `:id` = UUID del usuario.  
**Respuesta (204):** Sin cuerpo.

---

### 5.4 CUENTAS BANCARIAS

#### `GET /accounts?userId={uuid}`
Lista las cuentas de un usuario específico.

**Query param:** `userId` (opcional). Sin él, devuelve todas las cuentas.

**Respuesta (200):**
```json
[
  {
    "id": "uuid-cuenta",
    "userId": "uuid-usuario",
    "type": "savings",
    "number": "123-456789-01",
    "balance": 1500000,
    "currency": "Peso colombiano",
    "currencyCode": "COP",
    "currencySymbol": "$",
    "name": "Cuenta de Ahorros",
    "status": "active",
    "createdAt": "2026-01-10T08:00:00Z"
  }
]
```

**Valores posibles de `type`:** `"savings"` | `"checking"` | `"credit"`  
**Valores posibles de `status`:** `"active"` | `"suspended"` | `"blocked"`

---

#### `POST /accounts`
Crea una cuenta bancaria nueva para un usuario.

**Body requerido:**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "userId": "uuid-del-usuario",
  "type": "savings",
  "number": "123-456789-01",
  "balance": 0,
  "currency": "Peso colombiano",
  "currencyCode": "COP",
  "currencySymbol": "$",
  "name": "Cuenta de Ahorros",
  "status": "active"
}
```

**Respuesta (201):** Objeto cuenta creado.

---

#### `PUT /accounts/:id`
Actualiza una cuenta (por ejemplo, cambiar el saldo o el estado).

**Parámetro de ruta:** `:id` = UUID de la cuenta.

**Ejemplo body (el admin agrega saldo):**
```json
{
  "balance": 5000000
}
```

**Respuesta (200):** Objeto cuenta actualizado.

---

### 5.5 TRANSACCIONES

#### `GET /transactions?userId={uuid}`
Lista las transacciones de un usuario, ordenadas de más reciente a más antigua.

**Query param:** `userId` (opcional). Sin él, devuelve todas las transacciones.

**Respuesta (200):**
```json
[
  {
    "id": "uuid-transaccion",
    "userId": "uuid-usuario",
    "accountId": "uuid-cuenta",
    "date": "2026-06-25T10:30:00Z",
    "description": "Transferencia recibida",
    "amount": 200000,
    "type": "credit",
    "category": "Transferencias",
    "status": "completed"
  }
]
```

**Valores posibles de `type`:** `"credit"` (entrada de dinero) | `"debit"` (salida de dinero)  
**Valores posibles de `status`:** `"completed"` | `"pending"`

---

#### `POST /transactions`
Registra una transacción nueva.

**Body requerido:**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "userId": "uuid-del-usuario",
  "accountId": "uuid-de-la-cuenta",
  "date": "2026-06-25T10:30:00Z",
  "description": "Pago de servicios",
  "amount": 150000,
  "type": "debit",
  "category": "Servicios",
  "status": "completed"
}
```

**Respuesta (201):** Objeto transacción creado.

---

### 5.6 TARJETAS

#### `GET /cards?userId={uuid}`
Lista las tarjetas de un usuario.

**Respuesta (200):**
```json
[
  {
    "id": "uuid-tarjeta",
    "userId": "uuid-usuario",
    "type": "debit",
    "number": "4532 **** **** 1234",
    "status": "active",
    "createdAt": "2026-01-10T08:00:00Z"
  }
]
```

**Valores posibles de `type`:** `"debit"` | `"credit"`

---

#### `POST /cards`
Crea una tarjeta nueva para un usuario.

**Body requerido:**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "userId": "uuid-del-usuario",
  "type": "debit",
  "number": "4532 **** **** 1234",
  "status": "active"
}
```

---

#### `PUT /cards/:id`
Actualiza el estado de una tarjeta (ej. bloquear/desbloquear).

**Parámetro de ruta:** `:id` = UUID de la tarjeta.

**Ejemplo body:**
```json
{ "status": "blocked" }
```

---

### 5.7 RADICADOS (GESTIÓN DE CASOS)

Los radicados son identificadores únicos que el administrador genera y
entrega al usuario para que pueda desbloquear su cuenta.

#### `GET /radicados`
Lista todos los radicados.  
**Query params opcionales:** `userId={uuid}` o `radicado={codigo}` para filtrar.

---

#### `GET /radicados/verify/:radicado?userId={uuid}`
Verifica si un radicado es válido para un usuario específico.

**Parámetro de ruta:** `:radicado` = código del radicado en mayúsculas (ej. `"RAD-2026-001"`).  
**Query param:** `userId` = UUID del usuario que intenta verificarlo.

**Respuesta exitosa (200):**
```json
{
  "valid": true,
  "record": {
    "id": "uuid-radicado",
    "radicado": "RAD-2026-001",
    "userId": "uuid-usuario",
    "motive": "Verificación de identidad requerida",
    "expiresAt": "2026-12-31",
    "createdAt": "2026-06-25T10:00:00Z"
  }
}
```

**Respuesta inválida (200 — el campo `valid` es false):**
```json
{
  "valid": false,
  "reason": "Radicado vencido el 31/05/2026"
}
```

**Nota:** Esta ruta siempre responde con HTTP 200. El campo `valid` (boolean)
indica si el radicado es aceptado o no.

---

#### `GET /radicados/:id`
Obtiene un radicado específico por UUID.

---

#### `POST /radicados`
Crea un radicado nuevo (solo el admin puede hacer esto).

**Body requerido:**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "radicado": "RAD-2026-001",
  "userId": "uuid-del-usuario-afectado",
  "motive": "Se requiere verificación de identidad por actividad inusual",
  "expiresAt": "2026-12-31"
}
```

**Nota:** El campo `radicado` se guarda siempre en MAYÚSCULAS.

---

#### `PUT /radicados/:id`
Actualiza un radicado existente.

---

#### `DELETE /radicados/:id`
Elimina un radicado.  
**Respuesta (204):** Sin cuerpo.

---

### 5.8 EVENTOS DE LOGIN (AUDITORÍA DE ACCESOS)

#### `GET /login-events`
Lista los últimos 2000 intentos de login (exitosos y fallidos).

**Respuesta (200):**
```json
[
  {
    "id": "uuid-evento",
    "documentNumber": "1234567890",
    "success": true,
    "ip": "201.234.56.78",
    "country": "Colombia",
    "city": "Bogotá",
    "device": "Android 14 — Samsung Galaxy S23",
    "createdAt": "2026-06-25T10:00:00Z"
  }
]
```

---

#### `POST /login-events`
Registra un intento de login. El APK lo llama automáticamente en cada
intento (exitoso o no).

**Body requerido:**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "documentNumber": "1234567890",
  "success": true,
  "ip": "201.234.56.78",
  "country": "Colombia",
  "city": "Bogotá",
  "device": "Android 14 — Samsung Galaxy S23"
}
```

---

### 5.9 AUDITORÍA DE ACCIONES ADMINISTRATIVAS

#### `GET /audit-logs`
Lista los últimos 2000 registros de acciones del administrador.

---

#### `POST /audit-logs`
Registra una acción administrativa (el panel admin lo llama automáticamente).

**Body requerido:**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "adminId": "uuid-del-administrador",
  "action": "Usuario suspendido: Juan Pérez (1234567890)",
  "targetUserId": "uuid-del-usuario-afectado"
}
```

---

### 5.10 SOLICITUDES DE CAMBIO DE PIN

#### `GET /pin-changes`
Lista todas las solicitudes de cambio de PIN.

---

#### `POST /pin-changes`
El usuario envía una solicitud de cambio de PIN.

**Body requerido:**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "userId": "uuid-del-usuario",
  "pendingPin": "5678",
  "status": "pending"
}
```

---

#### `POST /pin-changes/:id/approve`
El admin aprueba la solicitud. Automáticamente actualiza el PIN del usuario.

**Body opcional:**
```json
{ "processedBy": "uuid-del-admin" }
```

**Respuesta (200):** `{ "ok": true }`

---

#### `POST /pin-changes/:id/reject`
El admin rechaza la solicitud.

**Body:**
```json
{
  "processedBy": "uuid-del-admin",
  "rejectionReason": "PIN no cumple los requisitos mínimos de seguridad"
}
```

---

### 5.11 CONFIGURACIÓN DE LA APLICACIÓN

#### `GET /settings`
Devuelve todos los parámetros de configuración como objeto clave-valor.

**Respuesta (200):**
```json
{
  "maintenance_mode": "false",
  "dynamic_key_interval": "60",
  "max_login_attempts": "5"
}
```

---

#### `PUT /settings/:key`
Crea o actualiza un parámetro de configuración.

**Parámetro de ruta:** `:key` = nombre del parámetro.  
**Body:**
```json
{ "value": "true" }
```

---

### 5.12 EVENTOS DE INSTALACIÓN PWA

#### `GET /pwa-events`
Lista los últimos 500 eventos de instalación de la PWA.

---

#### `POST /pwa-events`
Registra cuando un usuario instala la PWA en su dispositivo.

**Body requerido:**
```json
{
  "id": "uuid-generado-en-el-cliente",
  "device": "iPhone 15 — iOS 17",
  "installedAt": "2026-06-25T10:00:00Z"
}
```

---

## 6. ESTRUCTURA DE DATOS (MODELOS)

### Usuario (`RegisteredUser`)
```typescript
{
  id: string;                     // UUID único, generado en el cliente
  documentType: string;           // "CC" | "CE" | "PP" | "NIT" | etc.
  documentNumber: string;         // Número de documento (clave de login)
  countryResidence: string;       // Código de país ISO: "CO", "US", "MX"...
  countryBirth: string;           // Código de país ISO
  currencyCode: string;           // "COP", "USD", "EUR"...
  currencySymbol: string;         // "$", "€", "£"...
  firstName: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  birthDate: string;              // "YYYY-MM-DD"
  email: string;
  phone: string;
  pin: string;                    // PIN numérico (clave de login)
  createdAt: string;              // ISO 8601
  isAdmin?: boolean;              // true = acceso al panel admin
  status?: "active" | "suspended" | "blocked";
  address?: string;
  suspensionReason?: string;
  suspensionDate?: string;
  unblockSteps?: SuspensionStep[];        // Pasos para desbloqueo
  verificationStatus?: "pending_review" | "approved" | "failed";
  verificationFailedReason?: string;
  verificationAttempts?: number;          // Máximo 5 intentos
}
```

### Cuenta (`Account`)
```typescript
{
  id: string;
  userId: string;
  type: "savings" | "checking" | "credit";
  number: string;                 // Número de cuenta formateado
  balance: number;                // En la moneda del usuario (sin centavos)
  currency: string;               // Nombre completo: "Peso colombiano"
  currencyCode: string;           // "COP"
  currencySymbol: string;         // "$"
  name: string;                   // Nombre visible: "Cuenta de Ahorros"
  status: "active" | "suspended" | "blocked";
  createdAt: string;
}
```

### Transacción (`Transaction`)
```typescript
{
  id: string;
  userId: string;
  accountId: string;
  date: string;                   // ISO 8601
  description: string;
  amount: number;                 // Siempre positivo
  type: "credit" | "debit";      // credit = entra dinero, debit = sale
  category: string;
  status: "completed" | "pending";
  createdAt?: string;
}
```

### Tarjeta (`Card`)
```typescript
{
  id: string;
  userId: string;
  type: "debit" | "credit";
  number: string;                 // Ej: "4532 **** **** 1234"
  status: "active" | "blocked";
  createdAt: string;
}
```

### Radicado
```typescript
{
  id: string;
  radicado: string;               // Código único en MAYÚSCULAS
  userId: string;
  motive: string;
  expiresAt: string;              // "YYYY-MM-DD"
  createdAt: string;
}
```

---

## 7. WORKFLOW DE GITHUB ACTIONS — ARCHIVO COMPLETO

**Ruta en el repositorio:** `.github/workflows/build-apk.yml`

Este es el archivo exacto que ya está en el repositorio:

```yaml
name: Build Mi Bancolombia APK

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-android:
    name: Compilar APK Android
    runs-on: ubuntu-latest

    steps:
      - name: Checkout código fuente
        uses: actions/checkout@v4

      - name: Configurar Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Configurar pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Instalar dependencias del workspace completo
        run: pnpm install --frozen-lockfile

      - name: Configurar Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Configurar Android SDK
        uses: android-actions/setup-android@v3

      - name: Aceptar licencias Android SDK
        run: yes | sdkmanager --licenses || true

      - name: Generar proyecto nativo Android con expo prebuild
        working-directory: artifacts/mi-bancolombia
        env:
          EXPO_PUBLIC_API_URL: https://bancolombia--bankbancolombia.replit.app
        run: |
          npx expo prebuild \
            --platform android \
            --clean \
            --no-install

      - name: Dar permisos a gradlew
        working-directory: artifacts/mi-bancolombia/android
        run: chmod +x gradlew

      - name: Compilar APK debug con Gradle
        working-directory: artifacts/mi-bancolombia/android
        env:
          EXPO_PUBLIC_API_URL: https://bancolombia--bankbancolombia.replit.app
          ANDROID_HOME: /usr/local/lib/android/sdk
        run: ./gradlew assembleDebug --no-daemon --stacktrace

      - name: Subir APK como artefacto descargable
        uses: actions/upload-artifact@v4
        with:
          name: mi-bancolombia-apk
          path: artifacts/mi-bancolombia/android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 30
```

**Explicación de cada sección:**

| Sección | Qué hace | Por qué es necesaria |
|---|---|---|
| `on: push: branches: [main]` | Compila automáticamente al hacer push a main | Automatización continua |
| `on: workflow_dispatch` | Permite lanzar la compilación manualmente desde GitHub | Para compilar sin hacer push |
| `actions/checkout@v4` | Descarga el código del repositorio | Sin esto no hay código que compilar |
| `setup-node@v4 node-version: '24'` | Instala Node.js versión 24 | El proyecto requiere Node 24 |
| `pnpm/action-setup@v4 version: 9` | Instala el gestor de paquetes pnpm v9 | El proyecto usa pnpm workspaces |
| `pnpm install --frozen-lockfile` | Instala todas las dependencias exactas | Reproduce el entorno del desarrollo |
| `setup-java@v4 java-version: '17'` | Instala Java 17 (Temurin) | Gradle (el compilador de Android) requiere Java |
| `android-actions/setup-android@v3` | Instala el Android SDK | Necesario para compilar código nativo Android |
| `sdkmanager --licenses` | Acepta las licencias de Android SDK | Sin esto Gradle falla al descargar herramientas |
| `expo prebuild --platform android` | Genera el proyecto nativo Android desde app.json | Crea la carpeta `android/` con todo el código nativo |
| `EXPO_PUBLIC_API_URL: https://...` | Inyecta la URL del servidor en el APK | El APK usa esta variable para saber a dónde conectarse |
| `chmod +x gradlew` | Da permisos de ejecución al script de Gradle | En Linux los archivos descargados no tienen permisos por defecto |
| `./gradlew assembleDebug` | Compila el APK final | Es el paso que produce el archivo .apk |
| `upload-artifact@v4` | Guarda el APK en GitHub por 30 días | Para poder descargarlo desde la interfaz de GitHub |

---

## 8. ARCHIVOS DE CONFIGURACIÓN DEL PROYECTO

### `artifacts/mi-bancolombia/app.json` (configuración de la app)
```json
{
  "expo": {
    "name": "Mi Bancolombia",
    "slug": "mi-bancolombia",
    "version": "2.3.2",
    "orientation": "portrait",
    "android": {
      "package": "com.bancolombia.miapp"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://bancolombia--bankbancolombia.replit.app"
        }
      ]
    ]
  }
}
```

**Campos clave:**
- `android.package`: `com.bancolombia.miapp` — Identificador único de la app en Android. No cambiar.
- `expo-router.origin`: URL base del servidor. Debe ser el dominio de producción de Replit.
- `version`: `2.3.2` — Versión visible al usuario.

---

### `artifacts/mi-bancolombia/utils/api.ts` (lógica de conexión)
Este archivo decide si usar URL relativa (web) o absoluta (APK):

```typescript
import { Platform } from "react-native";

const _base =
  Platform.OS === "web"
    ? ""
    : (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${_base}${path}`;
}
```

**`Platform.OS`** puede ser:
- `"web"` → PWA o navegador → usa ruta relativa
- `"android"` → APK → usa URL absoluta de `EXPO_PUBLIC_API_URL`
- `"ios"` → iPhone → usa URL absoluta de `EXPO_PUBLIC_API_URL`

---

### `artifacts/mi-bancolombia/metro.config.js` (resolución de módulos)
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
```

**Por qué es necesario:** El proyecto es un monorepo (múltiples paquetes).
Metro (el empaquetador de React Native) necesita saber que debe buscar
módulos como `@workspace/api-client-react` en la carpeta raíz del monorepo,
no solo dentro de `artifacts/mi-bancolombia/`.

---

## 9. PASOS EXACTOS PARA COMPILAR EL APK EN GITHUB

### Paso 1 — Sube el código a GitHub

Asegúrate de que el repositorio en GitHub tiene los archivos actualizados,
especialmente:
- `.github/workflows/build-apk.yml`
- `artifacts/mi-bancolombia/app.json`
- `artifacts/mi-bancolombia/utils/api.ts`
- `artifacts/mi-bancolombia/metro.config.js`

### Paso 2 — Lanza la compilación

**Opción A (automática):** Haz cualquier commit y push a la rama `main`.
GitHub lanza el workflow automáticamente.

**Opción B (manual sin hacer push):**
1. Ve a tu repositorio en GitHub
2. Haz clic en la pestaña **Actions**
3. En la lista de la izquierda selecciona **"Build Mi Bancolombia APK"**
4. Haz clic en el botón **"Run workflow"** (botón gris a la derecha)
5. Confirma con **"Run workflow"** en el menú desplegable

### Paso 3 — Espera la compilación

Duración estimada: **8 a 15 minutos**.

Puedes ver el progreso en tiempo real:
- **Actions** → click en la ejecución en curso → click en **"Compilar APK Android"**

Los pasos se van marcando con ✓ verde o ✗ rojo a medida que avanzan.

### Paso 4 — Descarga el APK

1. Cuando todos los pasos muestren ✓ verde
2. Ve a **Actions** → click en la última ejecución exitosa
3. Baja hasta la sección **"Artifacts"** al fondo de la página
4. Haz clic en **`mi-bancolombia-apk`** para descargar el ZIP
5. Descomprime el ZIP → obtienes `app-debug.apk`

### Paso 5 — Instala el APK en Android

1. Copia `app-debug.apk` al teléfono Android (por USB, Drive, WhatsApp, etc.)
2. En el teléfono: **Ajustes → Seguridad → Instalar apps de origen desconocido** → Activar
3. Abre el archivo APK desde el administrador de archivos
4. Confirma la instalación
5. Abre "Mi Bancolombia"

**La app ya se conecta automáticamente a:**
`https://bancolombia--bankbancolombia.replit.app`

---

## 10. SINCRONIZACIÓN EN TIEMPO REAL

### Cómo funciona

No existe un socket o canal de tiempo real (WebSocket). La sincronización
se logra porque **todos los clientes consultan el mismo servidor** en
cada acción:

1. **Usuario A** (en el APK) transfiere dinero → escribe en la base de datos via `POST /transactions` y `PUT /accounts/:id`
2. **Usuario B** (en la PWA) abre sus movimientos → consulta `GET /transactions?userId=...` → ve los datos actualizados
3. **Administrador** (en la web) suspende a un usuario → llama `PUT /users/:id` con `{ "status": "suspended" }`
4. La próxima vez que ese usuario abra la app (APK, PWA o web) y haga cualquier petición, el servidor devuelve su estado actualizado

### Qué se sincroniza entre todos los clientes

| Acción | Quién la hace | Todos la ven |
|---|---|---|
| Cambio de saldo | Admin (web/PWA) | Sí, al instante |
| Suspensión de cuenta | Admin | Sí, al siguiente login o recarga |
| Nueva transacción | Cualquier cliente | Sí, al recargar movimientos |
| Aprobación de PIN | Admin | Sí, el usuario puede entrar con PIN nuevo |
| Radicado creado | Admin | Sí, el usuario puede escanearlo |
| Verificación aprobada | Admin | Sí, el usuario recupera acceso |

---

## 11. PREGUNTAS FRECUENTES Y ERRORES COMUNES

### El APK se instala pero muestra "Error de conexión" o pantalla en blanco

**Causa:** La variable `EXPO_PUBLIC_API_URL` no llegó correctamente al APK.

**Verificación:** El valor debe ser exactamente:
```
https://bancolombia--bankbancolombia.replit.app
```
Sin barra al final, sin espacios, con `https://`.

**Solución:** Revisar que en el workflow `.github/workflows/build-apk.yml`
aparezca dos veces esta variable (en el paso `expo prebuild` y en el paso
`./gradlew assembleDebug`).

---

### El APK se instala pero el login dice "Credenciales inválidas"

**Causa:** El APK está conectado al servidor pero las credenciales no existen
en la base de datos remota.

**Solución:** Los usuarios deben estar registrados en la versión web o PWA
del proyecto en Replit. Los datos de la base de datos local de desarrollo
no son los mismos que los de producción.

---

### GitHub Actions falla en el paso de Gradle

**Causa más común:** Falta de memoria o tiempo de espera agotado.

**Solución:** El flag `--no-daemon` ya está incluido para evitar este problema.
Si sigue fallando, revisa el log completo haciendo clic en el paso rojo
en GitHub Actions para ver el error exacto.

---

### El workflow no se activa al hacer push

**Causa:** El archivo `.github/workflows/build-apk.yml` no está en la rama
`main` del repositorio de GitHub.

**Solución:** Verifica que el archivo exista en GitHub:
`github.com/TU_USUARIO/TU_REPOSITORIO/blob/main/.github/workflows/build-apk.yml`

---

### El APK funciona pero no muestra datos del servidor

**Causa:** El servidor de Replit está en modo suspendido (se duerme por
inactividad en el plan gratuito).

**Solución:** Abre la versión web en el navegador primero:
`https://bancolombia--bankbancolombia.replit.app`
Espera 10-15 segundos a que cargue. Esto despierta el servidor.
Luego el APK también funcionará.

---

*Fin del documento. Todos los datos, URLs, parámetros y configuraciones
son reales y corresponden al estado actual del proyecto desplegado en
`https://bancolombia--bankbancolombia.replit.app`.*
