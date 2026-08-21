import { Dumbbell } from "lucide-react";
import { getSportIcon } from "./sportIconRegistry.js";
import styles from "./MartialArtIcon.module.css";

const MartialArtIcon = ({ sport }) => {
  const iconUrl = getSportIcon(sport);
  const label = `${sport || "Sport or martial art"} icon`;

  if (!iconUrl) {
    return (
      <span className={styles.root} role="img" aria-label={label}>
        <Dumbbell className={styles.fallback} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={styles.root} role="img" aria-label={label}>
      <span
        className={styles.mask}
        aria-hidden="true"
        style={{ "--sport-icon-url": `url("${iconUrl}")` }}
      />
    </span>
  );
};

export default MartialArtIcon;
