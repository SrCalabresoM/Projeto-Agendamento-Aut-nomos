import { useAuth } from "../../shared/useAuth.jsx";
import { supabase } from "../../lib/supabase.js"
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Perfil() {
  const { user, perfil } = useAuth();
  const navigate = useNavigate();

    //função do logout
    async function logOut() {
        let { error } = await supabase.auth.signOut()
        if (error) {
            console.log(error);
        }
        navigate("/cadastro") //redireciona para cadastro após logout
    }
    useEffect(() => {
        if (!user) {
            navigate("/cadastro"); //também redireciona para cadastro se não tiver logado
        }
    }, [user]);

    return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
        Você está logado como <span className="text-blue-600">{perfil?.nome}</span>. Deseja sair?
      </h2>
      <button 
        onClick={logOut} 
        className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-md transition-all active:scale-95"
      >
        Sair
      </button>
    </div>
  );

}

export default Perfil;