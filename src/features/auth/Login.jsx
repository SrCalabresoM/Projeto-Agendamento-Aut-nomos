import { useState } from "react";
import useForm from "../../shared/hooks/useForm.jsx";
import { useAuth } from "../../shared/useAuth.jsx";
import { supabase } from "../../lib/supabase.js"

function Login() {
  //declaração de estados e hooks
    const { user, setUser } = useAuth();
  const { valores, onChange } = useForm({
    email: "",
    password: "",
  });

  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false);

  async function enviar() {
    //valida
    if (!validar()) {
        return;
    }

    //função do login
    let { data, error } = await supabase.auth.signInWithPassword({
      email: valores.email,
      password: valores.password
    });


    if (error) {
            console.log(error);
            return;
        }
  }

  //assegura envio
  async function fletchEnvio(e) {
    e.preventDefault();
    setLoading(true)

    try {
      await enviar()
    } catch (erro) {
      console.error(erro)
    } finally {
      setLoading(false)
    }
  }
  
  //validação
  function validar() {
  const novosErros = {};

  if (valores.password.trim() === "") {
    novosErros.password = "Senha é obrigatória";
  }
    if (!valores.email.endsWith("@gmail.com")) {
    novosErros.email = "Email inválido";
  }
  setErros(novosErros);

  return Object.keys(novosErros).length === 0;
}

  return (
  <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
    <form onSubmit={fletchEnvio} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transition-all">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
      
      <span className="block mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Email:</p>
        <input 
          name="email" 
          value={valores.email} 
          onChange={onChange} 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </span>
      {erros.email && <div className="text-red-500 text-xs mt-1 mb-2">{erros.email}</div>}

      <span className="block mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-1">Senha:</p>
        <input 
          name='password' 
          type='password' 
          value={valores.password} 
          onChange={onChange} 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </span>
      {erros.password && <div className="text-red-500 text-xs mt-1 mb-2">{erros.password}</div>}

      <button 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  </div>
);


}


export default Login;