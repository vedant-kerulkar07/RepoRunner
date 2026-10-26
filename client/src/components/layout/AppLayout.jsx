
import { Outlet } from "react-router-dom";

export default function AppLayout({ analysis, setAnalysis }) {
  return (
    <Outlet
      context={{
        analysis,
        setAnalysis,
      }}
    />
  );
}
