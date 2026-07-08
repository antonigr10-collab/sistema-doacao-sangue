describe('Fluxo de cadastro de doador', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/servicodados.ibge.gov.br/api/v1/localidades/estados*', {
      body: [{ sigla: 'SC', nome: 'Santa Catarina' }],
    }).as('getEstados');

    cy.intercept('GET', '**/servicodados.ibge.gov.br/api/v1/localidades/estados/SC/municipios*', {
      body: [{ nome: 'Florianópolis' }],
    }).as('getCidades');

    cy.intercept('POST', '**/rest/v1/doadores**', {
      statusCode: 201,
      body: [{ id: 'doa_test', nome: 'Ana Teste', tipoSanguineo: 'O+' }],
    }).as('postDoador');
  });

  it('realiza o cadastro completo a partir da página cadastro.html', () => {
    cy.visit('/cadastro.html');

    cy.contains('h2', 'Triagem Prévia de Aptidão').should('be.visible');

    cy.get('input[name="q1"][value="sim"]').check({ force: true });
    cy.get('input[name="q2"][value="sim"]').check({ force: true });
    cy.get('input[name="q3"][value="sim"]').check({ force: true });
    cy.contains('button', 'Verificar Aptidão').click();

    cy.get('#container-cadastro-real').should('be.visible');

    cy.get('#nome').type('Ana Teste');
    cy.get('#tipoSanguineo').select('O+');
    cy.get('#telefone').type('49999990000');
    cy.get('#email').type('ana.teste@example.com');
    cy.get('#senha').type('123456');
    cy.get('#estado').select('SC');
    cy.wait('@getCidades');
    cy.get('#cidade').select('Florianópolis');
    cy.get('#termo-lgpd').check({ force: true });

    cy.contains('button', 'Finalizar Meu Cadastro').click();
    cy.wait('@postDoador');

    cy.contains('Cadastro efetuado com sucesso').should('be.visible');
  });
});
