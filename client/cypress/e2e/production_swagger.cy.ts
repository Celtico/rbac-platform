describe("Producció: Swagger Documentation", () => {
  const swaggerUrl = "https://album.serverscel.com/api/docs";

  it("hauria de carregar la Swagger UI a producció", () => {
    // Visitem la URL de Swagger
    cy.visit(swaggerUrl);

    // Verifiquem el títol de la pàgina
    cy.title().should("include", "Swagger UI");

    // Verifiquem que el títol de la UI sigui correcte
    // Segons swagger.cy.ts l'element té la classe .title
    cy.get(".title", { timeout: 15000 }).should(
      "contain",
      "API REST RBAC MVC OAuth2"
    );
  });

  it("hauria de mostrar la versió 1.0", () => {
    cy.visit(swaggerUrl);
    cy.get(".version", { timeout: 10000 }).should("contain", "1.0");
  });

  it("hauria d'aparèixer el botó 'Authorize'", () => {
    cy.visit(swaggerUrl);
    cy.get(".btn.authorize", { timeout: 10000 })
      .should("be.visible")
      .and("contain", "Authorize");
  });

  it("hauria de mostrar les seccions principals (tags)", () => {
    cy.visit(swaggerUrl);

    // Verifiquem que algunes etiquetes conegudes com 'roles', 'users' o 'deploy' apareguin
    cy.get(".opblock-tag", { timeout: 15000 }).should(
      "have.length.at.least",
      1
    );

    // Verifiquem l'existència de seccions específiques
    cy.contains(".opblock-tag", "roles").should("exist");
    cy.contains(".opblock-tag", "deploy").should("exist");
    cy.contains(".opblock-tag", "albums").should("exist");
  });
});
