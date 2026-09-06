import { Camera, Trash2, Upload } from "lucide-react";
import clsx from "clsx";
import styles from "./ProfilePhotoField.module.css";

const ProfilePhotoField = ({ accept = "image/png,image/jpeg,image/webp", className, disabled, label = "Profile Photo", onChange, onRemove, previewUrl }) => (
  <div className={clsx(styles.root, className)}>
    <label className={clsx(styles.preview, previewUrl && styles.hasImage, disabled && styles.disabled)} title={previewUrl ? "Change profile photo" : "Upload profile photo"}>
      {previewUrl ? <img src={previewUrl} alt={`${label} preview`} /> : <Camera size={30} aria-hidden="true" />}
      <span className={styles.upload}>
        <Upload size={17} aria-hidden="true" />
        <strong>{previewUrl ? "Change Photo" : "Upload Photo"}</strong>
        <small>JPG, PNG or WEBP · Maximum 2MB</small>
      </span>
      <input type="file" accept={accept} disabled={disabled} onChange={onChange} />
    </label>
  
  </div>
);

export default ProfilePhotoField;