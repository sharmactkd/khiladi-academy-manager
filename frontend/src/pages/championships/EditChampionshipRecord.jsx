import { useParams } from "react-router-dom";
import AddChampionshipRecord from "./AddChampionshipRecord.jsx";

const EditChampionshipRecord = () => {
  const { id } = useParams();
  return <AddChampionshipRecord editId={id} />;
};

export default EditChampionshipRecord;
