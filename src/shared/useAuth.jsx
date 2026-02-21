import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";


export function AuthContextProvider({ children }) {

    //declaração de estados
    const [user, setUser] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [session, setSession] = useState(null);


    useEffect(() => {
      //função setar o usuário
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        }
      );

      return () => {
        listener.subscription.unsubscribe();
      };
    }, []);



    async function buscarPerfil(userId) {
        
      //busca a linha do usuario na tabela prossionais 
        const { data, error } = await supabase
          .from("profissionais")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) {
          console.log("ERRO AO BUSCAR PERFIL:", error);
          return null;
        }

        

        return data;
    }

    //serve para carregar o perfil de forma assíncrona
    useEffect(() => { 
      
        if (!user) {
          setPerfil(null);
          return;

        }

        let ativo = true;
        
        async function carregarPerfil() {
          const data = await buscarPerfil(user.id);
          

          if (!ativo) return;

          setPerfil(data);
        }
        

        carregarPerfil();

        return () => {
          ativo = false;
        };
      }, [user]);

    
    //para debug, não mexe
    async function debug() {
      console.log(perfil);
      console.log("SESSION:", session);
      console.log("USER:", user);
      console.log("buscarPerfil:", await buscarPerfil(user?.id));
    }
//debug();
    

    return (
        <AuthContext.Provider value={{ user, perfil, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}