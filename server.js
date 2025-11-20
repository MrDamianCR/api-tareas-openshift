const express = require("express");
const app = express();

// Middleware para poder leer JSON en el body
app.use(express.json());

// "Base de datos" en memoria
let tareas = [];
let siguienteId = 1;

// GET /tareas -> devuelve la lista de tareas
app.get("/tareas", (req, res) => {
  res.json(tareas);
});

// POST /tareas -> crea una nueva tarea
// body esperado: { "titulo": "Mi tarea", "descripcion": "Opcional" }
app.post("/tareas", (req, res) => {
  const { titulo, descripcion } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: "El campo 'titulo' es obligatorio" });
  }

  const nuevaTarea = {
    id: siguienteId++,
    titulo,
    descripcion: descripcion || "",
  };

  tareas.push(nuevaTarea);
  res.status(201).json(nuevaTarea);
});

// DELETE /tareas/:id -> elimina una tarea por id
app.delete("/tareas/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const indice = tareas.findIndex((t) => t.id === id);

  if (indice === -1) {
    return res.status(404).json({ error: "Tarea no encontrada" });
  }

  const eliminada = tareas.splice(indice, 1)[0];
  res.json(eliminada);
});

// Puerto: muy importante que sea 8080 y 0.0.0.0 para OpenShift
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
