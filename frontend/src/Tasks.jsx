import { useEffect, useState } from "react";
import { completeTask, createTask, fetchTasks } from "./api.js";

export default function Tasks({ onUnauthorized }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleError(err) {
    if (err.status === 401) return onUnauthorized();
    setError(err.message);
  }

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(handleError)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      const task = await createTask(title);
      setTasks((prev) => [task, ...prev]);
      setTitle("");
    } catch (err) {
      handleError(err);
    }
  }

  async function handleComplete(id) {
    setError("");
    try {
      const updated = await completeTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleAdd} className="row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          maxLength={200}
          aria-label="Task title"
          required
        />
        <button type="submit">Add</button>
      </form>

      {error && <p role="alert" className="error">{error}</p>}

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="muted">No tasks yet. Add your first one above.</p>
      ) : (
        <ul className="tasks">
          {tasks.map((task) => (
            <li key={task.id} className={task.completed ? "done" : ""}>
              <span>{task.title}</span>
              {task.completed ? (
                <span className="badge">Done</span>
              ) : (
                <button onClick={() => handleComplete(task.id)}>Mark completed</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
