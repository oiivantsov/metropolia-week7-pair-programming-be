const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app"); // Your Express app
const api = supertest(app);
const Job = require("../models/jobModel");
const User = require("../models/userModel");

const jobs = [
    {
        title: "JobTitle",
        type: "Internship",
        description: "Very good internship opportunity",
        company: {
            name: "Good company",
            contactEmail: "good@company.com",
            contactPhone: "12345678"
        }
    },
    {
        title: "AnotherJob",
        type: "FullTime",
        description: "Do not work here",
        company: {
            name: "Bad Company",
            contactEmail: "bad@company.com",
            contactPhone: "87654321"
        }
    }
];

let token = null;

beforeAll(async () => {
    await User.deleteMany({});
    const result = await api.post("/api/users/signup").send({
        name: "Bob Doe",
        email: "bob@mail.com",
        password: "R3g5T7#gh",
        phone_number: "1234567890",
        gender: "Male",
        date_of_birth: "1990-01-01",
        membership_status: "Inactive",
    });
    token = result.body.token;
});

describe("Given there are initially some jobs saved", () => {
    beforeEach(async () => {
        await Job.deleteMany({});
        await Promise.all([
            api
                .post("/api/jobs")
                .set("Authorization", "bearer " + token)
                .send(jobs[0]),
            api
                .post("/api/jobs")
                .set("Authorization", "bearer " + token)
                .send(jobs[1]),
        ]);
    });

    it("should return all jobs as JSON when GET /api/jobs is called", async () => {
        await api
            .get("/api/jobs")
            .set("Authorization", "bearer " + token)
            .expect(200)
            .expect("Content-Type", /application\/json/);
    });

    it("should create one job when POST /api/jobs is called", async () => {
        const newJob = {
            title: "NewJob",
            type: "PartTime",
            description: "New job opportunity",
            company: {
                name: "New Company",
                contactEmail: "good@mail.com",
                contactPhone: "12345678"
            }
        };
        await api
            .post("/api/jobs")
            .set("Authorization", "bearer " + token)
            .send(newJob)
            .expect(201);

    });

    it("should return one job by ID when GET /api/jobs/:id is called", async () => {
        const job = await Job.findOne();
        await api
            .get("/api/jobs/" + job._id)
            .set("Authorization", "bearer " + token)
            .expect(200)
            .expect("Content-Type", /application\/json/);
    });

    it("should update one job by ID when PUT /api/jobs/:id is called", async () => {
        const job = await Job.findOne();
        const updatedJob = {
            description: "Updated job information.",
            company: {
                name: "Updated Company"
            }
        };

        await api
            .put(`/api/jobs/${job._id}`)
            .set("Authorization", "bearer " + token)
            .send(updatedJob)
            .expect(200)
            .expect("Content-Type", /application\/json/);

        const updatedJobCheck = await Job.findById(job._id);

        expect(updatedJobCheck.description).toBe(updatedJob.description);
        expect(updatedJobCheck.company.name).toBe(updatedJob.company.name);
    });

    it("should delete one job by ID when DELETE /api/jobs/:id is called", async () => {
        const job = await Job.findOne();
        await api
            .delete(`/api/jobs/${job._id}`)
            .set("Authorization", "bearer " + token)
            .expect(204);

        const jobCheck = await Job.findById(job._id);
        expect(jobCheck).toBe(null);
    });
});

afterAll(() => {
    mongoose.connection.close();
});