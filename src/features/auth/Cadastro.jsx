import { useState } from "react";
import useForm from "../../shared/hooks/useForm.jsx";
import { useAuth } from "../../shared/useAuth.jsx";
import { supabase } from "../../lib/supabase.js"
import { Link } from "react-router-dom";

function Cadastro() {
  //declaração de estados e hooks
    const { user, setUser } = useAuth();
  const { valores, onChange } = useForm({ 
    nome: "",
    email: "",
    username: "",
    password: "",
    password2: ""
  });

  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false);

  async function enviar() {
    //valida 
    if (!validar()) {
        return;
    }

    //função do signup
    let { data, error } = await supabase.auth.signUp({
      email: valores.email,
      password: valores.password
    });

    if (error) {
      console.log(error);
      return;
    }

    const user = data.user;
    
    //conecta o signup com a tabela profissionais
    const { error: insertError } = await supabase
      .from("profissionais")
      .insert([
        {
          user_id: user.id,
          nome: valores.nome,
          username: valores.username.toLowerCase()
        }
      ]);

    if (insertError) {
      console.log(insertError);
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

  //vai validar os campos no enviar
  function validar() {
  const novosErros = {};

  if (valores.nome.trim() === "") {
    novosErros.nome = "Nome é obrigatório";
  }
  if (valores.password !== valores.password2) {
    novosErros.password = "As senhas não coincidem";
  }
  setErros(novosErros);

  return Object.keys(novosErros).length === 0;
}

  return (
  <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
    <form onSubmit={fletchEnvio} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transition-all">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Criar Conta</h2>
      
      <span className="block mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Nome:</p>
        <input name="nome" value={valores.nome} onChange={onChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
      </span>
      {erros.nome && <div className="text-red-500 text-xs mt-1 mb-2">{erros.nome}</div>}

      <span className="block mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Username:</p>
        <input name="username" value={valores.username} onChange={onChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
      </span>

      <span className="block mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Email:</p>
        <input name="email" value={valores.email} onChange={onChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
      </span>
      {erros.email && <div className="text-red-500 text-xs mt-1 mb-2">{erros.email}</div>}

      <span className="block mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Senha:</p>
        <input name='password' type='password' value={valores.password} onChange={onChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
      </span>

      <span className="block mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-1">Repita a senha:</p>
        <input name='password2' type='password' value={valores.password2} onChange={onChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
      </span>
      {erros.password && <div className="text-red-500 text-xs mt-1 mb-2">{erros.password}</div>}

      <button 
        disabled={loading} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>

    <div className="mt-6 text-gray-600 text-center">
      Não tem uma conta? <Link to="/login" className="text-blue-600 hover:underline font-medium">Fazer login</Link>
    </div>
  </div>
);


}


export default Cadastro;