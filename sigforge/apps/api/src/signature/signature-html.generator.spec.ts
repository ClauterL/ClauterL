import { renderSignatureHtml, MAX_HTML_BYTES, RenderContext, esc } from "./signature-html.generator";
import type { SignatureFields, TemplateKey } from "@sigforge/shared";

const baseFields: SignatureFields = {
  fullName: "Ada Lovelace",
  jobTitle: "Chief Analytical Officer",
  company: "Difference Engine Co.",
  phone: "+44 20 7946 0000",
  email: "ada@example.com",
  website: "https://example.com",
  address: "London, UK",
  tagline: "Notes on the Analytical Engine",
  brandColor: "#0F62FE",
  logoAssetKey: "logo",
  photoAssetKey: "",
  animation: "fade-loop",
  iconLinks: [
    { icon: "linkedin", url: "https://linkedin.com/in/ada" },
    { icon: "twitter", url: "https://twitter.com/ada" },
    { icon: "website", url: "https://example.com" },
  ],
};

function makeCtx(template: TemplateKey, overrides: Partial<SignatureFields> = {}): RenderContext {
  return {
    signatureId: "sig_test",
    publicSlug: "slug_test",
    assetBaseUrl: "https://sig.example.com",
    template,
    trackedLinks: {
      phone: "link_phone",
      email: "link_email",
      website: "link_web",
      "icon-0": "link_i0",
      "icon-1": "link_i1",
      "icon-2": "link_i2",
    },
    fields: { ...baseFields, ...overrides },
  };
}

describe("signature-html.generator", () => {
  const templates: TemplateKey[] = ["classic", "modern", "minimal"];

  test.each(templates)("%s template produces valid email HTML", (tpl) => {
    const html = renderSignatureHtml(makeCtx(tpl));
    expect(html).toBeTruthy();

    // No JavaScript
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/\son\w+=/i);

    // No external CSS
    expect(html).not.toMatch(/<style/i);
    expect(html).not.toMatch(/<link\b/i);

    // Table-based layout
    expect(html).toMatch(/<table/i);

    // Inline styles only — every element that has styling should use style=
    // (structural check: presence of style attributes, absence of class attrs)
    expect(html).toMatch(/style="/);
    expect(html).not.toMatch(/\sclass="/);
  });

  test.each(templates)("%s template stays under 15KB", (tpl) => {
    const html = renderSignatureHtml(makeCtx(tpl));
    const bytes = Buffer.byteLength(html, "utf8");
    expect(bytes).toBeLessThan(MAX_HTML_BYTES);
  });

  test("throws when HTML exceeds max size", () => {
    const huge = "a".repeat(20_000);
    expect(() =>
      renderSignatureHtml(makeCtx("classic", { tagline: huge, address: huge })),
    ).toThrow(/exceeded/);
  });

  test("uses tracked link ids in hrefs", () => {
    const html = renderSignatureHtml(makeCtx("classic"));
    expect(html).toContain("https://sig.example.com/r/link_email");
    expect(html).toContain("https://sig.example.com/r/link_web");
    expect(html).toContain("https://sig.example.com/r/link_i0");
  });

  test("falls back to raw url when no tracked link mapped", () => {
    const ctx = makeCtx("classic");
    ctx.trackedLinks = {};
    const html = renderSignatureHtml(ctx);
    expect(html).toContain("mailto:ada@example.com");
    expect(html).toContain("https://example.com");
  });

  test("emits tracking pixel", () => {
    const html = renderSignatureHtml(makeCtx("modern"));
    expect(html).toContain("/t/sig_test/pixel.gif");
    expect(html).toMatch(/width="1"[^>]*height="1"/);
  });

  test("uses animated gif URL when animation is enabled", () => {
    const html = renderSignatureHtml(makeCtx("classic", { animation: "pulse" }));
    expect(html).toContain("logo-animated.gif");
    expect(html).not.toContain("logo-static.gif");
  });

  test("uses static logo URL when animation is disabled", () => {
    const html = renderSignatureHtml(makeCtx("classic", { animation: "none" }));
    expect(html).toContain("logo-static.gif");
  });

  test("escapes HTML in user fields", () => {
    const html = renderSignatureHtml(
      makeCtx("classic", { fullName: "<b>Not evil</b> \"quoted'" }),
    );
    expect(html).not.toContain("<b>Not evil</b>");
    expect(html).toContain("&lt;b&gt;Not evil&lt;/b&gt;");
    expect(html).toContain("&quot;");
  });

  test("esc() escapes the five significant characters", () => {
    expect(esc(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });

  test("omits icon bar when no icon links", () => {
    const html = renderSignatureHtml(makeCtx("modern", { iconLinks: [] }));
    // No icon <img> tags for icon assets
    expect(html).not.toMatch(/\/icons\/\w+\.png/);
  });
});
