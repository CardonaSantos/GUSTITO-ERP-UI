import { dashboardColors } from "../color/colors";

type AnalyticsSummaryCardProps = {
  label: string;
  value: string;
  description?: string;
  accentClassName: string;
  dotClassName?: string;
};

export function AnalyticsSummaryCard({
  label,
  value,
  description,
  accentClassName,
  dotClassName,
}: AnalyticsSummaryCardProps) {
  return (
    <article className={`${dashboardColors.card.base} min-w-0 overflow-hidden`}>
      <div className="mb-2 flex min-w-0 items-center gap-2">
        {dotClassName ? (
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotClassName}`} />
        ) : null}

        <p
          className={`${dashboardColors.text.label} min-w-0 truncate text-[10px] leading-4 tracking-[0.32em]`}
          title={label}
        >
          {label}
        </p>
      </div>

      <p
        className={`${dashboardColors.text.value} ${accentClassName} min-w-0 truncate text-[clamp(1.25rem,2.4vw,2.125rem)] leading-tight`}
        title={value}
      >
        {value}
      </p>

      {description ? (
        <p
          className={`${dashboardColors.text.description} mt-1 min-w-0 truncate text-xs leading-4`}
          title={description}
        >
          {description}
        </p>
      ) : null}
    </article>
  );
}
