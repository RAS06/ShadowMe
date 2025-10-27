// backend/tests/auth.test.js
import request from "supertest";
import app from "../index.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.user.deleteMany(); // clear users before running tests
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Authentication Endpoints", () => {
  const user = { email: "test@example.com", password: "securepass123" };

  test("POST /auth/signup → creates a new user", async () => {
    const res = await request(app).post("/auth/signup").send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message");
  });

  test("POST /auth/signup → rejects duplicate email", async () => {
    const res = await request(app).post("/auth/signup").send(user);
    expect(res.statusCode).toBe(400);
  });

  test("POST /auth/login → logs in with valid credentials", async () => {
    const res = await request(app).post("/auth/login").send(user);
    expect(res.statusCode).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("POST /auth/login → fails with invalid credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "wrongpass",
    });
    expect(res.statusCode).toBe(401);
  });

  test("POST /auth/logout → clears auth cookies", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.statusCode).toBe(200);
  });
});
