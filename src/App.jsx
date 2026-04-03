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
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingDraft, setEditingDraft] = useState("");
  const [savingTodoId, setSavingTodoId] = useState("");
  const [deletingTodoId, setDeletingTodoId] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(null);
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
        setLastSyncAt(new Date().toISOString());
        setActionError("");
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
      setStatus("Task added.");
      setStatusTone("info");
    } catch {
      setFormError("Could not create task. Try again.");
      setStatusTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(todo) {
    setEditingId(todo.id);
    setEditingDraft(todo.content);
    setActionError("");
  }

  function cancelEditing() {
    setEditingId("");
    setEditingDraft("");
    setActionError("");
  }

  async function updateTodo(todoId, originalContent) {
    if (!client) {
      setActionError("Backend is not connected yet.");
      return;
    }

    const content = editingDraft.trim();
    if (!content) {
      setActionError("Task cannot be empty.");
      return;
    }

    if (content === originalContent.trim()) {
      cancelEditing();
      return;
    }

    setSavingTodoId(todoId);
    setActionError("");

    try {
      await client.models.Todo.update({ id: todoId, content });
      cancelEditing();
      setStatus("Task updated.");
      setStatusTone("info");
    } catch {
      setActionError("Could not update task. Try again.");
      setStatusTone("error");
    } finally {
      setSavingTodoId("");
    }
  }

  async function deleteTodo(todoId) {
    if (!client) {
      setActionError("Backend is not connected yet.");
      return;
    }

    setDeletingTodoId(todoId);
    setActionError("");

    try {
      await client.models.Todo.delete({ id: todoId });
      if (editingId === todoId) {
        cancelEditing();
      }
      setStatus("Task deleted.");
      setStatusTone("info");
    } catch {
      setActionError("Could not delete task. Try again.");
      setStatusTone("error");
    } finally {
      setDeletingTodoId("");
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
  const canSubmit = draft.trim().length > 0 && !isSubmitting;
  const orderedTodos = useMemo(
    () =>
      [...todos].sort((first, second) => {
        const firstDate = new Date(
          first.updatedAt ?? first.createdAt ?? 0
        ).getTime();
        const secondDate = new Date(
          second.updatedAt ?? second.createdAt ?? 0
        ).getTime();
        return secondDate - firstDate;
      }),
    [todos]
  );
  const syncLabel = lastSyncAt ? `Last synced ${formatDate(lastSyncAt)}` : "Awaiting sync";

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
            <button type="submit" className="primary-btn" disabled={!canSubmit}>
              {isSubmitting ? "Adding..." : "Add Task"}
            </button>
          </div>
          {formError && <p className="form-error">{formError}</p>}
        </form>
      </section>

      <section className="panel board">
        <div className="board-head">
          <h2>Current Tasks</h2>
          <div className="board-meta">
            <span className="board-count">{totalLabel}</span>
            <span className="board-sync">{syncLabel}</span>
          </div>
        </div>

        {orderedTodos.length ? (
          <ul className="todo-list">
            {orderedTodos.map((todo) => {
              const isEditing = editingId === todo.id;
              const isSaving = savingTodoId === todo.id;
              const isDeleting = deletingTodoId === todo.id;
              const isBusy = isSaving || isDeleting;

              return (
              <li key={todo.id} className="todo-item">
                <div className="todo-main">
                  {isEditing ? (
                    <input
                      className="edit-input"
                      value={editingDraft}
                      onChange={(event) => setEditingDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          updateTodo(todo.id, todo.content);
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelEditing();
                        }
                      }}
                      maxLength={140}
                      autoFocus
                      disabled={isBusy}
                    />
                  ) : (
                    <p className="todo-content">{todo.content}</p>
                  )}
                  <time className="todo-time">{formatDate(todo.updatedAt ?? todo.createdAt)}</time>
                </div>
                <div className="todo-actions">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="subtle-btn"
                        onClick={cancelEditing}
                        disabled={isBusy}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="primary-btn compact"
                        onClick={() => updateTodo(todo.id, todo.content)}
                        disabled={isBusy || !editingDraft.trim()}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="subtle-btn"
                        onClick={() => startEditing(todo)}
                        disabled={Boolean(deletingTodoId)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => deleteTodo(todo.id)}
                        disabled={isBusy || Boolean(savingTodoId)}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-state">No tasks yet. Add your first one above.</p>
        )}

        {actionError && <p className="form-error">{actionError}</p>}
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
