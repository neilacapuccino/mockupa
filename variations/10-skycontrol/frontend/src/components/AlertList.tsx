// AlertList.tsx - warning and danger banners with dismiss buttons
import { useContext } from "react";
import { FleetContext } from "../context/FleetContext";

export const AlertList: React.FC = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error("AlertList must be used within FleetProvider");
  const { state, dispatch } = context;

  if (state.alerts.length === 0) return null;

  return (
    <ul>
      {state.alerts.map((alert) => (
        <li key={alert.id} style={{ color: alert.type === "DANGER" ? "red" : "darkorange" }}>
          <strong>[{alert.type}]</strong> {alert.message}{" "}
          <button onClick={() => dispatch({ type: "DISMISS_ALERT", payload: alert.id })}>Dismiss</button>
        </li>
      ))}
    </ul>
  );
};
