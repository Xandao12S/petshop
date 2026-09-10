import "./style.css";

const botaoMensagem = document.querySelector<HTMLButtonElement>("#botaoMensagem")!;
const modal = document.querySelector<HTMLDivElement>("#modalAgendamento")!;
const fecharModal = document.querySelector<HTMLButtonElement>("#fecharModal")!;
const formAgendamento = document.querySelector<HTMLFormElement>("#formAgendamento")!;
const camposPorte = document.querySelector<HTMLSelectElement>("#porte")!;
const campoValor = document.querySelector<HTMLInputElement>("#valor")!;
const campoHorario = document.querySelector<HTMLInputElement>("#horário")!;

// Número do WhatsApp que vai receber a mensagem (com código do país e DDD, sem espaços ou símbolos)
const numeroWhatsapp = "5511976349686";

// Tabela de preços por porte do animal
const precos: Record<string, number> = {
  pequeno: 50,
  medio: 70,
  grande: 100,
};

// Atualiza o valor automaticamente quando o porte é selecionado
camposPorte.addEventListener("change", () => {
  const precoSelecionado = precos[camposPorte.value];

  campoValor.value = precoSelecionado
    ? precoSelecionado.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : "";
});

// Abrir modal
botaoMensagem.addEventListener("click", () => {
  modal.classList.add("aberto");
});

// Fechar modal pelo botão "X"
fecharModal.addEventListener("click", () => {
  modal.classList.remove("aberto");
});

// Fechar modal clicando fora dele
modal.addEventListener("click", (evento) => {
  if (evento.target === modal) {
    modal.classList.remove("aberto");
  }
});

// Envio do formulário via WhatsApp
formAgendamento.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const dados = new FormData(formAgendamento);

  const agendamentosSalvos = JSON.parse(
    localStorage.getItem("agendamentos") || "[]"
  );

  const horarioAtual = new Date().toLocaleString("pt-BR");

  agendamentosSalvos.push({
    dono: dados.get("Dono(a)"),
    endereco: dados.get("endereco"),
    porte: dados.get("porte"),
    raca: dados.get("raca"),
    valor: dados.get("valor"),
    horario: horarioAtual,
    horarioISO: "",
  });

  localStorage.setItem(
    "agendamentos",
    JSON.stringify(agendamentosSalvos)
  );

  const mensagem =
    `Olá! Gostaria de agendar um horário:\n\n` +
    `*Dono(a):* ${dados.get("Dono(a)")}\n` +
    `*Endereço:* ${dados.get("endereco")}\n` +
    `*Porte:* ${dados.get("porte")}\n` +
    `*Raça:* ${dados.get("raca")}\n` +
    `*Valor:* ${dados.get("valor")}\n` +
    `*Horário:* ${horarioAtual}`;

  const link = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(
    mensagem
  )}`;

  window.open(link, "_blank");

  formAgendamento.reset();
  campoValor.value = "";
  modal.classList.remove("aberto");
});