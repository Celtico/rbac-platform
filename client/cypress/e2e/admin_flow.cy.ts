describe("Admin Flow and Navigation", () => {
  beforeEach(() => {
    cy.login("admin", "adminpassword");
  });

  it("should login and see the dashboard", () => {
    cy.url().should("include", "/admin");
    cy.contains("Dashboard Overview").should("be.visible");
  });

  it("should navigate through the administration menu", () => {
    // Check if Administration menu exists and is clickable
    cy.contains("Administration").should("be.visible").click();

    // Navigate to Users
    cy.contains("Users").should("be.visible").click();
    cy.url().should("include", "/admin/users");
    cy.get("h1, h2").contains("Users").should("be.visible");

    // Navigate to Roles
    cy.contains("Administration").click(); // Re-open if closed or just click
    cy.contains("Roles").should("be.visible").click();
    cy.url().should("include", "/admin/roles");
    cy.get("h1, h2").contains("Roles").should("be.visible");

    // Navigate to Permissions
    cy.contains("Administration").click();
    cy.contains("Permissions").should("be.visible").click();
    cy.url().should("include", "/admin/permissions");
    cy.get("h1, h2").contains("Permissions").should("be.visible");
  });

  it("should navigate to Albums and Settings", () => {
    // Albums
    cy.contains("Albums").click();
    cy.url().should("include", "/admin/albums");

    // Settings
    cy.contains("Settings").click();
    cy.url().should("include", "/admin/settings");
  });
});
