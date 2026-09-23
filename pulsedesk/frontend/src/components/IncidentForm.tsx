// STEP F5 - create form -> dispatch CREATE_SUCCESS
import { useContext, useState } from "react";
import { IncidentContext } from "../context/IncidentContext";
import { createIncident } from "../api/incidentService";
import { SEVERITIES } from "../types";
import { Form, Input, TextArea, Select, Button } from "./styles";

export const IncidentForm: React.FC = () => {
  const context = useContext(IncidentContext);
  if (!context) throw new Error("IncidentForm must be used within IncidentProvider");
  const { state, dispatch } = context;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("low");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newIncident = await createIncident(state.token, { title, description, severity });

      dispatch({ type: "CREATE_SUCCESS", payload: newIncident });

      // clear the form
      setTitle("");
      setDescription("");
      setSeverity("low");
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h3>Report an incident</h3>

      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <TextArea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      <Button type="submit">Submit ticket</Button>
    </Form>
  );
};
