describe("Albums Management", () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit("/login");
    cy.get("#username").type("admin");
    cy.get("#password").type("adminpassword");
    cy.get("#login-button").click();
    cy.url().should("not.include", "/login");
    cy.contains("Albums", { timeout: 10000 }).click();
  });

  it("should list albums", () => {
    cy.get("h1").should("contain", "Albums");
    cy.get("#albums-grid").should("exist");
  });

  it("should create a new album", () => {
    const albumTitle = "New Test Album " + Date.now();
    const artistName = "Test Artist";

    cy.get("#add-album-button").click();
    cy.url().should("include", "/admin/albums/new");

    cy.get("#album-title").type(albumTitle);
    cy.get("#album-artist").type(artistName);
    cy.get("#album-year").clear().type("2024");
    // cy.get("#album-cover").type("https://via.placeholder.com/150"); // Opcional si el componente lo permite

    cy.get("button").contains("Create Album").click();

    cy.url().should("include", "/admin/albums");
    cy.get("#albums-grid").should("contain", albumTitle);
    cy.get("#albums-grid").should("contain", artistName);
  });

  it("should edit an existing album", () => {
    const updatedTitle = "Updated Album Title " + Date.now();

    // Check if there is at least one album, if not create one
    cy.get("body").then(($body) => {
      if ($body.find("[data-testid^=album-card-]").length === 0) {
        cy.get("#add-album-button").click();
        cy.get("#album-title").type("Temp Album");
        cy.get("#album-artist").type("Temp Artist");
        cy.get("button").contains("Create Album").click();
      }
    });

    cy.get("[data-testid^=album-card-]")
      .first()
      .within(() => {
        cy.get('[aria-label="Edit Album"]').click();
      });

    cy.url().should("match", /\/admin\/albums\/edit\/\d+/);
    cy.get("#album-title").clear().type(updatedTitle);
    cy.get("button").contains("Update Album").click();

    cy.url().should("include", "/admin/albums");
    cy.get("#albums-grid").should("contain", updatedTitle);
  });

  it("should delete an album", () => {
    // Create an album to delete to ensure one exists
    const deleteTitle = "Album to Delete " + Date.now();
    cy.get("#add-album-button").click();
    cy.get("#album-title").type(deleteTitle);
    cy.get("#album-artist").type("Delete Artist");
    cy.get("button").contains("Create Album").click();

    cy.get("#albums-grid").should("contain", deleteTitle);

    // Find the card with the specific title and delete it
    cy.contains("[data-testid^=album-card-]", deleteTitle).within(() => {
      cy.get('[aria-label="Delete Album"]').click();
    });

    // Handle confirmation dialog
    cy.on("window:confirm", () => true);

    cy.get("#albums-grid").should("not.contain", deleteTitle);
  });
});
