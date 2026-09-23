// App.tsx - shell layout wrapped inside <FleetProvider>
import { FleetProvider } from "./context/FleetContext";
import { AlertList } from "./components/AlertList";
import { WeatherToolbar } from "./components/WeatherToolbar";
import { FlightTable } from "./components/FlightTable";
import { ControlPanel } from "./components/ControlPanel";

function App() {
  return (
    <FleetProvider>
      <div>
        <h1>SkyControl</h1>
        <AlertList />
        <WeatherToolbar />
        <FlightTable />
        <ControlPanel />
      </div>
    </FleetProvider>
  );
}

export default App;
