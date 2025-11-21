const express = require("express");
const fs = require("fs");
const app = express();

const DATA_FILE = process.env.DATA_FILE || "/tmp/tareas.json";

app.use(express.json());

// --- Cargar tareas del fichero ---
let tareas = [];
let siguienteId = 1;

function cargarTareas() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const contenido = fs.readFileSync(DATA_FILE, "utf8");
      if (contenido.trim() !== "") {
        tareas = JSON.parse(contenido);
        const maxId = tareas.reduce(
          (max, t) => (t.id > max ? t.id : max),
          0
        );
        siguienteId = maxId + 1;
      }
    }
    console.log("Tareas cargadas:", tareas.length);
  } catch (e) {
    console.error("Error cargando tareas:", e);
  }
}

function guardarTareas() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tareas, null, 2), "utf8");
  } catch (e) {
    console.error("Error guardando tareas:", e);
  }
}

cargarTareas();

// --- API /tareas ---

app.get("/tareas", (req, res) => {
  res.json(tareas);
});

app.post("/tareas", (req, res) => {
  const { titulo, descripcion } = req.body;
  if (!titulo) {
    return res.status(400).json({ error: "El campo 'titulo' es obligatorio" });
  }
  const nueva = {
    id: siguienteId++,
    titulo,
    descripcion: descripcion || "",
  };
  tareas.push(nueva);
  guardarTareas();
  res.status(201).json(nueva);
});

app.delete("/tareas/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = tareas.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Tarea no encontrada" });
  }
  const eliminada = tareas.splice(idx, 1)[0];
  guardarTareas();
  res.json(eliminada);
});

// --- Ruta raíz muy simple ---
// SI ESTO ESTÁ CORRIENDO, / NO PUEDE DAR "Cannot GET /"

app.get("/", (req, res) => {
  res.send(`
    <h1>Hola desde OpenShift</h1>
    <p>La API está en <code>/tareas</code>.</p>
  `);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor escuchando en puerto", PORT);
});
