import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [status, setStatus] = useState("Loading todos...");
  const missingBackendMessage =
    "Backend not connected yet. Deploy once, then replace amplify_outputs.json with the generated file.";
  const client = useMemo(
    () => (outputs?.data?.url ? generateClient() : null),
    []
  );

  useEffect(() => {
    if (!client) {
      return undefined;
    }

    const subscription = client.models.Todo.observeQuery().subscribe({
      next: ({ items }) => {
        setTodos(items);
        setStatus(items.length ? "" : "No todos yet. Create your first one.");
      },
      error: () => {
        setStatus("Could not load todos. Verify amplify_outputs.json.");
      },
    });

    return () => subscription.unsubscribe();
  }, [client]);

  function createTodo() {
    if (!client) {
      window.alert(
        "Deploy the backend first, then update amplify_outputs.json from Amplify Hosting."
      );
      return;
    }

    const content = window.prompt("Todo content");
    if (!content) {
      return;
    }

    client.models.Todo.create({ content });
  }

  const statusMessage = client ? status : missingBackendMessage;

  return (
    <main className="app-shell">
      <h1>Amplify Todo Starter</h1>
      <p className="subtitle">React + Amplify Gen 2 backend ready for deploy</p>
      <button onClick={createTodo}>+ New Todo</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      {statusMessage && <p className="status">{statusMessage}</p>}
      <p className="hint">
        Quickstart:
        {" "}
        <a
          href="https://docs.amplify.aws/react/start/quickstart/"
          target="_blank"
          rel="noreferrer"
        >
          docs.amplify.aws/react/start/quickstart
        </a>
      </p>
    </main>
  );
}

export default App;
