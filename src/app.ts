import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";

const app = express();
app.use(express.json());
// All code should go below this line

app.get("/", (_req, res) => {
  res.json({ message: "Hello World!" }).status(200);
});

app.get("/dogs", async (req, res) => {
  const dogs = await prisma.dog.findMany();

  if (!dogs)
    return res.send(
      `<h1> No Dogs Found, Please create one </h1>`
    );
  return res.send(dogs).status(200);
});

app.get("/dogs/:id", async (req, res) => {
  const dogId = +req.params.id;

  if (isNaN(dogId))
    return res
      .status(400)
      .send({ message: "id should be a number" });

  const dog = await Promise.resolve(
    prisma.dog.findUnique({
      where: {
        id: dogId,
      },
    })
  ).catch(() => null);

  if (dog === null)
    return res.status(204).send({
      message: "unable to find dog with that id",
    });
  return res.send(dog).status(200);
});

app.post("/dogs", async (req, res) => {
  const { name, description, breed, age } = req.body;

  const validKeys: Record<string, string> = {
    name: "string",
    description: "string",
    breed: "string",
    age: "number",
  };

  const errors: string[] = [];

  for (const key of Object.keys(req.body)) {
    if (
      !Object.prototype.hasOwnProperty.call(validKeys, key)
    ) {
      errors.push(`'${key}' is not a valid key`);
    } else if (typeof req.body[key] !== validKeys[key]) {
      errors.push(`${key} should be a ${validKeys[key]}`);
    }
  }

  // Check for missing required keys
  for (const key of Object.keys(validKeys)) {
    if (req.body[key] === undefined) {
      errors.push(`${key} should be a ${validKeys[key]}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).send({ errors: errors });
  }

  try {
    const createDog = await prisma.dog.create({
      data: { name, description, breed, age },
    });
    errors.length = 0;

    return res.status(201).send({
      message: "Dog created successfully",
      dog: createDog,
    });
  } catch (error) {
    // Handle database or other server errors
    return res
      .status(500)
      .send({ error: "Internal Server Error" });
  }
});

// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;

app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
