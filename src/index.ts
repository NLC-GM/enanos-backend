import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

// ---------- helpers ----------
function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseAge(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

// ---------- rutas ----------
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// GET: leer la lista
app.get("/api/personas", async (_req, res) => {
  try {
    const people = await prisma.person.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(people);
  } catch {
    res.status(500).json({ error: "No se pudo leer" });
  }
});

// POST: crear una
app.post("/api/personas", async (req, res) => {
  const { firstName, lastName, age, arrivalDate, isWorking } = req.body ?? {};

  if (!String(firstName ?? "").trim() || !String(lastName ?? "").trim()) {
    res.status(400).json({ error: "Faltan datos obligatorios" });
    return;
  }

  const parsedArrivalDate = arrivalDate ? new Date(arrivalDate) : new Date();
  if (isNaN(parsedArrivalDate.getTime())) {
    res.status(400).json({ error: "La fecha no es valida" });
    return;
  }

  try {
    const person = await prisma.person.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        age: parseAge(age),
        arrivalDate: parsedArrivalDate,
        isWorking: Boolean(isWorking),
      },
    });
    res.status(201).json(person);
  } catch {
    res.status(500).json({ error: "Error inesperado" });
  }
});

// PATCH: cambiar una parte
app.patch("/api/personas/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  // filtrar el body: solo pasan los campos del modelo
  const body = req.body ?? {};
  const data: Prisma.PersonUpdateInput = {};
  if ("firstName" in body) data.firstName = String(body.firstName).trim();
  if ("lastName" in body) data.lastName = String(body.lastName).trim();
  if ("age" in body) data.age = parseAge(body.age);
  if ("arrivalDate" in body) data.arrivalDate = body.arrivalDate ? new Date(body.arrivalDate) : null;
  if ("isWorking" in body) data.isWorking = Boolean(body.isWorking);

  try {
    const person = await prisma.person.update({ where: { id }, data });
    res.json(person);
  } catch (e: any) {
    if (e.code === "P2025") {
      res.status(404).json({ error: "No existe" });
      return;
    }
    res.status(500).json({ error: "Error inesperado" });
  }
});

// DELETE: eliminar una
app.delete("/api/personas/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  try {
    await prisma.person.delete({ where: { id } });
    res.status(204).end(); // sin body
  } catch (e: any) {
    if (e.code === "P2025") {
      res.status(404).json({ error: "No existe" });
      return;
    }
    res.status(500).json({ error: "Error inesperado" });
  }
});

// "0.0.0.0" permite que el celular se conecte por la red local
app.listen(port, "0.0.0.0", () => {
  console.log(`API escuchando en http://localhost:${port}`);
});