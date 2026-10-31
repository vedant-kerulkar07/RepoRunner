
import { useState } from "react";
import { Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import WorkspacePage from "./pages/WorkspacePage";
import NotFoundPage from "./pages/NotFoundPage";

import AppLayout from "./components/layout/AppLayout";

export default function App() {
  const [analysis, setAnalysis] = useState(null);

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            analysis={analysis}
            setAnalysis={setAnalysis}
          />
        }
      >
        {/* Home page */}
        <Route index element={<HomePage />} />

        {/* Workspace with inline AI analysis results */}
        <Route
          path="workspace"
          element={<WorkspacePage />}
        />

        {/* 404 page */}
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  );
}
