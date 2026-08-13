import { Camera, Trash2, Upload } from "lucide-react";
import clsx from "clsx";
import styles from "./ProfilePhotoField.module.css";

const ProfilePhotoField = ({ accept = "image/png,image/jpeg,image/webp", className, disabled, label = "Profile Photo", onChange, onRemove, previewUrl }) => (
  <div className={clsx(styles.root, className)}>
    <div className={styles.preview}>{previewUrl ? <img src={previewUrl} alt={`${label} preview`} /> : <Camera size={30} aria-hidden="true" />}</div>
    <div className={styles.copy}><strong>{label}</strong><small>JPG, PNG or WEBP • Maximum 2MB</small><div className={styles.actions}>
      <label><Upload size={14} />{previewUrl ? "Change Photo" : "Upload Photo"}<input type="file" accept={accept} disabled={disabled} onChange={onChange} /></label>
      {previewUrl ? <button type="button" disabled={disabled} onClick={onRemove}><Trash2 size={14} /> Remove</button> : null}
    </div></div>
  </div>
);

export default ProfilePhotoField;
