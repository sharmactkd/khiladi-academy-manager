import { useParams } from "react-router-dom";
import BatchForm from "./AddBatch.jsx";

const EditBatch = () => {
  const { id } = useParams();
  return <BatchForm mode="edit" batchId={id} />;
};

export default EditBatch;