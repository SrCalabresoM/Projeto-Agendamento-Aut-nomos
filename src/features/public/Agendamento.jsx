import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBr from "@fullcalendar/core/locales/pt-br";
import { useState, useRef, useEffect } from "react";

function Calendario() {
  const [eventos, setEventos] = useState([]);
  const calendarRef = useRef(null); 
  const [menu, setMenu] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:15");
  const [selectedDate, setSelectedDate] = useState(null);
  const startRef = useRef();
  const endRef = useRef();
  const titleRef = useRef();

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
        setMenu(false);
      }
    }

    if (menu) {
      window.addEventListener("keydown", fecharComEsc);
    }

    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [menu]);


  return (
    <>
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
            const start = info.dateStr.slice(11, 16);
            setStartTime(start);
            setEndTime(somarMinutos(start, "00:15:00")); // 15 minutos
            setSelectedDate(info.date);
            setMenu(true);
          }
        }}

        eventClick={(info) => {

          info.event.remove();
        }}

        selectAllow={(selectInfo) => {
          const agora = new Date();
          return selectInfo.start > agora;
        }}
      />

      {/*menu*/}
      <div style={{ display: menu ? "flex" : "none" }} className="fixed inset-0 z-50 flex items-center justify-center">

        {/* overlay escuro */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200" onClick={() => {setMenu(false)}}></div>

        <div className="relative bg-white p-6 rounded-xl shadow-xl transition-all duration-200" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setMenu(false)} className="absolute font-bold top-1 right-3">❌</button>
          <div className="flex justify-items-center">
            <p>Hora inicial: </p><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} ref={startRef}/>
            <p>Hora final: </p><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} ref={endRef}/>
            <p>Título: </p><input type="text" defaultValue={"Servição top"} ref={titleRef}/>

            <button onClick={() => {
              if (!selectedDate) return;

              if (endTime <= startTime) {
                alert("Hora final precisa ser maior que inicial");
                return;
              }

              const inicio = combinarDataHora(selectedDate, startTime);
              const fim = combinarDataHora(selectedDate, endTime);

              const novoEvento = {
                title: titleRef.current.value,
                start: inicio,
                end: fim
              };
              
              setEventos((prev) => [...prev, novoEvento]);
              setMenu(false)
            }}>Confirmar</button>
          </div>
        </div>

      </div>

    </>
  );
}

function Agendamento() {
  return <Calendario />;
}

export default Agendamento;
