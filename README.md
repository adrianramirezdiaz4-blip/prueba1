# Acuerdo privado — instalación

Este proyecto publica una página estática en GitHub Pages y usa Supabase como base de datos. La página consulta el estado de la sala cada 2 segundos para que ambos participantes vean el cambio de turno casi en tiempo real.

## 1. Crear el repositorio en GitHub

1. Entra en https://github.com y crea una cuenta o inicia sesión.
2. Pulsa **New repository**.
3. Escribe exactamente `acuerdo-privado`.
4. Selecciona **Public** (GitHub Pages gratuito suele requerir repositorio público para cuentas Free).
5. Pulsa **Create repository**.
6. Sube los archivos `index.html`, `styles.css` y `app.js` a la raíz del repositorio. Puedes subir también este README y `supabase.sql`.

## 2. Crear el proyecto Supabase

1. Entra en https://supabase.com y crea un proyecto.
2. Guarda la contraseña de la base de datos en un lugar seguro.
3. Abre **SQL Editor > New query**.
4. Copia todo el contenido de `supabase.sql`, pégalo y pulsa **Run**.
5. Ve a **Project Settings > API** (o **Connect**) y copia:
   - Project URL
   - Publishable key (o la anon/public key heredada)
6. En GitHub abre `app.js` y reemplaza:
   - `PEGA_AQUI_TU_PROJECT_URL` por la URL del proyecto.
   - `PEGA_AQUI_TU_PUBLISHABLE_O_ANON_KEY` por la clave pública/anon.
7. Guarda los cambios.

**Nunca** pegues la `service_role` key en `app.js`, GitHub o en el navegador. Solo la clave pública/anon. La protección de datos la hacen las funciones SQL y los tokens privados.

## 3. Activar GitHub Pages

1. En tu repositorio, abre **Settings > Pages**.
2. En **Build and deployment**, selecciona **Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)`.
4. Pulsa **Save**.
5. Espera a que GitHub publique el sitio. La dirección será:
   `https://TU-USUARIO.github.io/acuerdo-privado/`

## 4. Uso

1. Abre la página y crea una sala como Participante 1.
2. Copia y envía a la otra persona tanto el **código de sala** como la **clave de invitación** por un canal privado.
3. Participante 1 crea la sala y comparte el código y la clave de invitación. La otra persona puede entrar de inmediato, incluso mientras ambos están conectados.
4. Participante 1 lee el acuerdo, escribe su nombre, dibuja su firma y pulsa **Finalizar mi parte**. Su turno queda cerrado.
5. Participante 2 ve el cambio automáticamente; cuando llega su turno, escribe su nombre, dibuja su firma y finaliza.
6. Cuando finalice, ambos verán la página final y podrán usar **Imprimir / Guardar como PDF**.

## Notas importantes

- Esta primera versión usa sondeo cada 2 segundos (actualización casi en tiempo real), no WebSockets.
- La clave de invitación es de un solo uso para registrar a Participante 2. No compartas el código ni la clave públicamente.
- Los tokens de participante se mantienen en la memoria de la pestaña durante esa sesión. No cierres la pestaña antes de finalizar; si se cierra, la sesión actual no podrá recuperarse automáticamente. Para una versión de producción conviene agregar recuperación autenticada.
- El sistema registra nombres y firmas dibujadas como imágenes. No es una firma electrónica certificada ni verifica identidad. No subas ni almacenes fotos o videos íntimos en este sitio.
- Antes de usarlo con información personal real, revisa privacidad, seguridad, copias de respaldo y términos de Supabase/GitHub.
- La cláusula de compensación no impone multas automáticas: cualquier reclamación debe ser legalmente válida y no puede penalizar el rechazo o retiro del consentimiento íntimo.
