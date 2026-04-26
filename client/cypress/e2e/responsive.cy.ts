describe("Responsive Design", () => {
  const viewports = [
    { name: "iphone-x", width: 375, height: 812 },
    { name: "ipad-2", width: 768, height: 1024 },
    { name: "macbook-13", width: 1280, height: 800 },
  ];

  const login = () => {
    cy.visit("/login");
    // Usamos las credenciales que parecen ser estándar en este proyecto según otros tests
    cy.get("#username").type("admin");
    cy.get("#password").type("adminpassword");
    cy.get("#login-button").click();
    cy.url().should("include", "/admin");
  };

  viewports.forEach((viewport) => {
    context(
      `Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`,
      () => {
        beforeEach(() => {
          cy.viewport(viewport.width, viewport.height);
        });

        it("should have a responsive layout in Dashboard", () => {
          login();
          cy.visit("/admin");

          if (viewport.width < 768) {
            // El sidebar debería estar oculto y el menú hamburguesa visible
            cy.get("aside").should("not.be.visible");
            cy.get('button[aria-label="Menu"]').should("be.visible");
          } else {
            // El sidebar debería estar visible
            cy.get("aside").should("be.visible");
          }
        });

        it("should show albums grid correctly", () => {
          login();
          cy.visit("/admin/albums");

          cy.get("#albums-grid").should("be.visible");

          // Verificar que el grid existe.
          // Chakra UI Grid suele usar display: grid.
          cy.get("#albums-grid").should("have.css", "display", "grid");
        });

        it("should handle tables with horizontal scroll if needed", () => {
          login();
          cy.visit("/admin/users");

          // Buscar el contenedor de la tabla
          cy.get("table")
            .parent()
            .should(($el) => {
              const overflowX = $el.css("overflow-x");
              expect(overflowX).to.be.oneOf(["auto", "scroll"]);
            });
        });

        it("should show public albums grid", () => {
          cy.visit("/");
          // Primero esperar a que desaparezca el spinner si existe
          cy.get("body").then(($body) => {
            if ($body.find(".chakra-spinner").length > 0) {
              cy.get(".chakra-spinner", { timeout: 10000 }).should("not.exist");
            }
          });

          // Verificamos que cargue algo (grid o mensaje)
          cy.get(".chakra-container").should("be.visible");
        });
      }
    );
  });
});
