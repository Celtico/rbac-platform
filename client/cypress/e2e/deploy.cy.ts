describe("Deploy Test in Production", () => {
  const username = "celticopetit@gmail.com";
  const password = "celticopetit@gmail.comcel";

  it("should perform a login and then trigger a deployment via API", () => {
    // 1. Iniciar sessió per obtenir el token d'accés (si usem cy.request)
    // O fer-ho via UI si l'endpoint de deploy fos accessible des de la UI
    // En aquest cas, l'endpoint /api/deploy és protegit per JWT i rol 'admin'

    cy.request({
      method: "POST",
      url: "/api/auth/login",
      body: {
        username: username,
        password: password,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      const token = response.body.access_token;

      // 2. Executar el desplegament usant el token d'administrador
      cy.request({
        method: "POST",
        url: "/api/deploy",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((deployResponse) => {
        expect(deployResponse.status).to.eq(201);
        expect(deployResponse.body.message).to.contain("iniciat correctament");
      });
    });
  });

  it("should verify deployment logs after triggering deploy", () => {
    cy.request({
      method: "POST",
      url: "/api/auth/login",
      body: {
        username: username,
        password: password,
      },
    }).then((response) => {
      const token = response.body.access_token;

      // Esperem una mica perquè el script comenci a escriure logs
      cy.wait(2000);

      cy.request({
        method: "GET",
        url: "/api/deploy/logs",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((logsResponse) => {
        expect(logsResponse.status).to.eq(200);
        expect(logsResponse.body).to.have.property("logs");
      });
    });
  });
});
