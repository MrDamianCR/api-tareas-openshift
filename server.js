const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// ====== CONFIG PERSISTENCIA EN FICHERO ======
const DATA_FILE = process.env.DATA_FILE || "/tmp/tareas.json";

// Leer JSON de peticiones
app.use(express.json());

// ====== "BASE DE DATOS" EN MEMORIA ======
let tareas = [];
let siguienteId = 1;

// Cargar tareas desde fichero (si existe)
function cargarTareasDesdeFichero() {
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
    console.log("Tareas cargadas desde fichero:", tareas.length);
  } catch (err) {
    console.error("Error cargando tareas desde fichero:", err);
    tareas = [];
    siguienteId = 1;
  }
}

// Guardar tareas en fichero
function guardarTareasEnFichero() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tareas, null, 2), "utf8");
  } catch (err) {
    console.error("Error guardando tareas en fichero:", err);
  }
}

// Cargar al arrancar
cargarTareasDesdeFichero();

// ====== RUTAS API ======

// GET /tareas -> lista
app.get("/tareas", (req, res) => {
  res.json(tareas);
});

// POST /tareas -> crear
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

// DELETE /tareas/:id -> borrar
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

// ====== INTERFAZ WEB (HTML incrustado) ======

const htmlApp = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Gestión de Tareas</title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Inter", system-ui, sans-serif;
        background: #0f172a; /* Azul oscuro elegante */
        color: #e2e8f0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }

      .container {
        width: 100%;
        max-width: 700px;
      }

      h1 {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 10px;
      }

      p.muted {
        color: #94a3b8;
        margin-bottom: 30px;
      }

      .card {
        background: #1e293b;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
        margin-bottom: 32px;
        border: 1px solid #334155;
      }

      label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 6px;
        color: #cbd5e1;
      }

      input,
      textarea {
        width: 100%;
        padding: 10px 12px;
        font-size: 14px;
        border-radius: 8px;
        border: 1px solid #334155;
        background: #0f172a;
        color: #e2e8f0;
        transition: border 0.2s;
        margin-bottom: 14px;
      }

      input:focus,
      textarea:focus {
        border-color: #3b82f6;
        outline: none;
      }

      button {
        padding: 10px 16px;
        border-radius: 8px;
        border: none;
        background: #3b82f6;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      button:hover {
        background: #2563eb;
      }

      h2 {
        font-size: 22px;
        margin-bottom: 16px;
        color: #e2e8f0;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .tarea {
        background: #1e293b;
        padding: 16px;
        border-radius: 10px;
        border: 1px solid #334155;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .tarea h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        color: #f1f5f9;
      }

      .tarea p {
        margin: 0;
        color: #cbd5e1;
      }

      .tarea small {
        color: #94a3b8;
        font-size: 12px;
      }

      .tarea button {
        background: #ef4444;
        font-size: 12px;
        padding: 6px 10px;
      }

      .tarea button:hover {
        background: #dc2626;
      }

      #estado {
        margin-top: 12px;
        color: #94a3b8;
        min-height: 18px;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <h1>Gestión de tareas</h1>
      <p class="muted">Aplicación desplegada en OpenShift (PaaS)</p>

      <div class="card">
        <form id="form-tarea">
          <label for="titulo">Título de la tarea</label>
          <input id="titulo" name="titulo" required />

          <label for="descripcion">Descripción</label>
          <textarea id="descripcion" name="descripcion" rows="2"></textarea>

          <button type="submit">Añadir tarea</button>
          <div id="estado"></div>
        </form>
      </div>

      <h2>Lista de tareas</h2>
      <ul id="lista-tareas"></ul>
    </div>

    <script>
      const lista = document.getElementById("lista-tareas");
      const form = document.getElementById("form-tarea");
      const estado = document.getElementById("estado");

      async function cargarTareas() {
        estado.textContent = "Cargando tareas...";
        try {
          const res = await fetch("/tareas");
          if (!res.ok) throw new Error("Error GET /tareas");
          const datos = await res.json();
          renderTareas(datos);
          estado.textContent = "";
        } catch (err) {
          console.error(err);
          estado.textContent = "Error al cargar las tareas.";
        }
      }

      function renderTareas(tareas) {
        lista.innerHTML = "";
        if (tareas.length === 0) {
          const li = document.createElement("li");
          li.textContent = "No hay tareas.";
          li.classList.add("muted");
          lista.appendChild(li);
          return;
        }

        tareas.forEach((t) => {
          const li = document.createElement("li");
          li.className = "tarea";

          const info = document.createElement("div");
          const titulo = document.createElement("h3");
          titulo.textContent = t.titulo;

          const desc = document.createElement("p");
          desc.textContent = t.descripcion || "Sin descripción";

          const meta = document.createElement("small");
          meta.textContent = "ID: " + t.id;

          info.appendChild(titulo);
          info.appendChild(desc);
          info.appendChild(meta);

          const btn = document.createElement("button");
          btn.textContent = "Eliminar";
          btn.onclick = async () => {
            try {
              const res = await fetch("/tareas/" + t.id, { method: "DELETE" });
              if (!res.ok) throw new Error("Error DELETE /tareas");
              cargarTareas();
            } catch (err) {
              console.error(err);
              estado.textContent = "Error al eliminar la tarea.";
            }
          };

          li.appendChild(info);
          li.appendChild(btn);
          lista.appendChild(li);
        });
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const titulo = document.getElementById("titulo").value.trim();
        const descripcion = document
          .getElementById("descripcion")
          .value.trim();

        if (!titulo) {
          estado.textContent = "El título es obligatorio.";
          return;
        }

        estado.textContent = "Creando tarea...";

        try {
          const res = await fetch("/tareas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titulo, descripcion }),
          });

          if (!res.ok) throw new Error("Error POST /tareas");
          form.reset();
          estado.textContent = "Tarea creada.";
          cargarTareas();
        } catch (err) {
          console.error(err);
          estado.textContent = "Error al crear la tarea.";
        }
      });

      cargarTareas();
    </script>
  </body>
</html>`;

// Ruta para "/"
app.get("/", (req, res) => {
  res.type("html").send(htmlApp);
});

// ====== ARRANQUE SERVIDOR ======
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
