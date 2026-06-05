import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBr from "@fullcalendar/core/locales/pt-br";
import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "react-router-dom";
import { useAuth } from "../../shared/useAuth";
import {
  gerarBloqueios,
  horarioBloqueado,
  repeatEvento,
  updateEvento,
  updateAll,
  setStatus,
  deleteEvento,
  deleteAll,
  somarMinutos,
  combinarDataHora
} from "./Agendamento.functions";

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
  const [title, setTitle] = useState("");
  const [bloqueiosGerados, setBloqueiosGerados] = useState([]);
  const [repeatCount, setRepeatCount] = useState(0);
  const [repeatInterval, setRepeatInterval] = useState(7);
  const [eventRecurrence, setEventRecurrrence] = useState(null);
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
              recurrence_uuid: evento.recurrence_uuid,
              status: evento.status
            }
          }
        });
        
      setEventos(eventosFormatados.concat(bloqueiosGerados));
    }

    carregarEventos(); //funciona sempre que profssionalId mudar

    const canal = supabase
      .channel(`monitor-updates-${profissionalId}-${Date.now()}`)
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
  }, [profissionalId, isOwner, perfil]);

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


  function setMenuFalse() { //substitui o setMenu(false) com vários resets necessários
    setMenu(false);
    setClickEvent("stranger");
    setEventoSelecionadoId(null);
    setSelectedDate(null);
    setTitle("");
    setRepeatCount(0);
    setRepeatInterval(7);
    setEventRecurrrence(null);
  }

  const everyEvents = useMemo(() => {
    return [...eventos, ...bloqueiosGerados];
  }, [eventos, bloqueiosGerados]);

  const diasTrabalho = [1,2,3,4,5] //segunda a sexta
  const hidden = [0,1,2,3,4,5,6].filter(d => !diasTrabalho.includes(d))
  return (
    <div className="w-full max-w-6xl mx-auto mt-10 px-4">
      <FullCalendar
        ref={calendarRef} 


        slotDuration="00:15:00" // 30 minutos
        slotMinTime="08:00:00" //das 8h
        slotMaxTime="18:01:00" //até 18h

        hiddenDays={hidden}

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

        events={everyEvents}

        validRange={!isOwner ? { start: new Date() } : undefined}

        datesSet={(info) => {
          gerarBloqueios(info.start, info.end, setBloqueiosGerados);
        }}

        dateClick={(info) => {
          const calendarApi = calendarRef.current.getApi();
          const agora = new Date();

          if ((horarioBloqueado(info.date)) || (info.date <= agora)) return;

          if (calendarApi.view.type !== "timeGridDay") {
            calendarApi.changeView("timeGridDay", info.date);
          } else {
            if (!user) {
              window.location.href = "/login";
              return;
            }
            const start = info.dateStr.slice(11, 16);
            setStartTime(start);
            setEndTime(somarMinutos(start, "00:15:00")); // 30 minutos
            setSelectedDate(info.date);
            setTitle("Servição top")
            setMenu(true);
          }
        }}

        eventClick={(info) => {
          //define os status do eventClick

          if (info.event.id.includes("block") || (info.event.start <= new Date())) return;

          if (isOwner) {
            setClickEvent(info.event.extendedProps.status == "pendente" ? "ownerpend" : "ownerconf");
            setMenu(true);
          } else if (info.event.extendedProps.client_id == user?.id && info.event.extendedProps.status == "pendente") {
            setClickEvent(info.event.extendedProps.status == "pendente" ? "clientpend" : "clientconf");
            setMenu(true);
          }
          setTitle(info.event.title)
          setEventRecurrrence(info.event.extendedProps.recurrence_uuid)
          setEventoSelecionadoId(info.event.id)
          setSelectedDate(info.event.start)
          setStartTime(info.event.startStr.slice(11, 16))
          setEndTime(info.event.endStr.slice(11, 16))
        }}

        dayCellClassNames={(arg) => {
          const agora = new Date().setHours(0,0,0,0);
          const dia = new Date(arg.date).setHours(0,0,0,0)

          if (dia < agora) {
            return ['fc-dia-passado'];
          }

          return [];
        }}

        eventClassNames={(arg) => {
          const classes = []

          if (arg.event.start <= new Date()) {
            classes.push('evento-passado')
          }

          if (horarioBloqueado(arg.event.start)) {
            classes.push('evento-bloqueado')
          }

          return classes
        }}

        selectAllow={(selectInfo) => {
          const agora = new Date();

          if (selectInfo.start <= agora) return false;

          let current = new Date(selectInfo.start);

          while (current < selectInfo.end) {
            if (horarioBloqueado(current)) return false;
            current.setMinutes(current.getMinutes() + 30); // ajuste para seu slotDuration
          }

          return true;
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
            
            {clickEvent == "stranger" && <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <input type="checkbox" checked={repeatCount > 0} onChange={(e) => setRepeatCount(e.target.checked ? 1 : 0)}/>
              Repetir evento
            </label>}

            {/* Lança de marcar repetir*/}
            {repeatCount > 0 && <>
              <p className="text-sm font-medium text-gray-600">Intervalo:</p>
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value={repeatInterval} onChange={(e) => setRepeatInterval(Number(e.target.value))}>
                <option value={7}>1 semana</option>
                <option value={14}>2 semanas</option>
                <option value={21}>3 semanas</option>
                <option value={30}>1 mês</option>
              </select>

              <p className="text-sm font-medium text-gray-600">Quantidade de repetições:</p>
              <input className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" type="number" min="1" max="30" value={repeatCount} onChange={(e) => setRepeatCount(Number(e.target.value))}/>
            </>}

            {/* faz o botão de deçete aparecer se for o dono ou se for cliente e ainda tiver pendente */}
            {(clickEvent == "clientpend" || clickEvent.includes("owner")) && 
              <button onClick={(e) => deleteEvento(eventoSelecionadoId, setMenuFalse)} className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 active:scale-95 transition"> Deletar </button>}   

            {/* deletar todos se for recorrencia */}
            {(eventRecurrence && (clickEvent == "clientpend" || clickEvent.includes("owner"))) &&
              <button onClick={(e) => {deleteAll(eventRecurrence, setMenuFalse); setMenuFalse()}} className="px-4 py-2 rounded-lg bg-red-700 text-white font-medium hover:bg-red-800 active:scale-95 transition"> Deletar todos </button>}

            {/* faz o botão de confirmar aparecer somente para o dono e somente se pendente */}
            {(clickEvent == "ownerpend") && 
              <button onClick={(e) => {setStatus("confirmado", eventoSelecionadoId); setMenuFalse()}} className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-95 transition"> Confirmar este evento </button>}
            
            <button className="ml-auto px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all" onClick={() => {

              const inicio = combinarDataHora(selectedDate, startTime);
              const fim = combinarDataHora(selectedDate, endTime);

              const conflito = eventos.some(ev =>
                ev.id !== eventoSelecionadoId &&
                inicio < new Date(ev.end) &&
                fim > new Date(ev.start)
              )

              const conflitoDeIntervalo = bloqueiosGerados.some(ev =>
                inicio < new Date(ev.end) &&
                fim > new Date(ev.start)
              )

              if (conflitoDeIntervalo) {
                alert("O profissional bloqueou esse horário.")
                return
              } else if (conflito) {
                alert("Esse horário já está ocupado.")
                return
              }

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

              if (clickEvent == "stranger") {
                repeatEvento(title, inicio, fim, profissionalId, user, repeatCount, repeatInterval)
              } else if (clickEvent == "clientpend" || clickEvent == "ownerpend"){
                updateEvento(title, inicio, fim, eventoSelecionadoId)
              }
              console.log(title, inicio, fim, eventoSelecionadoId)
              
              setMenuFalse()
            }}>Confirmar</button>

            {/* confirmar todos se for recorrencia */}
            {(eventRecurrence && (clickEvent == "clientpend" || clickEvent == "ownerpend")) &&
              <button className="ml-auto px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all" onClick={() => {

                const inicio = combinarDataHora(selectedDate, startTime);
                const fim = combinarDataHora(selectedDate, endTime);

                updateAll(title, inicio, fim, eventRecurrence)
                setMenuFalse()

            }}>Confirmar todos</button>}
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