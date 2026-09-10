import "./style.css";

// ====== TROQUE AQUI PELO E-MAIL QUE PODE ACESSAR O PAINEL ======
// (pode colocar mais de um, separados por vírgula)
if (!EMAILS_AUTORIZADOS.includes(emailDigitado)) {
  mensagemErro.textContent = "E-mail não autorizado.";
  return;
}

const formLogin = document.querySelector<HTMLFormElement>("#formLogin")!;
const erroLogin = document.querySelector<HTMLElement>("#erroLogin")!;

formLogin.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const dados = new FormData(formLogin);
  const email = String(dados.get("email") || "").trim().toLowerCase();

  // Se já está logado, nem mostra o login — vai direto ao painel
if (sessionStorage.getItem("adminLogado")) {
  window.location.href = "admin.html";
}

  erroLogin.textContent = "";
  sessionStorage.setItem("adminLogado", email);
  window.location.href = "admin.html";
});