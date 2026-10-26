import lanistaAppIcon from "../../../../docs/brands/scribo-brand-kit/lanista.svg?url";
import scriboWordmarkDark from "../../../../docs/brands/scribo-brand-kit/scribo-wordmark-dark.svg?url";

export function LanistaBrandHeader() {
  return (
    <header className="lanista-brand-header">
      <img
        className="lanista-wordmark"
        src={scriboWordmarkDark}
        alt="Scribo — Built for Writers, Not Editors."
        width={760}
        height={180}
        decoding="async"
      />
      <div className="lanista-product-row">
        <img src={lanistaAppIcon} alt="" width={48} height={48} decoding="async" />
        <div className="lanista-product-copy">
          <h1>Lanista</h1>
          <p className="sub">Open a project in Scribo Prosa</p>
        </div>
      </div>
    </header>
  );
}
