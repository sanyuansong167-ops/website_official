"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "@/features/contact/ContactForm";
import type { ControlledSection, JsonObject, JsonValue, RenderMode } from "@/types/page-builder";
import styles from "./ContactFormBlock.module.css";

type ContactDetails = {
  address?: string;
  email?: string;
  phone?: string;
};

export function ContactFormBlock({
  section,
}: Readonly<{ mode: RenderMode; section: ControlledSection }>) {
  const title = getString(section.props.title) ?? "预约交流";
  const summary = getString(section.props.summary);
  const contact = decodeContact(section.data?.contact);
  const directions = useMemo(
    () => decodeDirections(section.data?.directions),
    [section.data?.directions],
  );
  const requestedDirection = useSearchParams().get("direction") ?? undefined;
  const initialDirection = requestedDirection && directions.includes(requestedDirection)
    ? requestedDirection
    : undefined;

  return (
    <section
      aria-labelledby={`${section.id}-title`}
      className={styles.contactFormBlock}
      data-spacing={getSpacing(section.style.spacing)}
      data-theme={section.style.theme === "dark" ? "dark" : "light"}
    >
      <Container>
        <header className={styles.heading}>
          <h2 id={`${section.id}-title`}>{title}</h2>
          {summary ? <p>{summary}</p> : null}
        </header>
        <div className={styles.contentGrid}>
          <section aria-labelledby={`${section.id}-details-title`} className={styles.details}>
            <h3 id={`${section.id}-details-title`}>联系信息</h3>
            <dl>
              <ContactItem label="商务电话" value={contact.phone} />
              <ContactItem label="联系邮箱" value={contact.email} />
              <ContactItem label="联系地址" value={contact.address} />
            </dl>
          </section>
          <ContactForm initialDirection={initialDirection} key={initialDirection ?? "none"} />
        </div>
        {directions.length > 0 ? (
          <nav aria-label="合作方向" className={styles.directions}>
            <h3>选择您关注的合作方向</h3>
            <ul>
              {directions.map((direction) => (
                <li key={direction}>
                  <Link aria-current={direction === initialDirection ? "page" : undefined} href={`/contact?direction=${encodeURIComponent(direction)}`}>
                    {direction}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </Container>
    </section>
  );
}

function ContactItem({ label, value }: Readonly<{ label: string; value?: string }>) {
  if (!value) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function decodeContact(value: JsonValue | undefined): ContactDetails {
  if (!isJsonObject(value)) return {};
  return {
    address: getString(value.contactAddress),
    email: getString(value.contactEmail),
    phone: getString(value.businessPhone),
  };
}

function decodeDirections(value: JsonValue | undefined) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((item) => {
    if (typeof item === "string") return item.trim() ? [item.trim()] : [];
    if (!isJsonObject(item)) return [];
    const text = getString(item.tagText) ?? getString(item.name);
    return text ? [text] : [];
  }))].slice(0, 24);
}

function getSpacing(value: JsonValue | undefined) {
  return value === "compact" || value === "large" ? value : "standard";
}

function getString(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
