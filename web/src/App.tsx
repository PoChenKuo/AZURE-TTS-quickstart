import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import SettingsPage from "./pages/SettingsPage";
import VoiceManagerPage from "./pages/VoiceManagerPage";
import ConversationPage from "./pages/ConversationPage";
import { useCleanupScheduler } from "./hooks/useCleanupScheduler";

function App() {
  useCleanupScheduler();

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/conversation" replace />} />
        <Route path="/conversation" element={<ConversationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/manager" element={<VoiceManagerPage />} />
        <Route path="*" element={<Navigate to="/conversation" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
