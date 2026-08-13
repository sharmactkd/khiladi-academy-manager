import SectionHeader from "../../../components/common/SectionHeader.jsx";

const StudentFormSection = ({ children, className = "", ...headerProps }) => (
  <section className={`student-form-card ${className}`.trim()}>
    <SectionHeader classNames={{ root: "student-form-card__header", icon: "student-form-card__icon" }} {...headerProps} />
    {children}
  </section>
);

export default StudentFormSection;
