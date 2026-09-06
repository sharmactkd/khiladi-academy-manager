import { Navigate, useParams } from "react-router-dom";

const LegacyStudentSkillRedirect = () => {
  const { studentId } = useParams();
  return <Navigate to={`/skills?tab=progress&student=${studentId}`} replace />;
};

export default LegacyStudentSkillRedirect;
