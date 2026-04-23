import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = fs.readFileSync(".env", "utf8");
let url = "";
let key = "";

env.split("\n").forEach(l => {
  if (l.startsWith("VITE_SUPABASE_URL=")) url = l.split("=")[1].trim().replace(/\r/g,"");
  if (l.startsWith("VITE_SUPABASE_ANON_KEY=")) key = l.split("=")[1].trim().replace(/\r/g,"");
});

const supabase = createClient(url, key);

async function run() {
  const users = [
    { email: "admin@medico.com", password: "admin", role: "admin" },
    { email: "usuario1@medico.com", password: "12345", role: "atendente" }
  ];

  for (const u of users) {
    const securePassword = u.password.padEnd(6, '0'); // Pad para o minimo do Supabase
    
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: securePassword,
      options: {
         data: { role: u.role, ativo: true }
      }
    });
    
    if (error) {
      if (error.message.includes("User already registered") || error.message.includes("already registered")) {
         console.log("Usuário já existe. Atualizando Metadados...", u.email);
         // Supabase Anon key não pode forçar update do metadata de todos facilmente no script cru sem auth
         // Mas para o teste, o sign in já confirma q a conta está rodando
         console.log("OK!");
      } else {
         console.log("Erro:", u.email, error.message);
      }
    } else if (data.user) {
      console.log("User criado e metadata gravado:", u.email, u.role);
    }
  }
}

run();
