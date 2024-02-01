import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";

const app = express();
app.use(express.json());
// All code should go below this line

app.get("/", (_req, res) => {
  return res.json({ message: "Hello World!" }).status(200);
});

app.get("/dogs", async (req, res) => {
  const dogs = await prisma.dog.findMany();

  if (!dogs)
    return res.send(
      `<h1> No Dogs Found, Please create one </h1>`
    );
  return res.status(200).send(dogs);
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
  return res.status(200).send(dog);
});

app.post("/dogs", async (req, res) => {
  const bodyData = req.body;

  const validKeys: Record<string, string> = {
    name: "string",
    description: "string",
    breed: "string",
    age: "number",
  };

  const errors: string[] = [
    ...validateBodyKeys(bodyData, validKeys),
    ...missingKeys(bodyData, validKeys),
    ...rejectInvalidKeys(bodyData, validKeys),
  ];

  if (errors.length > 0) {
    return res.status(400).send({ errors: errors });
  }

  try {
    const createDog = await prisma.dog.create({
      data: bodyData,
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

app.patch("/dogs/:id", async (req, res) => {
  const dogId = +req.params.id;

  const validKeys: Record<string, string> = {
    name: "string",
    description: "string",
    breed: "string",
    age: "number",
  };

  if (isNaN(dogId))
    return res
      .status(400)
      .send({ message: "id should be a number" });

  const errors = rejectInvalidKeys(req.body, validKeys);
  if (errors.length > 0) return res.status(400).send({ errors: errors });
  
  const updateDog = await Promise.resolve(
    prisma.dog.update({
      data: req.body,
      where: {
        id: dogId,
      },
    })
  )
    .catch(() => null)
    .finally(() => (errors.length = 0));

  if (updateDog === null)
    return res
      .status(204)
      .send({ message: "unable to find that dog" });
  return res.status(201).send(updateDog);
});

app.delete("/dogs/:id", async (req, res) => {
  const dogId = +req.params.id;
  if (isNaN(dogId))
    return res
      .status(400)
      .send({ message: "id should be a number" });
  const dog = await Promise.resolve(
    prisma.dog.delete({
      where: {
        id: dogId,
      },
    })
  ).catch(() => null);

  if (dog === null) return res.status(204).send({});

  return res.status(200).send(dog);
});

// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;

app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
//TODO: COME BACK AND FIX THESE ANYS
function validateBodyKeys(
  body: Record<string, unknown>,
  validKeys: Record<string, unknown>
) {
  const errors: string[] = [];
  for (const key of Object.keys(body)) {
    if (typeof body[key] !== validKeys[key]) {
      errors.push(`${key} should be a ${validKeys[key]}`);
    }
  }
  return errors;
}

function missingKeys(
  body: Record<string, unknown>,
  validKeys: Record<string, unknown>
) {
  // Check for missing required keys
  const errors: string[] = [];
  for (const key of Object.keys(validKeys)) {
    if (body[key] === undefined) {
      errors.push(`${key} should be a ${validKeys[key]}`);
    }
  }
  return errors;
}
function rejectInvalidKeys(
  body: Record<string, unknown>,
  validKeys: Record<string, unknown>
) {
  const errors: string[] = [];
  for (const key of Object.keys(body)) {
    if (
      !Object.prototype.hasOwnProperty.call(validKeys, key)
    ) {
      errors.push(`'${key}' is not a valid key`);
    }
  }
  return errors;
}
