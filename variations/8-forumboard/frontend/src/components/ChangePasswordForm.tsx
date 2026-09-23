// change password (current + new + confirm new)
import { useContext, useState } from "react";
import { ForumContext } from "../context/ForumContext";
import { changePassword } from "../api/authService";

export const ChangePasswordForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const context = useContext(ForumContext);
  if (!context) throw new Error("ChangePasswordForm must be used within ForumProvider");
  const { state, dispatch } = context;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      dispatch({ type: "SET_ERROR", payload: "New passwords do not match" });
      return;
    }

    try {
      await changePassword(state.token, currentPassword, newPassword);
      dispatch({ type: "SET_MESSAGE", payload: "Password changed" });
      onDone();   // tell the parent to close this form
    } catch (error) {
      // e.g. 400 "Current password is wrong"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Change password</h3>
      <div>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="New password (8+ characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Save</button>{" "}
      <button type="button" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
};
