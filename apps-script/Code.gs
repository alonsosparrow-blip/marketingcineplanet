/**
 * Backend del formulario "Pedidos a Trade Marketing".
 * Se instala en script.google.com con la cuenta cines.pla@gmail.com (ver README).
 *
 * Por cada pedido:
 *  1. Guarda la foto en la carpeta de Drive "Trade_MKT".
 *  2. Registra el pedido en la hoja de cálculo "Pedidos Trade MKT" (para organizar y dar seguimiento).
 *  3. Envía un correo a Trade MKT (con la foto) y otro de confirmación al solicitante.
 */

const CARPETA_ID = '1HL1ny4KJ2NZ_dJvhTbYHUUEFC3OFE6sy'; // Drive > Trade_MKT
const DESTINATARIOS = 'asparrow@cineplanet.com.pe,trademarketing@cineplanet.com.pe';
const HOJA_ID = '1Y1rU3visiB6zMM3a9rdCVEACpshq5TDE70by4bGjB4o'; // Drive > Trade_MKT > Pedidos Trade MKT
const LOGO_ID = '14cWYMEeHY9kQCHYPaztJnPa1vZAWfoow'; // Drive > Trade_MKT > logo-cineplanet.png
const NOMBRE_HOJA = 'Pedidos Trade MKT';
const COLUMNAS = ['ID', 'Fecha de registro', 'Fecha de solicitud', 'Zona', 'Complejo', 'Correo solicitante',
  'Categoría', 'Subtipo', 'Comentarios', 'Foto', 'Estado'];
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const correo = String(d.correo || '').trim();
    const comentarios = String(d.comentarios || '').trim().slice(0, 200);
    if (!d.provincia || !d.complejo || !d.fecha || !correo || !d.categoria || !d.subtipo ||
        !comentarios || !d.fotoBase64) {
      throw new Error('Faltan campos obligatorios');
    }
    if (!CORREO_OK.test(correo)) throw new Error('Correo no válido');

    const hoja = obtenerHoja_();
    const id = 'TM-' + String(hoja.getLastRow()).padStart(4, '0');

    // 1. Foto en Drive
    const bytes = Utilities.base64Decode(d.fotoBase64);
    if (bytes.length > 500 * 1024) throw new Error('La foto supera 500 KB');
    const nombre = `${id}_${d.complejo}_${d.fecha}.jpg`.replace(/[\\/:*?"<>|]/g, '-');
    const adjunto = Utilities.newBlob(bytes, 'image/jpeg', nombre);
    const urlFoto = DriveApp.getFolderById(CARPETA_ID).createFile(adjunto).getUrl();

    // 2. Registro en la hoja
    hoja.appendRow([id, new Date(), d.fecha, d.provincia, d.complejo, correo,
      d.categoria, d.subtipo, comentarios, urlFoto, 'Pendiente']);

    // 3. Correos
    const filas = [
      ['N° de pedido', id], ['Zona', d.provincia], ['Complejo', d.complejo],
      ['Fecha de solicitud', d.fecha], ['Solicitante', correo], ['Categoría', d.categoria],
      ['Subtipo', d.subtipo], ['Comentarios', comentarios],
      ['Foto', `<a href="${urlFoto}">Ver en Drive</a>`]
    ].map(([k, v]) => `<tr><td style="padding:6px 12px;color:#6B7587">${k}</td>` +
      `<td style="padding:6px 12px;font-weight:bold">${k === 'Foto' ? v : escapar_(v)}</td></tr>`).join('');
    const logo = DriveApp.getFileById(LOGO_ID).getBlob();

    // a Trade MKT
    MailApp.sendEmail({
      to: DESTINATARIOS,
      replyTo: correo,
      subject: `Nuevo pedido Trade MKT ${id} – ${d.complejo} – ${d.subtipo}`,
      htmlBody: plantilla_('Nuevo pedido a Trade Marketing', '', filas,
        `Registrado en la hoja "${NOMBRE_HOJA}": <a href="${hoja.getParent().getUrl()}">abrir</a>`),
      inlineImages: { logo: logo },
      attachments: [adjunto]
    });

    // confirmación al solicitante
    MailApp.sendEmail({
      to: correo,
      replyTo: 'trademarketing@cineplanet.com.pe',
      subject: `Recibimos tu pedido ${id} – Trade Marketing Cineplanet`,
      htmlBody: plantilla_('¡Tu pedido fue enviado!',
        'El equipo de Trade Marketing recibió tu solicitud y la atenderá a la brevedad. Este es el resumen:',
        filas, 'Si necesitas agregar algo, responde a este correo.'),
      inlineImages: { logo: logo }
    });

    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

/** Correo HTML con el logo de Cineplanet arriba. */
function plantilla_(titulo, intro, filas, pie) {
  return `<div style="font-family:Arial,sans-serif;color:#041E42;max-width:600px">
    <div style="background:#041E42;padding:20px;text-align:center;border-radius:12px 12px 0 0">
      <img src="cid:logo" alt="Cineplanet" width="200" style="display:inline-block">
    </div>
    <div style="padding:8px 20px 20px;border:1px solid #D5DAE3;border-top:0;border-radius:0 0 12px 12px">
      <h2 style="color:#041E42">${titulo}</h2>
      ${intro ? `<p>${intro}</p>` : ''}
      <table style="border-collapse:collapse">${filas}</table>
      <p style="font-size:12px;color:#6B7587">${pie}</p>
    </div></div>`;
}

/** Abre la hoja "Pedidos Trade MKT" y deja la cabecera con el formato actual. */
function obtenerHoja_() {
  const h = SpreadsheetApp.openById(HOJA_ID).getSheets()[0];
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FORMATO_V2')) {
    h.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS])
      .setFontWeight('bold').setBackground('#041E42').setFontColor('#FFFFFF');
    h.setFrozenRows(1);
    // Lista desplegable de estado para organizar los pedidos
    const colEstado = COLUMNAS.indexOf('Estado') + 1;
    h.getRange(2, 1, h.getMaxRows() - 1, COLUMNAS.length).clearDataValidations();
    h.getRange(2, colEstado, h.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pendiente', 'En proceso', 'Atendido', 'Rechazado']).build());
    props.setProperty('FORMATO_V2', '1');
  }
  return h;
}

/** Ejecútalo una vez a mano desde el editor para autorizar permisos y crear la hoja. */
function configurar() {
  obtenerHoja_();
  DriveApp.getFolderById(CARPETA_ID).getName();
  DriveApp.getFileById(LOGO_ID).getName();
  MailApp.getRemainingDailyQuota();
}

function escapar_(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
