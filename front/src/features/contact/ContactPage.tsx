import Link from "next/link";
import { Container } from "@/components/layout/Container";
import type { ContactInfoViewModel } from "@/types/portal";
import { ContactForm } from "./ContactForm";
import styles from "./ContactPage.module.css";

type ContactPageProps = {
  contact: ContactInfoViewModel;
  directions: string[];
  initialDirection?: string;
};

export function ContactPage({ contact, directions, initialDirection }: Readonly<ContactPageProps>) {
  return (
    <Container as="main" className={styles.contactPage}>
      <header className={styles.pageHeader}>
        <p>联系我们</p>
        <h1>让数据能力更贴近您的业务</h1>
        <span>留下您的合作需求，我们会尽快与您沟通。</span>
      </header>
      <div className={styles.contentGrid}>
        <section aria-labelledby="contact-details-title" className={styles.contactDetails}>
          <h2 id="contact-details-title">联系信息</h2>
          <address>
            <dl>
              <ContactItem label="商务电话" value={contact.businessPhone} />
              <ContactItem label="联系邮箱" value={contact.contactEmail} />
              <ContactItem label="联系地址" value={contact.contactAddress} />
            </dl>
          </address>
        </section>
        <ContactForm initialDirection={initialDirection} />
      </div>
      {directions.length > 0 ? (
        <section aria-labelledby="direction-title" className={styles.directionSection}>
          <p>合作方向</p>
          <h2 id="direction-title">选择您关注的方向</h2>
          <span>选择后会预填到需求描述中，您仍可在表单内自由修改。</span>
          <ul>
            {directions.map((direction) => (
              <li key={direction}>
                <Link
                  aria-current={direction === initialDirection ? "page" : undefined}
                  href={`/contact?direction=${encodeURIComponent(direction)}`}
                >
                  {direction}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}

function ContactItem({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "暂未配置"}</dd>
    </div>
  );
}
