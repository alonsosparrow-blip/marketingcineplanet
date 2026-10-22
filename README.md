# Pedidos a Trade Marketing – Cineplanet

Minisite para que los gerentes de cine envíen requerimientos al área de Trade MKT.

## Cómo funciona

1. El gerente llena el formulario (2 pasos: **Datos del cine** y **Requerimiento**).
2. Al enviar, un Google Apps Script (cuenta `cines.pla@gmail.com`):
   - guarda la foto en **Google Drive > Trade_MKT**,
   - registra toda la información del pedido en la hoja de cálculo **"Pedidos Trade MKT"** (Drive > Trade_MKT):
     <https://docs.google.com/spreadsheets/d/1Y1rU3visiB6zMM3a9rdCVEACpshq5TDE70by4bGjB4o/edit>
     Columnas: ID, Fecha de registro, Fecha de solicitud, Zona (Lima o Provincias), Complejo, Correo solicitante, Categoría, Subtipo, Comentarios, Foto (link a Drive) y **Estado** (Pendiente / En proceso / Atendido / Rechazado) para organizar los pedidos,
   - envía un correo a **asparrow@cineplanet.com.pe** y **trademarketing@cineplanet.com.pe** con el detalle y la foto adjunta, y una confirmación al correo que dejó el solicitante.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | El formulario (lo que se publica en Netlify) |
| `logo-cineplanet.png` | Logo |
| `apps-script/Code.gs` | Código del backend (se pega en Google Apps Script, no se publica) |

## Instalación (una sola vez, ~10 min)

### 1. Crear el backend en Google
1. Inicia sesión con **cines.pla@gmail.com** y entra a <https://script.google.com> → **Nuevo proyecto**.
2. Borra lo que hay y pega todo el contenido de `apps-script/Code.gs`. Guarda (nombre: *Pedidos Trade MKT*).
3. En el menú de funciones elige **`configurar`** y pulsa **Ejecutar**. Acepta los permisos (Drive, Hojas de cálculo y Gmail).
   *Si aparece "Google no verificó esta app": Configuración avanzada → Ir a Pedidos Trade MKT.*
4. **Implementar → Nueva implementación** → tipo **Aplicación web**:
   - Ejecutar como: **Yo (cines.pla@gmail.com)**
   - Quién tiene acceso: **Cualquier persona**
5. Copia la **URL de la aplicación web** (termina en `/exec`).

### 2. Conectar el formulario
Abre `index.html`, busca esta línea y pega la URL:

```js
const SCRIPT_URL = "PEGAR_AQUI_URL_DEL_APPS_SCRIPT";
```

### 3. Publicar
1. Sube esta carpeta a un repositorio de GitHub.
2. En Netlify: **Add new site → Import an existing project → GitHub** → elige el repo.
   Build command: *(vacío)* · Publish directory: `/` → **Deploy**.
3. Comparte el link de Netlify con los gerentes.

> Si después cambias `Code.gs`, usa **Implementar → Gestionar implementaciones → Editar → Nueva versión** para que la URL siga siendo la misma.

## Para editar listas
Los complejos y tipos de trabajo están al inicio del `<script>` en `index.html` (`COMPLEJOS` y `TRABAJOS`).

## Límites
- Todos los campos son obligatorios. Foto: solo JPG, máx. 500 KB.
- Comentarios: máx. 200 caracteres.
- Gmail gratuito permite ~100 correos/día desde Apps Script (cada pedido = 2 correos: uno a Trade MKT y otro al solicitante).
