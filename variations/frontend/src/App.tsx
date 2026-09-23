// ONE page, THREE apps - pick one with the buttons.
// Each app has its own Provider (its own global state) and its own backend:
//   StudyNotes -> localhost:5001    LibraryHub -> localhost:5002    StockRoom -> localhost:5003
// All three stay loaded; the ones you didn't pick are only hidden,
// so switching back and forth keeps your login and data.
import { useState } from "react";
import { StudyNotesApp } from "./studynotes/StudyNotesApp";
import { LibraryHubApp } from "./libraryhub/LibraryHubApp";
import { StockRoomApp } from "./stockroom/StockRoomApp";

function App() {
  // remember which one was picked, even after a refresh
  const [selected, setSelected] = useState(localStorage.getItem("selected") || "studynotes");

  const pick = (name: string) => {
    localStorage.setItem("selected", name);
    setSelected(name);
  };

  return (
    <div>
      <p>
        <button onClick={() => pick("studynotes")} disabled={selected === "studynotes"}>
          1. StudyNotes
        </button>{" "}
        <button onClick={() => pick("libraryhub")} disabled={selected === "libraryhub"}>
          2. LibraryHub
        </button>{" "}
        <button onClick={() => pick("stockroom")} disabled={selected === "stockroom"}>
          3. StockRoom
        </button>
      </p>
      <hr />

      {/* "hidden" = plain HTML way to hide something */}
      <div hidden={selected !== "studynotes"}>
        <StudyNotesApp />
      </div>
      <div hidden={selected !== "libraryhub"}>
        <LibraryHubApp />
      </div>
      <div hidden={selected !== "stockroom"}>
        <StockRoomApp />
      </div>
    </div>
  );
}

export default App;
