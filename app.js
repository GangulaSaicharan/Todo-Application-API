const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

let db = null;

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasTodoProperty = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND status='${status}'
        AND priority='${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%'
       AND priority='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND status='${status}';`;

      break;
    default:
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
  }
  const data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT * FROM todo
  WHERE id=${todoId};`;
  const todoDetails = await db.get(getTodoQuery);
  response.send(todoDetails);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
    INSERT INTO todo(id,todo,priority,status)
    VALUES (${id},'${todo}','${priority}','${status}');`;

  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let requestBody = request.body;
  const { id, todo, priority, status } = request.body;
  let updateColumn = "";
  let updateQuery = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      console.log(updateColumn);
      updateQuery = `
        UPDATE todo
        SET 
        status='${status}'
        WHERE
        id= ${todoId};`;
      await db.run(updateQuery);
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      console.log(updateColumn);
      updateQuery = `
        UPDATE todo
        SET
        priority='${priority}'
        WHERE
        id=${todoId};`;
      await db.run(updateQuery);
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      updateQuery = `
        UPDATE todo
        SET todo = '${todo}'
        WHERE 
        id=${todoId};`;
      await db.run(updateQuery);
      break;
  }
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
