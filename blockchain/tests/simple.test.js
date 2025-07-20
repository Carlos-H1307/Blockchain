const { expect } = require("chai");

describe("Verificação do Ambiente de Teste", function () {
  it("Deve ser capaz de executar uma afirmação simples", function () {
    console.log("-> O teste simples está rodando!");
    expect(1 + 1).to.equal(2);
  });
});