import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBr from "@fullcalendar/core/locales/pt-br";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "react-router-dom";
import { useAuth } from "../../shared/useAuth";

function Calendario() {

  const { username } = useParams();
  const { user, perfil } = useAuth();
  const [profissionalId, setProfissionalId] = useState(null);
  const [eventos, setEventos] = useState([]);
  const calendarRef = useRef(null); 
  const [menu, setMenu] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:15");
  const [selectedDate, setSelectedDate] = useState(null);
  const [clickEvent, setClickEvent] = useState("stranger");
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState(null);
  const [title, setTitle] = useState("")
  const startRef = useRef();
  const endRef = useRef();
  const isOwner = perfil?.username == username
 

//atualiza sempre qual é o id do profissional
  useEffect(() => {
    if (!username) return;

    async function buscarIdProfissional(usernam) {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id")
        .eq("username", usernam)
        .maybeSingle();

      if (error) {
        console.log("Erro usuário não existe:", error);
        setProfissionalId(null);
        return null;
      }

      setProfissionalId(data.id);
      return data;
    }

    buscarIdProfissional(username);
  }, [username]);
  
  
  //usa o id do profissional para puxar os eventos dele
    useEffect(() => {
    if (!profissionalId || !perfil) return; //se perfil ou profissinalId fore null a brincadeira acaba aqui

    async function carregarEventos() { //função para carregar do banco
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("profissional_id", profissionalId);

      if (error) {
        console.log("Erro ao carregar eventos:", error);
        return;
      }

      const eventosFormatados = data.map((evento) => 
        {
          let cor = "";
          if (isOwner) {
            cor = evento.status == "pendente" ? "#f97316" : "#22c55e";
          } else {
            if (evento.client_id == user?.id) {
              cor = evento.status == "pendente" ? "#eab308" : "#22c55e";
            } else {
              cor = "#9ca3af"
            }
          }
          return {
            id: evento.id,
            title: evento.title,
            start: evento.start_time,
            end: evento.end_time,
            backgroundColor: cor,
            borderColor: "#000000",
            textColor: "#000000",
            extendedProps: {
              client_id: evento.client_id,
              status: evento.status
            }
          }
        });

      setEventos(eventosFormatados);
    }

    carregarEventos(); //funciona sempre que profssionalId mudar

    const canal = supabase
      .channel('monitor-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          if (payload.new?.profissional_id == profissionalId || payload.old?.profissional_id == profissionalId) {
            carregarEventos(); //RealTime, funciona a partir de mudanças na tabela
          }
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.log('Realtime status:', status)
        }
      })

    return () => {
      if (canal) {
        supabase.removeChannel(canal)
      }
    }

  }, [profissionalId, isOwner]);


  async function inserirEvento(titlee, start, end) { //inserir eventos no banco
    const { error: insertError } = await supabase.from("events").insert([
      {
        title: titlee,
        start_time: start,
        end_time: end,
        profissional_id: profissionalId,
        client_id: user?.id,
        status: "pendente" //inicializa sempre assim
      }
    ]);
    if (insertError) {
      console.log(insertError);
      return;
    }
  }

  async function updateEvento(titlee, start, end) { 
    const { error: updateError } = await supabase.from("events").update(
      {
        title: titlee,
        start_time: start,
        end_time: end,
      }
    ).eq("id", eventoSelecionadoId)
    if (updateError) {
      console.log(updateError);
      return;
    }
  }

    async function setStatus(status) { 
    const { error: updateError } = await supabase.from("events").update(
      {
        status: status
      }
    ).eq("id", eventoSelecionadoId)
    if (updateError) {
      console.log(updateError);
      return;
    }
  }

  async function deleteEvento() {
    const { error: deleteError } = await supabase.from("events").delete().eq("id", eventoSelecionadoId)
    if (deleteError) {
      console.log(deleteError);
      return;
    }
    setMenuFalse()
  }

  function setMenuFalse() { //substitui o setMenu(false) com vários resets necessários
    setMenu(false)
    setClickEvent("stranger")
    setEventoSelecionadoId(null)
    setSelectedDate(null)
    setTitle("")
  }

  function somarMinutos(hora, duracao) { //função pronta que recebe o horario inicial e a duração e retorna o horário final
    const [h, m] = hora.split(":").map(Number);
    const [, minutos] = duracao.split(":").map(Number);

    const totalMinutos = h * 60 + m + minutos;

    const novaHora = Math.floor(totalMinutos / 60) % 24;
    const novoMinuto = totalMinutos % 60;

    return `${String(novaHora).padStart(2, "0")}:${String(novoMinuto).padStart(2, "0")}`;
  }

  function combinarDataHora(data, hora) { //formatar em Date()
    const novaData = new Date(data);
    const [h, m] = hora.split(":").map(Number);

    novaData.setHours(h);
    novaData.setMinutes(m);
    novaData.setSeconds(0);

    return novaData;
  }

  useEffect(() => { //a tecla esc vai fechar o menu se ele tiver aberto
    function fecharComEsc(e) {
      if (e.key === "Escape") {
        setMenuFalse();
      }
    }

    if (menu) {
      window.addEventListener("keydown", fecharComEsc);
    }

    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [menu]);


  return (
    <div className="w-full max-w-6xl mx-auto mt-10 px-4">
      <FullCalendar
        ref={calendarRef} 

        slotDuration="00:15:00" // 15 minutos

        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"

        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}

        locale={ptBr}
        allDaySlot={false}
        selectable={true}

        events={eventos}

        
        dateClick={(info) => {
          const calendarApi = calendarRef.current.getApi();

          if (calendarApi.view.type !== "timeGridDay") {
            calendarApi.changeView("timeGridDay", info.date);
          } else {
            if (!user) {
              window.location.href = "/login";
              return;
            }
            const start = info.dateStr.slice(11, 16);
            setStartTime(start);
            setEndTime(somarMinutos(start, "00:15:00")); // 15 minutos
            setSelectedDate(info.date);
            setTitle("Servição top")
            setMenu(true);
          }
        }}

        eventClick={(info) => {
          //define os status do eventClick
          if (isOwner) {
            setClickEvent(info.event.extendedProps.status == "pendente" ? "ownerpend" : "ownerconf");
            setMenu(true);
          } else if (info.event.extendedProps.client_id == user?.id && info.event.extendedProps.status == "pendente") {
            setClickEvent(info.event.extendedProps.status == "pendente" ? "clientpend" : "clientconf");
            setMenu(true);
          }
          setTitle(info.event.title)
          setEventoSelecionadoId(info.event.id)
          setSelectedDate(info.event.start)
        }}

        selectAllow={(selectInfo) => {
          const agora = new Date();
          return selectInfo.start > agora;
        }}
      />

      {/*menu*/}
      <div style={{ display: menu ? "flex" : "none" }} className="fixed inset-0 z-50 flex items-center justify-center">

        {/* overlay escuro */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200" onClick={() => {setMenuFalse()}}></div>

        <div className="relative bg-white p-6 rounded-2xl shadow-2xl w-[95%] max-w-md" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setMenuFalse()} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors font-bold">❌</button>
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-gray-600">Hora inicial:</p><input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} ref={startRef}/>
            <p className="text-sm font-medium text-gray-600">Hora final:</p><input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} ref={endRef}/>
            <p className="text-sm font-medium text-gray-600">Título:</p><input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" type="text" value={title} onChange={(e) => setTitle(e.target.value)}/>
            {/* faz o botão de deçete aparecer se for o dono ou se for cliente e ainda tiver pendente */}
            {(clickEvent == "clientpend" || clickEvent.includes("owner")) && 
              <button onClick={(e) => deleteEvento()} className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 active:scale-95 transition"> Deletar </button>}
              
            {/* faz o botão de confirmar aparecer somente para o dono e somente se pendente */}
            {(clickEvent == "ownerpend") && 
              <button onClick={(e) => {setStatus("confirmado"); setMenuFalse()}} className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-95 transition"> Confirmar este evento </button>}

            <button className="ml-auto px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all" onClick={() => {

              const hasEvent = eventos.some(e => e.id === eventoSelecionadoId)

              if (!hasEvent && clickEvent !== "stranger") { //basicamente verifica se ningúem deltou o evento enquano o seu menu estava aberto
                alert("Esse evento não existe mais.")
                setMenuFalse()
                return
              }
              if (!selectedDate) return;

              if (endTime <= startTime) {
                alert("Hora final precisa ser maior que inicial");
                return;
              }

              const inicio = combinarDataHora(selectedDate, startTime);
              const fim = combinarDataHora(selectedDate, endTime);

              if (clickEvent == "stranger") {
                inserirEvento(title, inicio, fim)
              } else if (clickEvent == "clientpend" || clickEvent == "ownerpend"){
                updateEvento(title, inicio, fim)
              }
              
              setMenuFalse()
            }}>Confirmar</button>
          </div>
        </div>

      </div>

    </div>
  );
}

function Agendamento() {
  return <Calendario />;
}

export default Agendamento;