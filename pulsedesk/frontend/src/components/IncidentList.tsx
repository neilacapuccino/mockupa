// STEP F4 - list (GET)  +  STEP F6 - update / delete
// same idea as Discord's PieList
import { useContext, useEffect } from "react";
import { IncidentContext } from "../context/IncidentContext";
import { fetchIncidents, updateIncident, deleteIncident } from "../api/incidentService";
import { SEVERITIES, STATUSES, type Incident } from "../types";
import { Grid, Card, Row, Select, DeleteButton } from "./styles";

export const IncidentList: React.FC = () => {
  const context = useContext(IncidentContext);
  if (!context) throw new Error("IncidentList must be used within IncidentProvider");
  const { state, dispatch } = context;

  // STEP F4: load the incidents when the list shows up
  useEffect(() => {
    const loadIncidents = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const data = await fetchIncidents(state.token);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadIncidents();
  }, [dispatch, state.token]);

  // STEP F6: change status or severity
  const handleUpdate = async (id: string, changes: Partial<Incident>) => {
    try {
      const updated = await updateIncident(state.token, id, changes);
      dispatch({ type: "UPDATE_SUCCESS", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  // STEP F6: delete
  const handleDelete = async (id: string) => {
    try {
      await deleteIncident(state.token, id);
      dispatch({ type: "DELETE_SUCCESS", payload: id });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  if (state.loading) return <p>Loading incidents...</p>;

  if (state.incidents.length === 0) return <p>No incidents yet.</p>;

  return (
    <Grid>
      {state.incidents.map((incident) => (
        <Card key={incident.id}>
          <h4>{incident.title}</h4>
          <p>{incident.description}</p>

          <Row>
            <span>Severity</span>
            <Select
              value={incident.severity}
              onChange={(e) => handleUpdate(incident.id, { severity: e.target.value })}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Row>

          <Row>
            <span>Status</span>
            <Select
              value={incident.status}
              onChange={(e) => handleUpdate(incident.id, { status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Row>

          <DeleteButton onClick={() => handleDelete(incident.id)}>Delete</DeleteButton>
        </Card>
      ))}
    </Grid>
  );
};
