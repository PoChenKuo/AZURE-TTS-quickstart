import { SettingsProvider } from "../context/SettingsContext";
import { SettingsFormSection } from "../components/SettingsFormSection";
import { SettingsBackupSection } from "../components/SettingsBackupSection";

// Presentation-only shell; actual settings logic lives in SettingsContext.
function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsFormSection />
      <SettingsBackupSection />
    </SettingsProvider>
  );
}

export default SettingsPage;
