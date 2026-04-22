const express = require("express");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`);

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const ALLOWED_MEAL_NAMES = ["breakfast", "lunch", "dinner", "snack", "beverage"];

let db;
let mealsCollection;

async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    db = client.db(); // uses DB name from connection string
    mealsCollection = db.collection("meals");

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// Home route
app.get("/", (req, res) => {
  res.redirect("/upload");
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

// REST calls
function buildMealQuery(queryParams) {
  const { protein, carbs, fats, sugar, minProtein, maxSugar } = queryParams;
  const query = {};

  if (protein !== undefined) {
    query.protein = Number(protein);
  }

  if (carbs !== undefined) {
    query.carbs = Number(carbs);
  }

  if (fats !== undefined) {
    query.fats = Number(fats);
  }

  if (sugar !== undefined) {
    query.sugar = Number(sugar);
  }

  if (minProtein !== undefined) {
    query.protein = { $gte: Number(minProtein) };
  }

  if (maxSugar !== undefined) {
    query.sugar = { $lt: Number(maxSugar) };
  }

  return query;
}

async function createMeal(req, res, shouldRedirect = false) {
  try {
    const { mealName, protein, carbs, fats, sugar, date, notes } = req.body;

    if (
      mealName === undefined ||
      protein === undefined ||
      carbs === undefined ||
      fats === undefined ||
      sugar === undefined ||
      date === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const parsedProtein = Number(protein);
    const parsedCarbs = Number(carbs);
    const parsedFats = Number(fats);
    const parsedSugar = Number(sugar);
    const parsedDate = new Date(date);
    const normalizedMealName = String(mealName).trim().toLowerCase();

    if (
      !ALLOWED_MEAL_NAMES.includes(normalizedMealName) ||
      Number.isNaN(parsedProtein) ||
      Number.isNaN(parsedCarbs) ||
      Number.isNaN(parsedFats) ||
      Number.isNaN(parsedSugar) ||
      Number.isNaN(parsedDate.getTime())
    ) {
      return res.status(400).json({ error: "Invalid field types" });
    }

    const newMeal = {
      mealName: normalizedMealName,
      protein: parsedProtein,
      carbs: parsedCarbs,
      fats: parsedFats,
      sugar: parsedSugar,
      date: parsedDate,
      notes: notes || ""
    };

    const result = await mealsCollection.insertOne(newMeal);

    if (shouldRedirect) {
      return res.redirect("/list");
    }

    return res.status(201).json({
      message: "Meal uploaded successfully",
      insertedId: result.insertedId
    });
  } catch (error) {
    console.error("Upload error:", error);

    if (shouldRedirect) {
      return res.status(500).send("Failed to upload meal");
    }

    return res.status(500).json({ error: "Failed to upload meal" });
  }
}

// POST /upload
// Add a new meal document
app.post("/upload", async (req, res) => {
  const wantsHtml = req.headers.accept && req.headers.accept.includes("text/html");
  await createMeal(req, res, wantsHtml);
});

// REST calls
// POST /meal
// REST route to add a new meal document
app.post("/meal", async (req, res) => {
  await createMeal(req, res);
});

// GET /meals
// REST route to list or query meals
app.get("/meals", async (req, res) => {
  try {
    const query = buildMealQuery(req.query);
    const sort = req.query.maxSugar !== undefined ? { sugar: 1 } : {};
    const meals = await mealsCollection.find(query).sort(sort).toArray();
    return res.json(meals);
  } catch (error) {
    console.error("Meals error:", error);
    return res.status(500).json({ error: "Failed to fetch meals" });
  }
});

// GET /list
// Return all meals
app.get("/list", async (req, res) => {
  try {
    const meals = await mealsCollection.find({}).toArray();
    const wantsHtml = req.headers.accept && req.headers.accept.includes("text/html");

    if (wantsHtml) {
      return res.render("list", { meals });
    }

    return res.json(meals);
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({ error: "Failed to fetch meals" });
  }
});

// GET /query
// Example:
// /query?protein=20
app.get("/query", async (req, res) => {
  try {
    return res.render("query");
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({ error: "Failed to query meals" });
  }
});

connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
