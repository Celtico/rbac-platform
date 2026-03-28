describe("RBAC App Tests", () => {
  beforeEach(() => {
    cy.on("window:before:load", (win) => {
      cy.stub(win.console, "log").as("consoleLog");
      cy.stub(win.console, "error").as("consoleError");
    });
    cy.visit("/login");
  });

  it("hauria de veure el root element i el formulari de login", () => {
    cy.get("#root", { timeout: 30000 }).should("exist");

    // Esperar que el formulari aparegui
    cy.get("#login-page", { timeout: 30000 }).should("be.visible");
    cy.get("#username").should("be.visible");
    cy.get("#password").should("be.visible");
    cy.get("#login-button").should("be.visible");
  });

  it("hauria de permetre el login com a admin", () => {
    cy.get("#username", { timeout: 30000 }).type("admin");
    cy.get("#password").type("adminpassword");
    cy.get("#login-button").click();
    cy.contains("Welcome, admin", { timeout: 30000 }).should("be.visible");
  });

  it("hauria de permetre el login com a usuari normal", () => {
    cy.get("#username", { timeout: 30000 }).type("user");
    cy.get("#password").type("userpassword");
    cy.get("#login-button").click();
    cy.contains("Welcome, user", { timeout: 30000 }).should("be.visible");
  });

  it("hauria de mostrar un error amb credencials incorrectes", () => {
    cy.get("#username", { timeout: 30000 }).type("admin");
    cy.get("#password").type("wrongpassword");
    cy.get("#login-button").click();
    cy.get("#login-error", { timeout: 30000 }).should("be.visible");
  });

  it("hauria de permetre navegar a Albums i veure la llista (buida inicialment)", () => {
    cy.get("#username", { timeout: 30000 }).type("admin");
    cy.get("#password").type("adminpassword");
    cy.get("#login-button").click();

    cy.contains("Albums", { timeout: 30000 }).click();
    cy.url().should("include", "/admin/albums");
    cy.contains("Albums", { timeout: 30000 }).should("be.visible");
    cy.get("h1").contains("Albums").should("be.visible");
  });
});
