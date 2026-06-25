# Conectar el APK al backend en tiempo real

## El problema que resuelve esto

La PWA funciona en el navegador: cuando hace una llamada a `/api/radicados`, el navegador sabe que debe ir a `tu-dominio.replit.app/api/radicados` porque ya está abierta en esa URL.

El APK instalado en un Android **no tiene esa referencia**. Si el código dice `/api/radicados`, Android no sabe adónde ir y la llamada falla silenciosamente.

**Solución:** Configurar la variable de entorno `EXPO_PUBLIC_API_URL` con la URL del servidor desplegado en Replit. La app detecta automáticamente si está corriendo en Android (APK) o en el navegador (PWA) y usa la URL correcta en cada caso.

---

## Paso 1 — Obtener la URL de producción de Replit

1. Abre tu proyecto en Replit
2. Haz clic en **Deploy** (botón azul arriba a la derecha)
3. Copia la URL que termina en `.replit.app`, por ejemplo:
   ```
   https://bancolombiabank.bancolombiabankofi-web.replit.app
   ```
   Esta URL es la que el APK usará para todas las llamadas a la base de datos.

---

## Paso 2 — Agregar el secreto en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/bancolombiabankofi-web/Bancolombiabank`
2. Haz clic en **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Agrega este secreto:

   | Nombre | Valor |
   |--------|-------|
   | `EXPO_PUBLIC_API_URL` | `https://TU-DOMINIO.replit.app` |

   > Reemplaza `TU-DOMINIO.replit.app` con la URL real de tu paso anterior.

---

## Paso 3 — Actualizar el workflow de GitHub Actions

Busca tu archivo de workflow (usualmente `.github/workflows/build.yml` o similar) y asegúrate de que el paso que ejecuta `eas build` tenga la variable de entorno configurada.

### Ejemplo de workflow completo para compilar el APK:

```yaml
name: Build Android APK

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Instalar pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Instalar dependencias
        run: pnpm install --frozen-lockfile

      - name: Configurar EAS CLI
        run: npm install -g eas-cli

      - name: Login en Expo
        run: eas login --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Compilar APK
        run: |
          cd artifacts/mi-bancolombia
          eas build --platform android --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          EXPO_PUBLIC_API_URL: ${{ secrets.EXPO_PUBLIC_API_URL }}
```

> **Nota:** Si ya tienes un workflow existente, solo agrega la línea `EXPO_PUBLIC_API_URL: ${{ secrets.EXPO_PUBLIC_API_URL }}` en la sección `env:` del paso de compilación.

---

## Paso 4 — Configurar el perfil de build en EAS

En el archivo `artifacts/mi-bancolombia/eas.json` (si no existe, créalo):

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://TU-DOMINIO.replit.app"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://TU-DOMINIO.replit.app"
      }
    }
  }
}
```

> **Importante:** Reemplaza `TU-DOMINIO.replit.app` con tu URL real. Si usas GitHub Actions (Paso 3), el valor del secreto sobreescribe el valor de `eas.json` automáticamente.

---

## Cómo funciona la sincronización en tiempo real

```
┌─────────────────────────────────────────────────────────┐
│                   SERVIDOR REPLIT                       │
│  API Express + PostgreSQL (la misma base de datos)      │
│  https://tu-dominio.replit.app/api/...                  │
└────────────────┬────────────────────┬───────────────────┘
                 │                    │
    ┌────────────▼──────┐  ┌──────────▼────────────┐
    │   PWA (navegador) │  │   APK (Android)        │
    │   URL relativa    │  │   URL absoluta         │
    │   /api/...        │  │   https://tu.app/api/  │
    └───────────────────┘  └────────────────────────┘
```

- **La base de datos es única.** PWA y APK leen y escriben en el mismo PostgreSQL.
- **No hay cache local persistente.** Cada acción (transferencia, login, suspension) llama al servidor al momento.
- **Un admin desde la PWA** suspende un usuario → el usuario en el APK lo ve inmediatamente al intentar operar.
- **Una transferencia desde el APK** aparece en tiempo real en la PWA del mismo usuario o del destinatario.

---

## Verificar que funciona

Después de compilar el APK con la variable configurada, puedes verificar la conexión así:

1. Instala el APK en un dispositivo Android
2. Intenta iniciar sesión con un usuario que existe en la PWA
3. Si el login funciona → el APK está conectado al servidor correcto
4. Crea una transferencia desde el APK y ábrela en la PWA → deben aparecer los mismos datos

---

## Secretos requeridos en GitHub

| Secreto | Para qué sirve | Cómo obtenerlo |
|---------|---------------|----------------|
| `EXPO_PUBLIC_API_URL` | URL del servidor de producción | URL de tu app desplegada en Replit |
| `EXPO_TOKEN` | Autenticación con Expo/EAS | https://expo.dev → Account Settings → Access Tokens |

---

## Preguntas frecuentes

**¿Tengo que recompilar el APK cada vez que cambie el código?**  
Sí, para cambios de código. Pero los datos (usuarios, transacciones, radicados) son del servidor y se sincronizan en tiempo real sin recompilar.

**¿Qué pasa si el servidor de Replit está apagado?**  
Tanto la PWA como el APK mostrarán error de conexión. El servidor debe estar desplegado (no solo en modo desarrollo) para que el APK funcione.

**¿La URL del servidor cambia?**  
No, una vez desplegado en Replit el dominio `.replit.app` es permanente. Solo cambia si usas un dominio personalizado.

**¿Tengo que tocar algo en el servidor Express?**  
No. El servidor ya tiene CORS abierto (`app.use(cors())`) lo que permite recibir solicitudes desde el APK sin restricciones de origen.
