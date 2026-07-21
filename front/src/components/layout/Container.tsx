import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import styles from "./Container.module.css";

type ContainerProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: ContainerProps<T>) {
  const Component = as ?? "div";
  const classes = className ? `${styles.container} ${className}` : styles.container;

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
