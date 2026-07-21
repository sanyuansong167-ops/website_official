import type { MouseEventHandler } from "react";
import styles from "./PageState.module.css";

type PageStateAction = {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

type PageStateProps = {
  status: "error" | "unavailable";
  title: string;
  description: string;
  action?: PageStateAction;
};

export function PageState({ status, title, description, action }: PageStateProps) {
  return (
    <section aria-labelledby="page-state-title" className={styles.pageState} data-status={status}>
      <p className={styles.label}>{status === "error" ? "服务提示" : "建设中"}</p>
      <h1 id="page-state-title">{title}</h1>
      <p className={styles.description}>{description}</p>
      {action ? (
        <button className={styles.action} onClick={action.onClick} type="button">
          {action.label}
        </button>
      ) : null}
    </section>
  );
}
