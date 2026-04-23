import request from "supertest";
import app from "../index.js";

describe("GET /api/health", () => {
    it("returns OK", async () => {
        const res = await request(app).get("/api/health");
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("OK");
    });
});
