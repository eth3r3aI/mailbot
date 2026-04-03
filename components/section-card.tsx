import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({
  title,
  eyebrow,
  description,
  children
}: SectionCardProps) {
  return (
    <section className="card">
      <div className="card__header">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      <div className="card__body">{children}</div>
    </section>
  );
}

