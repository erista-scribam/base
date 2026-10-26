import prosaAppIcon from "../../../../docs/brands/scribam-brand-kit/prosa.svg?url";

export function ProsaBrandBar() {
  return (
    <div className="prosa-brand-bar" aria-label="Scribam Prosa">
      <img src={prosaAppIcon} alt="" width={32} height={32} decoding="async" />
      <div className="prosa-brand-bar-text">
        <span className="prosa-brand-bar-kicker">Scribam</span>
        <span className="prosa-brand-bar-title">Prosa</span>
      </div>
    </div>
  );
}
