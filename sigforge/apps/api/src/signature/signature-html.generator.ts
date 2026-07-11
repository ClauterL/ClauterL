import type { SignatureFields, TemplateKey, IconKey } from "@sigforge/shared";

export interface RenderContext {
  signatureId: string;
  publicSlug: string;
  assetBaseUrl: string;
  fields: SignatureFields;
  template: TemplateKey;
  trackedLinks: Record<string, string>;
}

const ESCAPE = /[&<>"']/g;
const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function esc(input: string): string {
  return input.replace(ESCAPE, (c) => ESCAPE_MAP[c]);
}

function pixelUrl(ctx: RenderContext): string {
  return `${ctx.assetBaseUrl}/t/${ctx.signatureId}/pixel.gif`;
}

function trackedHref(ctx: RenderContext, key: string, fallback: string): string {
  const linkId = ctx.trackedLinks[key];
  if (!linkId) return fallback;
  return `${ctx.assetBaseUrl}/r/${linkId}`;
}

function logoUrl(ctx: RenderContext): string | null {
  if (!ctx.fields.logoAssetKey) return null;
  const kind = ctx.fields.animation === "none" ? "static" : "animated";
  return `${ctx.assetBaseUrl}/s/${ctx.signatureId}/logo-${kind}.gif`;
}

function photoUrl(ctx: RenderContext): string | null {
  if (!ctx.fields.photoAssetKey) return null;
  return `${ctx.assetBaseUrl}/s/${ctx.signatureId}/photo.png`;
}

function iconUrl(ctx: RenderContext, icon: IconKey): string {
  return `${ctx.assetBaseUrl}/icons/${icon}.png`;
}

interface IconLine {
  icon: IconKey;
  url: string;
  key: string;
}

function iconLines(ctx: RenderContext): IconLine[] {
  return ctx.fields.iconLinks.map((link, idx) => ({
    icon: link.icon,
    url: link.url,
    key: `icon-${idx}`,
  }));
}

function iconBar(ctx: RenderContext): string {
  const icons = iconLines(ctx);
  if (icons.length === 0) return "";
  const cells = icons
    .map(
      (link) =>
        `<td style="padding:0 6px 0 0;"><a href="${esc(
          trackedHref(ctx, link.key, link.url),
        )}" style="text-decoration:none;"><img src="${esc(
          iconUrl(ctx, link.icon),
        )}" alt="${esc(link.icon)}" width="20" height="20" style="display:block;border:0;" /></a></td>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;border-collapse:collapse;"><tr>${cells}</tr></table>`;
}

function contactLines(ctx: RenderContext): string {
  const f = ctx.fields;
  const brand = f.brandColor;
  const rows: string[] = [];

  if (f.jobTitle || f.company) {
    rows.push(
      `<div style="font:14px Arial,Helvetica,sans-serif;color:#333;margin-top:2px;">${esc(
        f.jobTitle,
      )}${f.jobTitle && f.company ? " · " : ""}<span style="color:${esc(
        brand,
      )};">${esc(f.company)}</span></div>`,
    );
  }

  if (f.phone) {
    rows.push(
      `<div style="font:12px Arial,Helvetica,sans-serif;color:#555;margin-top:6px;">P: <a style="color:#555;text-decoration:none;" href="${esc(
        trackedHref(ctx, "phone", `tel:${f.phone}`),
      )}">${esc(f.phone)}</a></div>`,
    );
  }
  if (f.email) {
    rows.push(
      `<div style="font:12px Arial,Helvetica,sans-serif;color:#555;">E: <a style="color:#555;text-decoration:none;" href="${esc(
        trackedHref(ctx, "email", `mailto:${f.email}`),
      )}">${esc(f.email)}</a></div>`,
    );
  }
  if (f.website) {
    rows.push(
      `<div style="font:12px Arial,Helvetica,sans-serif;color:#555;">W: <a style="color:${esc(
        brand,
      )};text-decoration:none;" href="${esc(
        trackedHref(ctx, "website", f.website),
      )}">${esc(f.website)}</a></div>`,
    );
  }
  if (f.address) {
    rows.push(
      `<div style="font:12px Arial,Helvetica,sans-serif;color:#888;">${esc(f.address)}</div>`,
    );
  }
  return rows.join("");
}

function trackingPixel(ctx: RenderContext): string {
  return `<img src="${esc(
    pixelUrl(ctx),
  )}" width="1" height="1" alt="" style="display:block;border:0;height:1px;width:1px;" />`;
}

function classicTemplate(ctx: RenderContext): string {
  const f = ctx.fields;
  const logo = logoUrl(ctx);
  const photo = photoUrl(ctx);
  const brand = f.brandColor;

  const media = photo
    ? `<img src="${esc(
        photo,
      )}" alt="" width="72" height="72" style="display:block;border:0;border-radius:36px;" />`
    : logo
    ? `<img src="${esc(
        logo,
      )}" alt="${esc(f.company)}" width="72" height="72" style="display:block;border:0;" />`
    : "";

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;"><tr>${
    media
      ? `<td valign="top" style="padding-right:16px;border-right:2px solid ${esc(brand)};">${media}</td>`
      : ""
  }<td valign="top" style="padding-left:${media ? "16px" : "0"};"><div style="font:bold 16px Arial,Helvetica,sans-serif;color:#111;">${esc(
    f.fullName,
  )}</div>${contactLines(ctx)}${iconBar(ctx)}${
    f.tagline
      ? `<div style="font:italic 11px Arial,Helvetica,sans-serif;color:#999;margin-top:8px;">${esc(f.tagline)}</div>`
      : ""
  }</td></tr></table>${trackingPixel(ctx)}`;
}

function modernTemplate(ctx: RenderContext): string {
  const f = ctx.fields;
  const logo = logoUrl(ctx);
  const brand = f.brandColor;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:collapse;background:#fafafa;font-family:Arial,Helvetica,sans-serif;"><tr><td style="padding:12px 16px;border-left:4px solid ${esc(
    brand,
  )};"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${
    logo
      ? `<td valign="middle" style="padding-right:12px;"><img src="${esc(
          logo,
        )}" alt="${esc(f.company)}" width="48" height="48" style="display:block;border:0;" /></td>`
      : ""
  }<td valign="middle"><div style="font:bold 15px Arial,Helvetica,sans-serif;color:#111;">${esc(
    f.fullName,
  )}</div><div style="font:12px Arial,Helvetica,sans-serif;color:${esc(brand)};">${esc(
    f.jobTitle,
  )}${f.jobTitle && f.company ? " · " : ""}${esc(f.company)}</div></td></tr></table>${contactLines(
    ctx,
  )}${iconBar(ctx)}</td></tr></table>${trackingPixel(ctx)}`;
}

function minimalTemplate(ctx: RenderContext): string {
  const f = ctx.fields;
  const brand = f.brandColor;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;"><tr><td><div style="font:bold 14px Arial,Helvetica,sans-serif;color:#111;">${esc(
    f.fullName,
  )}<span style="color:${esc(brand)};"> — ${esc(f.jobTitle)}</span></div><div style="font:12px Arial,Helvetica,sans-serif;color:#555;margin-top:2px;">${esc(
    f.company,
  )}${f.phone ? ` · ${esc(f.phone)}` : ""}${
    f.email
      ? ` · <a href="${esc(trackedHref(ctx, "email", `mailto:${f.email}`))}" style="color:#555;text-decoration:none;">${esc(f.email)}</a>`
      : ""
  }</div>${iconBar(ctx)}</td></tr></table>${trackingPixel(ctx)}`;
}

const TEMPLATES: Record<TemplateKey, (ctx: RenderContext) => string> = {
  classic: classicTemplate,
  modern: modernTemplate,
  minimal: minimalTemplate,
};

export const MAX_HTML_BYTES = 15 * 1024;

export function renderSignatureHtml(ctx: RenderContext): string {
  const fn = TEMPLATES[ctx.template];
  if (!fn) throw new Error(`Unknown template: ${ctx.template}`);
  const html = fn(ctx);
  const bytes = Buffer.byteLength(html, "utf8");
  if (bytes > MAX_HTML_BYTES) {
    throw new Error(
      `Signature HTML exceeded ${MAX_HTML_BYTES} bytes (was ${bytes}). Reduce fields.`,
    );
  }
  return html;
}
