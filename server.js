//Fuerzo la build en openshift
//Hola

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// Ruta del fichero donde guardaremos las tareas
const DATA_FILE = path.join(__dirname, "tareas.json");

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

// Leer JSON en el body (para POST /tareas)
app.use(express.json());

// "Base de datos" en memoria
let tareas = [];
let siguienteId = 1;

// --- Funciones para cargar y guardar en fichero ---

function cargarTareasDesdeFichero() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const contenido = fs.readFileSync(DATA_FILE, "utf8");
      if (contenido.trim() !== "") {
        tareas = JSON.parse(contenido);

        // Calcular el siguienteId en base a las tareas existentes
        const maxId = tareas.reduce(
          (max, t) => (t.id > max ? t.id : max),
          0
        );
        siguienteId = maxId + 1;
      }
    }
    console.log("Tareas cargadas desde fichero:", tareas.length);
  } catch (err) {
    console.error("Error cargando tareas desde fichero:", err);
    tareas = [];
    siguienteId = 1;
  }
}

function guardarTareasEnFichero() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tareas, null, 2), "utf8");
  } catch (err) {
    console.error("Error guardando tareas en fichero:", err);
  }
}

// Cargar tareas al arrancar el servidor
cargarTareasDesdeFichero();

// --- Rutas de la API ---

// GET /tareas -> devuelve la lista de tareas
app.get("/tareas", (req, res) => {
  res.json(tareas);
});

// POST /tareas -> crea una nueva tarea
app.post("/tareas", (req, res) => {
  console.log("POST /tareas body:", req.body);

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
  guardarTareasEnFichero(); 
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
  guardarTareasEnFichero(); 
  res.json(eliminada);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
