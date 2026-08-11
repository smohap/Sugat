import { PageHeader } from "./page-header";

/**
 * The rail lists every section a role may open, and stage 2 has built two of
 * them. Rather than link into a 404, the rest say which stage delivers them.
 */
export function ComingInStage({
  eyebrow,
  title,
  stage,
  detail,
}: {
  eyebrow: string;
  title: string;
  stage: number;
  detail: string;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} />
      <div className="card max-w-[520px] p-5">
        <p className="mono-label text-brass">Stage {stage}</p>
        <p className="mt-2 text-[14.5px] leading-relaxed">{detail}</p>
      </div>
    </>
  );
}
