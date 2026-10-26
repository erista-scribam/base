import prosaAppIcon from "../../../../docs/brands/scribo-brand-kit/prosa.svg?url";

export function ProsaBrandBar() {
  return (
    <div className="prosa-brand-bar" aria-label="Scribo Prosa">
      <img src={prosaAppIcon} alt="" width={32} height={32} decoding="async" />
      <div className="prosa-brand-bar-text">
        <span className="prosa-brand-bar-kicker">Scribo</span>
        <span className="prosa-brand-bar-title">Prosa</span>
      </div>
    </div>
  );
}
