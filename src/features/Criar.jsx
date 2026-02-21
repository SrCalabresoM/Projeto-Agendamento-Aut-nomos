import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useEffect, useState } from "react";
import { useAuth } from "../shared/useAuth.jsx";

function Criar() {
  const navigate = useNavigate();
  const { user, perfil } = useAuth();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarPagina() {
      if (!user) {
        navigate("/cadastro");
        return;
      }

      const { data, error } = await supabase
        .from("paginas")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.log("Erro ao verificar página:", error);
        setCarregando(false);
        return;
      }

      if (data) {
        navigate(`/a/${perfil.username}`);
      } else {
        setCarregando(false);
      }
    }

    verificarPagina();
  }, [user]);

  if (carregando) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 max-w-md leading-relaxed">
        Você ainda não tem uma página, deseja criar uma?
      </h2>

      <button
        onClick={() => navigate("/dashboard")}
        className="px-10 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 hover:-translate-y-0.5"
      >
        Criar
      </button>
    </div>
  );
}

export default Criar;
