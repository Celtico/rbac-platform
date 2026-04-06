describe("IA Verification Test - Junie (Deploy System)", () => {
  const username = "celticopetit@gmail.com";
  const password = "celticopetit@gmail.comcel";
  let token: string;

  before(() => {
    // 1. Obtindre el token d'accés per a tota la suite amb reintent en cas de 502
    cy.request({
      method: "POST",
      url: "/api/auth/login",
      body: {
        username: username,
        password: password,
      },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 502 || response.status === 503) {
        cy.wait(10000);
        cy.request({
          method: "POST",
          url: "/api/auth/login",
          body: {
            username: username,
            password: password,
          },
        }).then((retryResponse) => {
          token = retryResponse.body.access_token;
        });
      } else {
        expect(response.status).to.eq(201);
        token = response.body.access_token;
      }
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
    // Augmentem l'espera ja que el desplegament triga un moment a iniciar-se
    // i el servidor pot estar reiniciant-se.
    cy.wait(10000);

    // 5. Verificar que el log conté les millores de robustesa (album-manager vs host-project)
    cy.request({
      method: "GET",
      url: "/api/deploy/logs",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Si encara dóna 502, esperem una mica més i tornem a provar (Cypress ho fa si usem un timeout alt i una asseveració)
      if (response.status === 502 || response.status === 503) {
        cy.wait(5000);
        cy.request({
          method: "GET",
          url: "/api/deploy/logs",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((retryResponse) => {
          expect(retryResponse.status).to.eq(200);
          expect(retryResponse.body.logs).to.contain("album-manager");
          expect(retryResponse.body.logs).to.contain("Iniciant desplegament");
        });
      } else {
        expect(response.status).to.eq(200);
        expect(response.body.logs).to.contain("album-manager");
        expect(response.body.logs).to.contain("Iniciant desplegament");
      }
    });
  });
});
