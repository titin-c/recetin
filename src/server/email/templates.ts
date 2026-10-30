export type EmailMessage = { subject: string; html: string; text: string };

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plantilla común: texto sobrio, un único botón, y el enlace en claro por si el botón no funciona. */
function layout(opts: { title: string; intro: string; cta: string; url: string; footer: string }): EmailMessage {
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#fdf9f8;font-family:Arial,Helvetica,sans-serif;color:#211d1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#f4ece9;border:1px solid #e6dcd9">
<tr><td style="padding:32px">
<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#6d1f3a">RECETÍN</p>
<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px">${escape(opts.title)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escape(opts.intro)}</p>
<p style="margin:0 0 24px"><a href="${escape(opts.url)}" style="display:inline-block;background:#6d1f3a;color:#fdf9f8;padding:14px 24px;text-decoration:none;font-size:16px">${escape(opts.cta)}</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#524a43">Si el botón no funciona, copia este enlace:</p>
<p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${escape(opts.url)}" style="color:#6d1f3a">${escape(opts.url)}</a></p>
<p style="margin:0;font-size:13px;color:#524a43">${escape(opts.footer)}</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${opts.title}\n\n${opts.intro}\n\n${opts.cta}: ${opts.url}\n\n${opts.footer}`;
  return { subject: opts.title, html, text };
}

export function verifyEmailMessage(name: string, url: string): EmailMessage {
  return layout({
    title: "Confirma tu email",
    intro: `Hola, ${name}. Confirma tu email para poder publicar recetas e invitar a tu hogar en RECETÍN.`,
    cta: "Confirmar mi email",
    url,
    footer: "El enlace caduca en 24 horas. Si no has creado una cuenta en RECETÍN, ignora este mensaje.",
  });
}

export function resetPasswordMessage(name: string, url: string): EmailMessage {
  return layout({
    title: "Crea una contraseña nueva",
    intro: `Hola, ${name}. Alguien (esperamos que tú) ha pedido cambiar la contraseña de tu cuenta de RECETÍN.`,
    cta: "Crear contraseña nueva",
    url,
    footer: "El enlace caduca en 1 hora y solo sirve una vez. Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambia.",
  });
}
