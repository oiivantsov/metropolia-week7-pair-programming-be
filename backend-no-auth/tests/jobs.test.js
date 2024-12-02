const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const Job = require("../models/jobModel");

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

describe("Job controller", () => {
    beforeEach(async () => {
        await Job.deleteMany({});
        await Job.insertMany(jobs);
    });

    afterAll(() => {
        mongoose.connection.close();
    });

    it("should return all jobs as JSON when GET /api/jobs is called", async () => {
        const response = await api
            .get("/api/jobs")
            .expect(200)
            .expect("Content-Type", /application\/json/);

        expect(response.body).toHaveLength(jobs.length);
    });

    it("should create a new job when POST /api/jobs is called", async () => {
        const newJob = {
            title: "ThirdJob",
            type: "PartTime",
            description: "Work here",
            company: {
                name: "Company",
                contactEmail: "company@company.com",
                contactPhone: "+12121221"
            }
        }

        await api
            .post("/api/jobs")
            .send(newJob)
            .expect(201)
            .expect("Content-Type", /application\/json/)

        const jobsAfterPost = await Job.find({});
        expect(jobsAfterPost).toHaveLength(jobs.length + 1);
        const jobNames = jobsAfterPost.map(job => job.title);
        expect(jobNames).toContain(newJob.title);
    });

    it("should return one job by ID when GET /api/jobs/:id is called", async () => {
        const job = await Job.findOne();
        await api
            .get(`/api/jobs/${job._id}`)
            .expect(200)
            .expect("Content-Type", /application\/json/);
    });

    it("should return 404 for a non-existing job ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        await api.get(`/api/jobs/${nonExistentId}`).expect(404);
    });

    it("should update one job with partial data when PUT /api/job/:id is called", async () => {
        const job = await Job.findOne();
        const updatedJob = {
            title: "Better job",
            type: "New type"
        };

        await api
            .put(`/api/jobs/${job._id}`)
            .send(updatedJob)
            .expect(200)
            .expect("Content-Type", /application\/json/);

        const updatedJobCheck = await Job.findById(job._id);
        expect(updatedJobCheck.title).toBe(updatedJob.title);
        expect(updatedJobCheck.type).toBe(updatedJob.type);
    });

    it("should return 400 for invalid job ID when PUT /api/jobs/:id", async () => {
        const invalidId = "12345";
        await api.put(`/api/jobs/${invalidId}`).send({}).expect(400);
    });

    it("should delete one job by ID when DELETE /api/jobs/:id is called", async () => {
        const job = await Job.findOne();
        await api.delete(`/api/jobs/${job._id}`).expect(204);

        const deletedJobCheck = await Job.findById(job._id);
        expect(deletedJobCheck).toBeNull();
    });

    it("should return 400 for invalid job ID when DELETE /api/jobs/:id", async () => {
        const invalidId = "12345";
        await api.delete(`/api/jobs/${invalidId}`).expect(400);
    });
});
