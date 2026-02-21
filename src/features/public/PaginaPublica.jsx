import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { useState, useEffect } from "react";

function PaginaPublica() {
  const { username } = useParams();
  const [profissional, setProfissional] = useState(null);

  useEffect(() => {
    if (!username) return;

    async function buscarPágina(usernam) {
      const { data, error } = await supabase
        .from("profissionais")
        .select("*")
        .eq("username", usernam)
        .maybeSingle();

      if (error) {
        console.log("Erro usuário não existe:", error);
        setProfissional(null);
        return null;
      }

      setProfissional(data);
      return data;
    }

    buscarPágina(username);
  }, [username]);
  
  console.log(username);
  console.log(profissional);

  if (!profissional) {
  return <p>A página que você busca não existe</p>;
}

return (
  <>
    <h1>Bem-vindo à página de {profissional.nome}!</h1>
    <p>Username: {profissional.username}</p>
  </>
);

}

export default PaginaPublica;
