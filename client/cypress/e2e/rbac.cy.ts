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
