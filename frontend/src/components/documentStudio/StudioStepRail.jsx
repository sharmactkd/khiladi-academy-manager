import { Check } from "lucide-react";
import styles from "./DocumentStudio.module.css";

const StudioStepRail = ({ steps, activeStep, onChange }) => (
  <nav className={styles.stepRail} aria-label="Template builder steps">
    {steps.map((step, index) => {
      const active = activeStep === step.id;
      return <button key={step.id} type="button" className={active ? styles.activeStep : ""} onClick={() => onChange(step.id)}>
        <span>{index < steps.findIndex((item) => item.id === activeStep) ? <Check size={14}/> : String(index + 1).padStart(2, "0")}</span>
        <div><strong>{step.label}</strong><small>{step.description}</small></div>
      </button>;
    })}
  </nav>
);

export default StudioStepRail;
