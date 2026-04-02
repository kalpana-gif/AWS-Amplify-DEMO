import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [status, setStatus] = useState("Syncing with backend...");
  const [statusTone, setStatusTone] = useState("info");
  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const missingBackendMessage =
    "Backend not connected yet. Deploy once, then replace amplify_outputs.json with the generated file.";
  const client = useMemo(
    () => (outputs?.data?.url ? generateClient() : null),
    []
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    []
  );

  useEffect(() => {
    if (!client) {
      return undefined;
    }

    const subscription = client.models.Todo.observeQuery().subscribe({
      next: ({ items }) => {
        setTodos(items);
        setStatus(
          items.length
            ? "Everything is synced."
            : "No tasks yet. Add your first one below."
        );
        setStatusTone("info");
      },
      error: () => {
        setStatus("Could not load tasks. Verify amplify_outputs.json.");
        setStatusTone("error");
      },
    });

    return () => subscription.unsubscribe();
  }, [client]);

  async function createTodo(event) {
    event.preventDefault();

    if (!client) {
      setFormError(
        "Deploy your backend first, then update amplify_outputs.json from Amplify Hosting."
      );
      return;
    }

    const content = draft.trim();
    if (!content) {
      setFormError("Add a short task before submitting.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await client.models.Todo.create({ content });
      setDraft("");
    } catch {
      setFormError("Could not create task. Try again.");
      setStatusTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(value) {
    if (!value) {
      return "Just now";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Recently";
    }

    return dateFormatter.format(parsed);
  }

  const isConnected = Boolean(client);
  const statusMessage = isConnected ? status : missingBackendMessage;
  const statusClass = isConnected ? statusTone : "warning";
  const totalLabel = `${todos.length} ${todos.length === 1 ? "Task" : "Tasks"}`;

  return (
    <main className="app">
      <header className="hero">
        <h1>Task Flow</h1>
        <p className="subtitle">
          A calm workspace for capturing and tracking tasks in your Amplify app.
        </p>
        <div className="hero-metrics">
          <span className={`chip ${isConnected ? "chip-online" : "chip-offline"}`}>
            {isConnected ? "Backend Connected" : "Backend Missing"}
          </span>
          <span className="chip chip-muted">{totalLabel}</span>
        </div>
      </header>

      <section className="panel">
        <form className="compose-form" onSubmit={createTodo}>
          <label htmlFor="todo-content">Create a new task</label>
          <div className="composer-row">
            <input
              id="todo-content"
              className="composer-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write what needs to be done..."
              maxLength={140}
              disabled={isSubmitting}
            />
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Task"}
            </button>
          </div>
          {formError && <p className="form-error">{formError}</p>}
        </form>
      </section>

      <section className="panel board">
        <div className="board-head">
          <h2>Current Tasks</h2>
          <span className="board-count">{totalLabel}</span>
        </div>

        {todos.length ? (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className="todo-item">
                <span className="todo-content">{todo.content}</span>
                <time className="todo-time">{formatDate(todo.createdAt)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No tasks yet. Add your first one above.</p>
        )}

        {statusMessage && <p className={`status is-${statusClass}`}>{statusMessage}</p>}
      </section>

      <p className="hint">
        Need setup help?
        {" "}
        <a
          href="https://docs.amplify.aws/react/start/quickstart/"
          target="_blank"
          rel="noreferrer"
        >
          Amplify React quickstart
        </a>
      </p>
    </main>
  );
}

export default App;
