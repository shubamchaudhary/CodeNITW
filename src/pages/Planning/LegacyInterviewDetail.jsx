import { getInterviewCard } from "../../Data/interviewCards";
import { InterviewCardDetail } from "../../components/InterviewCardDetail";

// A task from the retired Topics page, opened in the planner. Loaded on
// demand (React.lazy in Planning.jsx): the cards' content is ~250 KB that no
// new plan uses.
export default function LegacyInterviewDetail({ refId, note, onNoteChange }) {
  return <InterviewCardDetail item={getInterviewCard(refId)} note={note} onNoteChange={onNoteChange} />;
}
