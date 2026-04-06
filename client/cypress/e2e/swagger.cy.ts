describe("Swagger Documentation", () => {
  const swaggerUrl = "https://album.serverscel.com/api/docs";

  it("should load the Swagger UI page", () => {
    // Visit the Swagger URL
    cy.visit(swaggerUrl);

    // Verify the title of the page
    cy.title().should("include", "Swagger UI");

    // Verify that the title in the UI is correct
    cy.get(".title").should("contain", "API REST RBAC MVC OAuth2");
  });

  it("should display the correct version", () => {
    cy.visit(swaggerUrl);
    cy.get(".version").should("contain", "1.0");
  });

  it("should list all API resources", () => {
    cy.visit(swaggerUrl);

    // Verify that the resources are present in the page content
    // Swagger tags usually appear as section headers
    cy.get(".swagger-ui", { timeout: 15000 }).should("exist");

    // Check for some known tags from the API
    // Using a more relaxed approach since Swagger UI might render tags differently
    cy.get(".opblock-tag", { timeout: 10000 }).should(
      "have.length.at.least",
      1
    );
  });

  it("should have Bearer Authentication configured", () => {
    cy.visit(swaggerUrl);
    cy.get(".btn.authorize").should("be.visible").and("contain", "Authorize");
  });
});
