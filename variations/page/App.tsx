// ONE page, NINE apps - pick one with the buttons.
// This page does NOT have its own app code: it just shows each variation's
// frontend/src/App.tsx (the same file that runs when you start that frontend on its own).
// All nine stay loaded; the ones you didn't pick are only hidden,
// so switching back and forth keeps your login and data.
import { useState } from "react";
import StudyNotes from "../1-studynotes/frontend/src/App";
import LibraryHub from "../2-libraryhub/frontend/src/App";
import StockRoom from "../3-stockroom/frontend/src/App";
import ProjectBoard from "../4-projectboard/frontend/src/App";
import StaffDirectory from "../5-staffdirectory/frontend/src/App";
import CafeOrders from "../6-cafeorders/frontend/src/App";
import ClassPortal from "../7-classportal/frontend/src/App";
import ForumBoard from "../8-forumboard/frontend/src/App";
import EventPass from "../9-eventpass/frontend/src/App";

const APPS = [
  { key: "studynotes", label: "1. StudyNotes", Component: StudyNotes },
  { key: "libraryhub", label: "2. LibraryHub", Component: LibraryHub },
  { key: "stockroom", label: "3. StockRoom", Component: StockRoom },
  { key: "projectboard", label: "4. ProjectBoard", Component: ProjectBoard },
  { key: "staffdirectory", label: "5. StaffDirectory", Component: StaffDirectory },
  { key: "cafeorders", label: "6. CafeOrders", Component: CafeOrders },
  { key: "classportal", label: "7. ClassPortal", Component: ClassPortal },
  { key: "forumboard", label: "8. ForumBoard", Component: ForumBoard },
  { key: "eventpass", label: "9. EventPass", Component: EventPass },
];

function App() {
  // remember which one was picked, even after a refresh
  const [selected, setSelected] = useState(localStorage.getItem("selected") || "studynotes");

  const pick = (key: string) => {
    localStorage.setItem("selected", key);
    setSelected(key);
  };

  return (
    <div>
      <p>
        {APPS.map((app) => (
          <button key={app.key} onClick={() => pick(app.key)} disabled={selected === app.key}>
            {app.label}
          </button>
        ))}
      </p>
      <hr />

      {/* "hidden" = plain HTML way to hide something */}
      {APPS.map((app) => (
        <div key={app.key} hidden={selected !== app.key}>
          <app.Component />
        </div>
      ))}
    </div>
  );
}

export default App;
