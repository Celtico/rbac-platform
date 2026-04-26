describe("Autenticació", () => {
  it("hauria de permetre fer login amb les credencials de l'usuari", () => {
    const username = "admin";
    const password = "adminpassword";
    // Utilitzem el comando personalitzat que acabem de crear
    cy.login(username, password);

    // Verifiquem que el login ha estat correcte
    // Segons Login.tsx, després d'un login correcte es navega a /admin
    cy.url({ timeout: 10000 }).should("include", "/admin");

    // També podríem verificar que no hi ha errors visibles
    cy.get("#login-error").should("not.exist");
  });

  it("hauria de mostrar un error amb credencials incorrectes", () => {
    cy.login("usuari_incorrecte", "contrasenya_incorrecta");

    // Verifiquem que es mostra el missatge d'error
    cy.get("#login-error", { timeout: 10000 }).should("be.visible");
    cy.url().should("include", "/login");
  });
});
