import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

/** One document under the `legal` namespace of `messages/*.json`. */
type LegalSection = {
  title?: string;
  body?: string;
  items?: string[];
  /** Render `items` as a numbered list instead of bullets. */
  ordered?: boolean;
  /**
   * Append the shared contact details: `"inline"` puts the email at the end of
   * `body`, `"block"` lists email and website on their own lines.
   */
  contact?: "inline" | "block";
};

type LegalDocument = {
  title: string;
  metaDescription: string;
  updated?: string;
  effective?: string;
  sections: LegalSection[];
};

export type LegalDocumentKey = "dataDeletion" | "privacy" | "terms";

/**
 * Documents live in messages rather than MDX so the uz/ru pair stays in the
 * same place as the rest of the copy. `t.raw` is what returns the nested
 * arrays/objects — `t()` would only give back a formatted string.
 */
export async function getLegalDocument(
  key: LegalDocumentKey,
): Promise<LegalDocument> {
  const t = await getTranslations("legal");
  return t.raw(key) as LegalDocument;
}

const LINK = "text-primary hover:underline";

export async function LegalPage({ document }: { document: LegalDocumentKey }) {
  const t = await getTranslations("legal");
  const doc = await getLegalDocument(document);

  const email = t("email");
  const website = t("website");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link
          href="/"
          className={`${LINK} inline-flex items-center gap-2 text-sm mb-8`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("back")}
        </Link>

        <h1 className="t-h1 text-foreground">{doc.title}</h1>

        {doc.updated ? (
          <p className="mt-4 text-sm text-muted-foreground">{doc.updated}</p>
        ) : null}

        <div className="mt-8 space-y-8">
          {doc.sections.map((section, index) => (
            <section key={section.title ?? `section-${index}`}>
              {section.title ? (
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  {section.title}
                </h2>
              ) : null}

              {section.body ? (
                <p className="text-muted-foreground leading-relaxed">
                  {section.body}
                  {section.contact === "inline" ? (
                    <>
                      {" "}
                      <a href={`mailto:${email}`} className={LINK}>
                        {email}
                      </a>
                    </>
                  ) : null}
                </p>
              ) : null}

              {section.items ? (
                section.ordered ? (
                  <ol className="mt-4 ml-5 list-decimal space-y-2 text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                ) : (
                  <ul className="mt-4 ml-5 list-disc space-y-2 text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )
              ) : null}

              {section.contact === "block" ? (
                <dl className="mt-4 space-y-2 text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    <dt>{t("emailLabel")}</dt>
                    <dd>
                      <a href={`mailto:${email}`} className={LINK}>
                        {email}
                      </a>
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <dt>{t("websiteLabel")}</dt>
                    <dd>
                      <a
                        href={website}
                        className={LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {website}
                      </a>
                    </dd>
                  </div>
                </dl>
              ) : null}
            </section>
          ))}
        </div>

        {doc.effective ? (
          <p className="mt-10 pt-6 border-t border-border text-sm text-muted-foreground">
            {doc.effective}
          </p>
        ) : null}
      </div>
    </div>
  );
}
