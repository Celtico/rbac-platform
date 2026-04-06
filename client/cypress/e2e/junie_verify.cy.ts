describe("IA Verification Test - Junie (Deploy System)", () => {
  const username = "celticopetit@gmail.com";
  const password = "celticopetit@gmail.comcel";
  let token: string;

  before(() => {
    // 1. Obtindre el token d'accés per a tota la suite
    cy.request({
      method: "POST",
      url: "/api/auth/login",
      body: {
        username: username,
        password: password,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      token = response.body.access_token;
    });
  });

  it("should verify current system version", () => {
    // 2. Comprovar la versió actual i el darrer commit
    cy.request({
      method: "GET",
      url: "/api/deploy/version",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("version");
      expect(response.body).to.have.property("lastCommit");
      cy.log(`Versió actual: ${response.body.version}`);
      cy.log(`Darrer commit: ${response.body.lastCommit}`);
    });
  });

  it("should trigger a full deployment and check response", () => {
    // 3. Executar el desplegament
    cy.request({
      method: "POST",
      url: "/api/deploy",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.contain("iniciat correctament");
    });
  });

  it("should check logs and find evidence of Junie's work", () => {
    // 4. Esperar un moment perquè s'escriguin els primers logs
    cy.wait(3000);

    // 5. Verificar que el log conté les millores de robustesa (album-manager vs host-project)
    cy.request({
      method: "GET",
      url: "/api/deploy/logs",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.logs).to.contain("album-manager");
      // Opcional: buscar altres paraules clau afegides pel script de Junie
      expect(response.body.logs).to.contain("Iniciant desplegament");
    });
  });
});
