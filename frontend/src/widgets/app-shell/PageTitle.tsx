interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  return <h1 className="text-base font-semibold text-[color:var(--text-primary)]">{title}</h1>;
}
