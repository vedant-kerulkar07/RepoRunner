
import { useNavigate, useOutletContext } from "react-router-dom";
import RepositoryAnalyzer from "../components/repository/RepositoryAnalyzer";

export default function HomePage() {
  const navigate = useNavigate();
  const { setAnalysis } = useOutletContext();

  const handleAnalyzed = (data) => {
    setAnalysis(data);
    navigate("/workspace");
  };

  return <RepositoryAnalyzer onAnalyzed={handleAnalyzed} />;
}
