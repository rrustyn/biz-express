"use strict";

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");


let testCompany;

beforeEach(async function () {
  await db.query(`DELETE FROM companies`);
  let results = await db.query(`
  INSERT INTO companies (code, name, description)
  VALUES ('apple', 'Apple', 'An apple company')
  RETURNING code, name, description`);
  testCompany = results.rows[0]
});

afterAll(async function () {
  await db.end();
})

describe("GET /companies", function () {
  test("Gets list of companies", async function() {
    const res = await request(app).get(`/companies`);
    expect(res.body).toEqual({
      companies: [{
        code: testCompany.code,
        name: testCompany.name}]})
  })
});

describe("GET /companies/:code", function () {
  test("Get a single company", async function() {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.body).toEqual(
      {company: {
        code : testCompany.code,
        name : testCompany.name,
        description: testCompany.description,
        invoices: []
      }}
    );
  });

  test("Get a single company with invalid code", async function() {
    const res = await request(app).get(`/companies/hello`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(
      {	"error": {
        "message": "Not Found",
        "status": 404
      }}
    );
  });
});

describe("POST /companies", function () {
  test("Create a new company", async function() {
    const res = await request(app).post(`/companies`)
      .send({ code: 'orng', name: "Orange", description: "An orange company"});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(
      {company: {
        code : 'orng',
        name : 'Orange',
        description: 'An orange company'
      }}
    );
  });

  test("POST with duplicate code", async function() {
    const res = await request(app).post(`/companies`)
      .send({ code: 'apple', name: "Orange", description: "An orange company"});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      {	"error": {
        "message": "Bad Request",
        "status": 400
      }}
    );
  });
});

describe("PUT /companies/:code", function () {
  test("Updates a company", async function() {
    const res = await request(app).put(`/companies/${testCompany.code}`)
      .send({ name: "Orange", description: "An orange company"});
    expect(res.body).toEqual(
      {company: {
        code : 'apple',
        name : 'Orange',
        description: 'An orange company'
      }}
    );
  });

  test("Update company with invalid code", async function() {
    const res = await request(app).put(`/companies/hello`)
      .send({ name: "Orange", description: "An orange company"});
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(
      {	"error": {
        "message": "Not Found",
        "status": 404
      }}
    );
  });
});

describe("DELETE /companies/:code", function () {
  test("Deletes a company", async function() {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.body).toEqual(
      {status: 'Deleted'}
    );
  });

  test("Delete company with invalid code", async function() {
    const res = await request(app).delete(`/companies/hello`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(
      {	"error": {
        "message": "Not Found",
        "status": 404
      }}
    );
  });
});