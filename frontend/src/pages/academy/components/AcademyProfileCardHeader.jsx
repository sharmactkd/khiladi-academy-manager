import SectionHeader from "../../../components/common/SectionHeader.jsx";

const AcademyProfileCardHeader = ({ eyebrow, icon, title }) => (
  <SectionHeader
    classNames={{ root: "academy-profile-card__header" }}
    eyebrow={eyebrow}
    eyebrowElement="span"
    icon={icon}
    iconInsideCopy
    title={title}
  />
);

export default AcademyProfileCardHeader;
