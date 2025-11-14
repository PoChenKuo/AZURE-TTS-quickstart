import { VoiceLibrarySection } from "../components/VoiceLibrarySection";
import { CachedAudioSection } from "../components/CachedAudioSection";
import { WorkerLogSection } from "../components/WorkerLogSection";

function VoiceManagerPage() {
  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <VoiceLibrarySection />
      <CachedAudioSection />
      <WorkerLogSection />
    </div>
  );
}

export default VoiceManagerPage;
